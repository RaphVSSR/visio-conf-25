import User from "../User.ts";
import File from "../File.ts";
import Space from "../Space.ts";
import { getMessagesByDomain } from "../ListeMessages.ts";

type MessageHandler = (socketId: string, payload: any) => void;

export default class FilesService {
	controleur: any;
	nomDInstance: string;
	io: any;
	private handlers = new Map<string, MessageHandler>();

	constructor(controleur: any, io: any, name: string = "FilesService") {
		this.controleur = controleur;
		this.io = io;
		this.nomDInstance = name;
		console.log(`[${this.nomDInstance}] Service enregistré auprès du controleur`);
	}

	private registerHandler(messageName: string, handler: MessageHandler) {
		this.handlers.set(messageName, handler);
	}

	private send(socketIds: string | string[], messageName: string, payload: unknown) {
		const ids = Array.isArray(socketIds) ? socketIds : [socketIds];
		this.controleur.envoie(this, { [messageName]: payload, id: ids });
	}

	register() {
		this.registerHandler("get_files", this.handleGetFiles);
		this.registerHandler("upload_file", this.handleUploadFile);
		this.registerHandler("update_file", this.handleUpdateFile);
		this.registerHandler("delete_file", this.handleDeleteFile);
		this.registerHandler("create_space", this.handleCreateSpace);
		this.registerHandler("get_spaces", this.handleGetSpaces);
		this.registerHandler("delete_space", this.handleDeleteSpace);
		this.registerHandler("rename_space", this.handleRenameSpace);
		this.registerHandler("resolve_path", this.handleResolvePath);
		this.registerHandler("update_space_members", this.handleUpdateSpaceMembers);

		const outgoing = getMessagesByDomain("files").received;
		this.controleur.inscription(this, outgoing, [...this.handlers.keys()]);
	}

	traitementMessage(msg: any) {
		const action = Object.keys(msg).find((prop) => prop !== "id");
		if (!action) return;
		const handler = this.handlers.get(action);
		if (handler) handler(msg.id, msg[action]);
	}

	private async isAdmin(userId: string): Promise<boolean> {
		const user = await User.model.findById(userId).populate("roles");
		if (!user) return false;
		return (user.roles as any[]).some((role: any) => role.label && role.label.toLowerCase() === "admin");
	}

	// --- Helper: check access for team/personal/global ---
	async checkSpaceAccess(space: any, userId: string) {
		const isOwner = space.owner.toString() === userId;
		const isMember = space.members && space.members.some((id: any) => id.toString() === userId);

		if (space.category === "team") return isOwner || isMember;
		if (space.category === "personal") return isOwner;
		return true; // global
	}

	async checkParentChainAccess(space: any, userId: string) {
		if (await this.checkSpaceAccess(space, userId)) return true;
		if (!space.parent) return false;

		let currentParentId = space.parent;
		while (currentParentId) {
			const parentSpace = await Space.model.findById(currentParentId);
			if (!parentSpace) break;
			if (
				parentSpace.owner.toString() === userId ||
				(parentSpace.members && parentSpace.members.some((id: any) => id.toString() === userId))
			) {
				return true;
			}
			currentParentId = parentSpace.parent;
		}
		return false;
	}

	// Reliable broadcast helper (uses DB-stored socket_id)
	async broadcastToAuthorized(
		senderSocketId: string,
		eventPayload: any,
		category: string,
		ownerId: string,
		memberIds?: string[],
	) {
		const msgStr = JSON.stringify(eventPayload);
		try {
			if (category === "global") {
				this.io.emit("message", msgStr);
			} else if (category === "team") {
				const authorizedIds = [...new Set([ownerId, ...(memberIds || [])])];
				const onlineUsers = await User.model.find(
					{
						_id: { $in: authorizedIds },
						is_online: true,
						socket_id: { $ne: null },
					},
					"socket_id",
				);
				for (const u of onlineUsers) {
					if (u.socket_id && u.socket_id !== senderSocketId) {
						this.io.to(u.socket_id).emit("message", msgStr);
					}
				}
			} else if (category === "personal") {
				const owner = await User.model.findById(ownerId, "socket_id is_online");
				if (owner && owner.is_online && owner.socket_id && owner.socket_id !== senderSocketId) {
					this.io.to(owner.socket_id).emit("message", msgStr);
				}
			}
		} catch (e) {
			console.error("broadcastToAuthorized error:", e);
		}
	}

