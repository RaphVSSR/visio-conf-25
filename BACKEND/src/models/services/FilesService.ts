import User from "../User.ts";
import File from "../File.ts";
import Space from "../Space.ts";
import { getMessagesByDomain } from "../ListeMessages.ts";

type MessageHandler = (socketId: string, payload: any) => void;

export default class FilesService {
    controleur: any;
    nomDInstance: string;
    private handlers = new Map<string, MessageHandler>();

    constructor(controleur: any, name: string = 'FilesService') {
        this.controleur = controleur;
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
        const action = Object.keys(msg).find(prop => prop !== "id");
        if (!action) return;
        const handler = this.handlers.get(action);
        if (handler) handler(msg.id, msg[action]);
    }


    private async isAdmin(userId: string): Promise<boolean> {
        const user = await User.model.findById(userId).populate('roles');
        if (!user) return false;
        return (user.roles as any[]).some((role: any) => role.label && role.label.toLowerCase() === 'admin');
    }

    // Simplification : tout est désormais global et partagé avec tout le monde.
    // Seuls les admins peuvent effectuer des modifications (upload, create folder, delete, rename).

    // Reliable broadcast helper (uses DB-stored socket_id)
    async broadcastToAuthorized(senderSocketId: string, eventPayload: any, _category: string, _ownerId: string, _memberIds?: string[]) {
        try {
            // Tout est global désormais : broadcast à tous les utilisateurs connectés
            this.controleur.envoie(this, eventPayload);
        } catch (e) {
            console.error('broadcastToAuthorized error:', e);
        }
    }

    // --- Handlers ---

    handleGetFiles = async (socketId: string, data: any) => {
        const { spaceId } = data;
        try {
            let query: any = {};
            if (spaceId) {
                query.space = spaceId;
            } else {
                query.space = { $in: [null, undefined] };
            }

            // Tout le monde peut voir tous les fichiers (catégorie ignorée car tout est global)
            const files = await File.model.find(query).populate('owner', 'firstname roles').sort({ createdAt: -1 });
            this.controleur.envoie(this, {
                files: { success: true, files },
                id: [socketId]
            });
        } catch (e) {
            console.error('Get files error:', e);
        }
    }

    handleUploadFile = async (socketId: string, data: any) => {
        const { name, size, type, url, userId, spaceId } = data;
        try {
            const user = await User.model.findById(userId);
            if (!user) return;

            // Seuls les admins peuvent uploader
            const admin = await this.isAdmin(userId);
            if (!admin) {
                return this.controleur.envoie(this, {
                    file_uploading_status: { success: false, error: 'Seuls les administrateurs peuvent ajouter des fichiers' },
                    id: [socketId]
                });
            }

            const newFile = new File.model({
                name, size, type, url, owner: userId,
                space: spaceId || undefined,
                category: 'global' // Tout est global désormais
            });
            await newFile.save();
            const fullFile = await File.model.findById(newFile._id).populate('owner', 'firstname roles');

            this.controleur.envoie(this, {
                file_uploading_status: { success: true, file: fullFile },
                id: [socketId]
            });

            // Broadcast à tout le monde
            if (fullFile) {
                await this.broadcastToAuthorized(socketId,
                    { file_uploading_status: { success: true, file: fullFile } },
                    'global',
                    fullFile.owner._id.toString()
                );
            }
        } catch (e) {
            console.error('Upload file error:', e);
            this.controleur.envoie(this, {
                file_uploading_status: { success: false, error: "Erreur lors de l'upload" },
                id: [socketId]
            });
        }
    }

    handleUpdateFile = async (socketId: string, data: any) => {
        const { fileId, newName, userId } = data;
        try {
            const admin = await this.isAdmin(userId);
            if (!admin) {
                return this.controleur.envoie(this, {
                    file_updating_status: { success: false, error: 'Permission refusée (Administrateur requis)' },
                    id: [socketId]
                });
            }

            const file = await File.model.findById(fileId);
            if (!file) return;

            file.name = newName;
            await file.save();

            this.controleur.envoie(this, {
                file_updating_status: { success: true, fileId, newName },
                id: [socketId]
            });

            await this.broadcastToAuthorized(socketId,
                { file_updating_status: { success: true, fileId, newName } },
                'global',
                file.owner.toString()
            );
        } catch (e) {
            console.error('Update file error:', e);
        }
    }

    handleDeleteFile = async (socketId: string, data: any) => {
        const { fileId, userId } = data;
        try {
            const admin = await this.isAdmin(userId);
            if (!admin) {
                return this.controleur.envoie(this, {
                    file_deleting_status: { success: false, error: 'Permission refusée (Administrateur requis)' },
                    id: [socketId]
                });
            }

            const file = await File.model.findById(fileId);
            if (!file) return;

            await File.model.findByIdAndDelete(fileId);

            this.controleur.envoie(this, {
                file_deleting_status: { success: true, fileId },
                id: [socketId]
            });

            await this.broadcastToAuthorized(socketId,
                { file_deleting_status: { success: true, fileId } },
                'global',
                file.owner.toString()
            );
        } catch (e) {
            console.error('Delete file error:', e);
            this.controleur.envoie(this, {
                file_deleting_status: { success: false, error: 'Erreur lors de la suppression' },
                id: [socketId]
            });
        }
    }

