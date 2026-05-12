import Role from "../Role.ts";
import AccessRoleGuard from "./AccessRoleGuard.ts";
import Controleur from "../../Controller/controleur";
import { Message } from "../ListeMessages.ts";

export default class RoleService {
	controleur: Controleur;
	nomDInstance: string;

	msgEmitted: string[] = [
		"roles", "role",
		"role_creating_status", "role_already_exists",
		"role_updating_status", "role_deleting_status",
	];
	msgReceived: string[] = [
		"get_roles", "get_role",
		"create_role", "update_role", "delete_role",
	];

	constructor(controleur: any, name: string) {
		this.controleur = controleur;
		this.nomDInstance = name;
	}

	private send(socketIds: string | string[], messageName: string, payload: unknown) {
		const ids = Array.isArray(socketIds) ? socketIds : [socketIds];
		this.controleur.envoie(this, { [messageName]: payload, id: ids });
	}

	traitementMessage(message: Message) {
		const action = Object.keys(message).find((prop) => prop !== "id");
		if (!action) return;

		switch (action) {
			case "get_roles":    return this.handleGetRoles(message.id!);
			case "get_role":     return this.handleGetRole(message.id!, message.get_role);
			case "create_role":  return this.handleCreateRole(message.id!, message.create_role);
			case "update_role":  return this.handleUpdateRole(message.id!, message.update_role);
			case "delete_role":  return this.handleDeleteRole(message.id!, message.delete_role);
		}
	}

	register() {
		this.controleur.inscription(this, this.msgEmitted, this.msgReceived);
	}

	private handleGetRoles = async (socketId: string) => {
		try {
			const roles = await Role.model.find().lean();
			this.send(socketId, "roles", roles);
		} catch (err) {
			console.error("INFO (" + this.nomDInstance + "): erreur get_roles", err);
		}
	};

	private handleGetRole = async (socketId: string, payload: { role_id: string }) => {
		try {
			const role = await Role.model.findOne({ _id: payload.role_id }).lean();
			this.send(socketId, "role", role);
		} catch (err) {
			console.error("INFO (" + this.nomDInstance + "): erreur get_role", err);
		}
	};

	private handleCreateRole = async (socketId: string, payload: { name: string; perms: any[] }) => {
		try {
			const guard = await AccessRoleGuard.requireRole(socketId, "admin");
			if (!guard.authorized)
				return this.send(socketId, "role_creating_status", { success: false, message: guard.reason });

			const existing = await Role.model.findOne({ label: payload.name });
			if (existing == null) {
				const newRole = new Role.model({
					uuid: payload.name.toLowerCase().replace(/ /g, "_"),
					label: payload.name,
					permissions: payload.perms || [],
					default: false,
				});
				const r = await newRole.save();
				this.send(socketId, "role_creating_status", { success: true, role_id: r._id });
			} else {
				this.send(socketId, "role_already_exists", { message: "Ce rôle existe déjà" });
			}
		} catch (err) {
			console.error("INFO (" + this.nomDInstance + "): erreur create_role", err);
			this.send(socketId, "role_creating_status", { success: false, message: "Erreur serveur" });
		}
	};

	private handleUpdateRole = async (socketId: string, payload: { role_id: string; name?: string; perms?: any[] }) => {
		try {
			const guard = await AccessRoleGuard.requireRole(socketId, "admin");
			if (!guard.authorized)
				return this.send(socketId, "role_updating_status", { success: false, message: guard.reason });

			const updateData: any = {};
			if (payload.name) {
				updateData.label = payload.name;
				updateData.uuid = payload.name.toLowerCase().replace(/ /g, "_");
			}
			if (payload.perms) updateData.permissions = payload.perms;

			await Role.model.updateOne({ _id: payload.role_id }, { $set: updateData });
			this.send(socketId, "role_updating_status", { success: true });
		} catch (err) {
			console.error("INFO (" + this.nomDInstance + "): erreur update_role", err);
			this.send(socketId, "role_updating_status", { success: false, message: "Erreur serveur" });
		}
	};

	private handleDeleteRole = async (socketId: string, payload: { role_id: string }) => {
		try {
			const guard = await AccessRoleGuard.requireRole(socketId, "admin");
			if (!guard.authorized)
				return this.send(socketId, "role_deleting_status", { success: false, message: guard.reason });

			await Role.model.deleteOne({ _id: payload.role_id });
			this.send(socketId, "role_deleting_status", { success: true });
		} catch (err) {
			console.error("INFO (" + this.nomDInstance + "): erreur delete_role", err);
			this.send(socketId, "role_deleting_status", { success: false, message: "Erreur serveur" });
		}
	};
}