	// --- Handlers ---

	handleGetFiles = async (socketId: string, data: any) => {
		const { userId, spaceId, type, category } = data;
		try {
			let effectiveCategory = category || (["personal", "global", "team"].includes(type) ? type : "global");
			if (spaceId) {
				const space = await Space.model.findById(spaceId);
				if (space) effectiveCategory = space.category;
			}
			let query: any = {};

			if (spaceId) {
				const space = await Space.model.findById(spaceId);
				if (!space) return;
				const user = await User.model.findById(userId);
				if (!user) return;

				const hasAccess = await this.checkParentChainAccess(space, userId);
				if (!hasAccess) {
					return this.controleur.envoie(this, {
						files: { success: false, error: "Accès au dossier refusé" },
						id: [socketId],
					});
				}
				query.space = spaceId;
			} else {
				query.space = { $in: [null, undefined] };
				query.category = effectiveCategory;
				if (effectiveCategory === "personal" || effectiveCategory === "team") {
					query.owner = userId;
				}
			}

			const files = await File.model.find(query).populate("owner", "firstname roles").sort({ createdAt: -1 });
			this.controleur.envoie(this, {
				files: { success: true, files },
				id: [socketId],
			});
		} catch (e) {
			console.error("Get files error:", e);
		}
	};

	handleUploadFile = async (socketId: string, data: any) => {
		const { name, size, type, url, userId, spaceId, category } = data;
		try {
			const user = await User.model.findById(userId);
			if (!user) return;

			let effectiveCategory = category || "personal";
			if (spaceId) {
				const space = await Space.model.findById(spaceId);
				if (space) effectiveCategory = space.category;
			}

			// Removed admin check to allow everyone to upload files

			// Allowed global upload for everyone

			if (spaceId) {
				const space = await Space.model.findById(spaceId);
				if (!space) return;
				const hasAccess = await this.checkParentChainAccess(space, userId);
				if (!hasAccess) {
					return this.controleur.envoie(this, {
						file_uploading_status: { success: false, error: "Accès au dossier refusé" },
						id: [socketId],
					});
				}
			}

			const newFile = new File.model({
				name,
				size,
				type,
				url,
				owner: userId,
				space: spaceId || undefined,
				category: effectiveCategory,
			});
			await newFile.save();
			const fullFile = await File.model.findById(newFile._id).populate("owner", "firstname roles");

			this.controleur.envoie(this, {
				file_uploading_status: { success: true, file: fullFile },
				id: [socketId],
			});

			// Broadcast
			let uploadMemberIds: string[] = [];
			if (fullFile && fullFile.category === "team" && fullFile.space) {
				const associatedSpace = await Space.model.findById(fullFile.space);
				if (associatedSpace) {
					uploadMemberIds = (associatedSpace.members || []).map((m: any) => m.toString());
					uploadMemberIds.push(associatedSpace.owner.toString());
				}
			}
			if (fullFile) {
				await this.broadcastToAuthorized(
					socketId,
					{ file_uploading_status: { success: true, file: fullFile } },
					fullFile.category,
					fullFile.owner._id.toString(),
					uploadMemberIds,
				);
			}
		} catch (e) {
			console.error("Upload file error:", e);
			this.controleur.envoie(this, {
				file_uploading_status: { success: false, error: "Erreur lors de l'upload" },
				id: [socketId],
			});
		}
	};