    handleCreateSpace = async (socketId: string, data: any) => {
        const { name, userId, parentId } = data;
        try {
            const admin = await this.isAdmin(userId);
            if (!admin) {
                return this.controleur.envoie(this, {
                    space_creating_status: { success: false, error: 'Seuls les administrateurs peuvent créer des dossiers' },
                    id: [socketId]
                });
            }

            const newSpace = new Space.model({
                name, owner: userId, category: 'global', // Tout est global
                parent: parentId || null,
                members: [],
                isPersonal: false
            });
            await newSpace.save();

            const fullSpace = await Space.model.findById(newSpace._id)
                .populate('members', 'firstname roles')
                .populate('owner', 'firstname roles');

            if (fullSpace) {
                this.controleur.envoie(this, {
                    space_creating_status: { success: true, space: fullSpace },
                    id: [socketId]
                });

                await this.broadcastToAuthorized(socketId,
                    { space_creating_status: { success: true, space: fullSpace } },
                    'global',
                    fullSpace.owner._id.toString()
                );
            }
        } catch (e) {
            console.error('Create space error:', e);
            this.controleur.envoie(this, {
                space_creating_status: { success: false, error: 'Erreur lors de la création' },
                id: [socketId]
            });
        }
    }

    handleGetSpaces = async (socketId: string, data: any) => {
        const { parentId } = data;
        try {
            let query: any = { 
                parent: parentId ? parentId : { $in: [null, undefined] },
                category: 'global' // Tout est global désormais
            };

            const spaces = await Space.model.find(query)
                .populate('members', 'firstname roles')
                .populate('owner', 'firstname roles')
                .sort({ name: 1 });

            this.controleur.envoie(this, {
                spaces: { success: true, spaces, parentId: parentId || null },
                id: [socketId]
            });
        } catch (e) {
            console.error('Get spaces error:', e);
        }
    }

    handleDeleteSpace = async (socketId: string, data: any) => {
        const { spaceId, userId } = data;
        try {
            const admin = await this.isAdmin(userId);
            if (!admin) {
                return this.controleur.envoie(this, {
                    space_deleting_status: { success: false, error: 'Permission refusée (Administrateur requis)' },
                    id: [socketId]
                });
            }

            const space = await Space.model.findById(spaceId);
            if (!space) return;

            await File.model.updateMany({ space: spaceId }, { $unset: { space: "" } });
            await Space.model.findByIdAndDelete(spaceId);

            this.controleur.envoie(this, {
                space_deleting_status: { success: true, spaceId },
                id: [socketId]
            });

            await this.broadcastToAuthorized(socketId,
                { space_deleting_status: { success: true, spaceId } },
                'global',
                space.owner.toString()
            );
        } catch (e) {
            console.error('Delete space error:', e);
            this.controleur.envoie(this, {
                space_deleting_status: { success: false, error: 'Erreur lors de la suppression' },
                id: [socketId]
            });
        }
    }

    handleRenameSpace = async (socketId: string, data: any) => {
        const { spaceId, newName, userId } = data;
        try {
            const admin = await this.isAdmin(userId);
            if (!admin) {
                return this.controleur.envoie(this, {
                    space_renaming_status: { success: false, error: 'Permission refusée (Administrateur requis)' },
                    id: [socketId]
                });
            }

            const space = await Space.model.findById(spaceId);
            if (!space) return;

            space.name = newName;
            await space.save();

            this.controleur.envoie(this, {
                space_renaming_status: { success: true, spaceId, newName },
                id: [socketId]
            });

            await this.broadcastToAuthorized(socketId,
                { space_renaming_status: { success: true, spaceId, newName } },
                'global',
                space.owner.toString()
            );
        } catch (e) {
            console.error('Rename space error:', e);
        }
    }

    handleUpdateSpaceMembers = async (socketId: string, data: any) => {
        this.controleur.envoie(this, {
            space_members_updating_status: { success: false, error: 'La gestion des membres est désactivée (Espace Global unique)' },
            id: [socketId]
        });
    }

    handleResolvePath = async (socketId: string, data: any) => {
        const { path, category, userId } = data;
        const names = path || [];
        try {
            let currentParentId: any = null;
            let resolvedPath: any[] = [];
            let finalCategory = category || 'personal';

            let matchFound = true;
            for (const name of names) {
                let parentQuery = currentParentId ? currentParentId : { $in: [null, undefined] };
                let query: any = { name: { $regex: new RegExp('^' + name + '$', 'i') }, parent: parentQuery, category: 'global' };

                let space = await Space.model.findOne(query).populate('owner', 'firstname roles');

                if (!space && currentParentId) {
                    space = await Space.model.findOne({ name, parent: currentParentId }).populate('owner', 'firstname roles');
                }

                if (!space) {
                    matchFound = false;
                    break;
                }
                resolvedPath.push(space);
                currentParentId = space._id;
                finalCategory = space.category || finalCategory;
            }

            // Plus besoin de chercher dans d'autres silos (silos supprimés)

            if (matchFound) {
                this.controleur.envoie(this, {
                    resolved_path: { success: true, path: resolvedPath, category: finalCategory },
                    id: [socketId]
                });
            } else {
                this.controleur.envoie(this, {
                    resolved_path: { success: false, error: 'Path not found' },
                    id: [socketId]
                });
            }
        } catch (e) {
            console.error('Resolve path error:', e);
            this.controleur.envoie(this, {
                resolved_path: { success: false, error: 'Erreur interne' },
                id: [socketId]
            });
        }
    }
}