	handleUpdateFile = async (socketId: string, data: any) => {
		const { fileId, newName, userId } = data;
		try {
			const user = await User.model.findById(userId);
			const file = await File.model.findById(fileId);
			if (!user || !file) return;

			const isOwner = file.owner.toString() === userId;
			let isAuthorized = false;
			if (file.category === "team") isAuthorized = isOwner;
			else if (file.category === "personal") isAuthorized = isOwner;
			else isAuthorized = true;

			if (!isAuthorized) {
				return this.controleur.envoie(this, {
					file_updating_status: { success: false, error: "Permission refusée" },
					id: [socketId],
				});
			}

			file.name = newName;
			await file.save();

			this.controleur.envoie(this, {
				file_updating_status: { success: true, fileId, newName },
				id: [socketId],
			});

			let updateMemberIds: string[] = [];
			if (file.category === "team" && file.space) {
				const associatedSpace = await Space.model.findById(file.space);
				if (associatedSpace) {
					updateMemberIds = (associatedSpace.members || []).map((m: any) => m.toString());
					updateMemberIds.push(associatedSpace.owner.toString());
				}
			}
			await this.broadcastToAuthorized(
				socketId,
				{ file_updating_status: { success: true, fileId, newName } },
				file.category,
				file.owner.toString(),
				updateMemberIds,
			);
		} catch (e) {
			console.error("Update file error:", e);
		}
	};

	handleDeleteFile = async (socketId: string, data: any) => {
		const { fileId, userId } = data;
		try {
			const user = await User.model.findById(userId);
			const file = await File.model.findById(fileId);
			if (!user || !file) return;

			const isOwner = file.owner.toString() === userId;
			const isStaff = true; // Placeholder

			let isAuthorized = false;
			if (file.category === "team") {
				isAuthorized = isOwner;
			} else if (file.category === "personal") {
				isAuthorized = isOwner;
			} else if (file.category === "global") {
				isAuthorized = isStaff;
			}

			if (!isAuthorized) {
				return this.controleur.envoie(this, {
					file_deleting_status: { success: false, error: "Permission refusée" },
					id: [socketId],
				});
			}

			await File.model.findByIdAndDelete(fileId);

			this.controleur.envoie(this, {
				file_deleting_status: { success: true, fileId },
				id: [socketId],
			});

			let delMemberIds: string[] = [];
			if (file.category === "team" && file.space) {
				const associatedSpace = await Space.model.findById(file.space);
				if (associatedSpace) {
					delMemberIds = (associatedSpace.members || []).map((m: any) => m.toString());
					delMemberIds.push(associatedSpace.owner.toString());
				}
			}
			await this.broadcastToAuthorized(
				socketId,
				{ file_deleting_status: { success: true, fileId } },
				file.category,
				file.owner.toString(),
				delMemberIds,
			);
		} catch (e) {
			console.error("Delete file error:", e);
			this.controleur.envoie(this, {
				file_deleting_status: { success: false, error: "Erreur lors de la suppression" },
				id: [socketId],
			});
		}
	};

	handleCreateSpace = async (socketId: string, data: any) => {
		const { name, userId, category, members, parentId } = data;
		try {
			const user = await User.model.findById(userId);
			if (!user) return;

			let effectiveCategory = category || "personal";
			if (parentId) {
				const parent = await Space.model.findById(parentId);
				if (parent) effectiveCategory = parent.category;
			}

			// Removed admin check to allow everyone to create folders

			// Allowed global space creation for everyone

			if (parentId) {
				const parentSpace = await Space.model.findById(parentId);
				if (parentSpace) {
					const hasAccess = await this.checkParentChainAccess(parentSpace, userId);
					if (!hasAccess && effectiveCategory !== "global") {
						return this.controleur.envoie(this, {
							space_creating_status: { success: false, error: "Permission refusée (parent)" },
							id: [socketId],
						});
					}
				}
			}

			let finalMembers = members || [];
			if (parentId && effectiveCategory === "team") {
				const parentSpace = await Space.model.findById(parentId);
				if (parentSpace && parentSpace.members) {
					finalMembers = parentSpace.members;
				}
			}

			const newSpace = new Space.model({
				name,
				owner: userId,
				category: effectiveCategory,
				parent: parentId || null,
				members: finalMembers,
				isPersonal: effectiveCategory === "personal",
			});
			await newSpace.save();

			const fullSpace = await Space.model
				.findById(newSpace._id)
				.populate("members", "firstname roles")
				.populate("owner", "firstname roles");

			if (fullSpace) {
				this.controleur.envoie(this, {
					space_creating_status: { success: true, space: fullSpace },
					id: [socketId],
				});

				await this.broadcastToAuthorized(
					socketId,
					{ space_creating_status: { success: true, space: fullSpace } },
					fullSpace.category,
					fullSpace.owner._id.toString(),
					(fullSpace.members || []).map((m: any) => m._id.toString()),
				);
			}
		} catch (e) {
			console.error("Create space error:", e);
			this.controleur.envoie(this, {
				space_creating_status: { success: false, error: "Erreur lors de la création" },
				id: [socketId],
			});
		}
	};

	handleGetSpaces = async (socketId: string, data: any) => {
		const { userId, category, type, parentId } = data;
		try {
			let query: any = { parent: parentId ? parentId : { $in: [null, undefined] } };
			let effectiveCategory = category || (["personal", "global", "team"].includes(type) ? type : "global");

			if (parentId) {
				const parent = await Space.model.findById(parentId);
				if (parent) effectiveCategory = parent.category;
			}

			const user = await User.model.findById(userId);
			if (!user) return;

			if (effectiveCategory === "personal") {
				query.owner = userId;
				query.category = "personal";
			} else if (effectiveCategory === "global") {
				query.category = "global";
			} else if (effectiveCategory === "team") {
				query.category = "team";
				query.$or = [{ owner: userId }, { members: userId }];
			}

			const spaces = await Space.model
				.find(query)
				.populate("members", "firstname roles")
				.populate("owner", "firstname roles")
				.sort({ name: 1 });

			this.controleur.envoie(this, {
				spaces: { success: true, spaces, parentId: parentId || null },
				id: [socketId],
			});
		} catch (e) {
			console.error("Get spaces error:", e);
		}
	};

	handleDeleteSpace = async (socketId: string, data: any) => {
		const { spaceId, userId } = data;
		try {
			const user = await User.model.findById(userId);
			const space = await Space.model.findById(spaceId);
			if (!user || !space) return;

			const isOwner = space.owner.toString() === userId;
			const isStaff = true; // Placeholder

			let isAuthorized = false;
			if (space.category === "team") {
				isAuthorized = isOwner;
			} else if (space.category === "personal") {
				isAuthorized = isOwner;
			} else if (space.category === "global") {
				isAuthorized = isStaff;
			}

			if (!isAuthorized) {
				return this.controleur.envoie(this, {
					space_deleting_status: { success: false, error: "Permission refusée" },
					id: [socketId],
				});
			}

			await File.model.updateMany({ space: spaceId }, { $unset: { space: "" } });
			await Space.model.findByIdAndDelete(spaceId);

			this.controleur.envoie(this, {
				space_deleting_status: { success: true, spaceId },
				id: [socketId],
			});

			await this.broadcastToAuthorized(
				socketId,
				{ space_deleting_status: { success: true, spaceId } },
				space.category,
				space.owner.toString(),
				(space.members || []).map((m: any) => m.toString()),
			);
		} catch (e) {
			console.error("Delete space error:", e);
			this.controleur.envoie(this, {
				space_deleting_status: { success: false, error: "Erreur lors de la suppression" },
				id: [socketId],
			});
		}
	};

	handleRenameSpace = async (socketId: string, data: any) => {
		const { spaceId, newName, userId } = data;
		try {
			const user = await User.model.findById(userId);
			const space = await Space.model.findById(spaceId);
			if (!user || !space) return;

			const isOwner = space.owner.toString() === userId;
			let isAuthorized = false;
			if (space.category === "team") isAuthorized = isOwner;
			else if (space.category === "personal") isAuthorized = isOwner;
			else isAuthorized = true;

			if (!isAuthorized) {
				return this.controleur.envoie(this, {
					space_renaming_status: { success: false, error: "Permission refusée" },
					id: [socketId],
				});
			}

			space.name = newName;
			await space.save();

			this.controleur.envoie(this, {
				space_renaming_status: { success: true, spaceId, newName },
				id: [socketId],
			});

			await this.broadcastToAuthorized(
				socketId,
				{ space_renaming_status: { success: true, spaceId, newName } },
				space.category,
				space.owner.toString(),
				(space.members || []).map((m: any) => m.toString()),
			);
		} catch (e) {
			console.error("Rename space error:", e);
		}
	};

	handleUpdateSpaceMembers = async (socketId: string, data: any) => {
		const { spaceId, members, userId } = data;
		try {
			const user = await User.model.findById(userId);
			const space = await Space.model.findById(spaceId);
			if (!user || !space) return;

			const isOwner = space.owner.toString() === userId;
			const isStaff = true; // Placeholder

			if (!isOwner && !isStaff) {
				return this.controleur.envoie(this, {
					space_members_updating_status: { success: false, error: "Permission refusée" },
					id: [socketId],
				});
			}

			const oldMemberIdsStr = (space.members || []).map((m: any) => m.toString());

			space.members = members;
			await space.save();

			const updatedSpace = await Space.model
				.findById(spaceId)
				.populate("members", "firstname roles picture")
				.populate("owner", "firstname roles picture");

			if (updatedSpace) {
				const response = {
					space_members_updating_status: { success: true, space: updatedSpace },
					id: [socketId],
				};
				this.controleur.envoie(this, response);

				const ownerIdStr = updatedSpace.owner._id ? updatedSpace.owner._id.toString() : updatedSpace.owner.toString();
				const newMemberIdsStr = (updatedSpace.members || []).map((m: any) => (m._id || m).toString());
				const allUsersToNotify = Array.from(new Set([...oldMemberIdsStr, ...newMemberIdsStr]));

				await this.broadcastToAuthorized(
					socketId,
					{ space_members_updating_status: { success: true, space: updatedSpace } },
					updatedSpace.category,
					ownerIdStr,
					allUsersToNotify,
				);
			}
		} catch (e) {
			console.error("Update space members error:", e);
			this.controleur.envoie(this, {
				space_members_updating_status: { success: false, error: "Erreur lors de la mise à jour des membres" },
				id: [socketId],
			});
		}
	};

	handleResolvePath = async (socketId: string, data: any) => {
		const { path, category, userId } = data;
		const names = path || [];
		try {
			let currentParentId: any = null;
			let resolvedPath: any[] = [];
			let finalCategory = category || "personal";

			let matchFound = true;
			for (const name of names) {
				let parentQuery = currentParentId ? currentParentId : { $in: [null, undefined] };
				let query: any = {
					name: { $regex: new RegExp("^" + name + "$", "i") },
					parent: parentQuery,
					category: finalCategory,
				};

				if (finalCategory === "personal") query.owner = userId;
				if (finalCategory === "team") {
					query.$or = [{ owner: userId }, { members: userId }];
				}

				let space = await Space.model.findOne(query).populate("owner", "firstname roles");

				if (!space && currentParentId) {
					space = await Space.model.findOne({ name, parent: currentParentId }).populate("owner", "firstname roles");
				}

				if (!space) {
					matchFound = false;
					break;
				}
				resolvedPath.push(space);
				currentParentId = space._id;
				finalCategory = space.category || finalCategory;
			}

			if (!matchFound && resolvedPath.length === 0) {
				const silos = ["personal", "global", "team"];
				for (const s of silos) {
					if (s === category) continue;
					currentParentId = null;
					resolvedPath = [];
					let subMatch = true;
					for (const name of names) {
						let parentQuery = currentParentId ? currentParentId : { $in: [null, undefined] };
						let query: any = { name: { $regex: new RegExp("^" + name + "$", "i") }, parent: parentQuery, category: s };
						if (s === "personal") query.owner = userId;
						if (s === "team") {
							query.$or = [{ owner: userId }, { members: userId }];
						}
						const space = await Space.model.findOne(query).populate("owner", "firstname roles");
						if (!space) {
							subMatch = false;
							break;
						}
						resolvedPath.push(space);
						currentParentId = space._id;
					}
					if (subMatch) {
						finalCategory = s;
						matchFound = true;
						break;
					}
				}
			}

			if (matchFound) {
				this.controleur.envoie(this, {
					resolved_path: { success: true, path: resolvedPath, category: finalCategory },
					id: [socketId],
				});
			} else {
				this.controleur.envoie(this, {
					resolved_path: { success: false, error: "Path not found" },
					id: [socketId],
				});
			}
		} catch (e) {
			console.error("Resolve path error:", e);
			this.controleur.envoie(this, {
				resolved_path: { success: false, error: "Erreur interne" },
				id: [socketId],
			});
		}
	};
}
