import File from "../models/file.js"
import User from "../models/user.js"
import TeamMember from "../models/teamMember.js"
import { v4 as uuidv4 } from "uuid"
import SocketIdentificationService from "./SocketIdentification.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class DriveService {
    constructor(controleur, nom) {
        this.controleur = controleur
        this.nomDInstance = nom
        this.verbose = false
        this.listeDesMessagesEmis = [
            "files_list_response",
            "folders_list_response",
            "shared_files_list_response",
            "file_delete_response",
            "file_rename_response",
            "file_move_response",
            "file_share_to_team_response",
            "folder_create_response",
            "file_download_response",
        ]
        this.listeDesMessagesRecus = [
            "files_list_request",
            "folders_list_request",
            "shared_files_list_request",
            "file_delete_request",
            "file_rename_request",
            "file_move_request",
            "file_share_to_team_request",
            "folder_create_request",
            "file_download_request",
        ]

        // Set up uploads directory
        this.uploadsDir = path.join(__dirname, "..", "uploads")
        this.filesDir = path.join(this.uploadsDir, "files")
        this.ensureDirectoryExists(this.uploadsDir)
        this.ensureDirectoryExists(this.filesDir)

        if (this.controleur.verboseall || this.verbose)
            console.log(
                "INFO (" +
                    this.nomDInstance +
                    "):  s'enregistre aupres du controleur"
            )

        this.controleur.inscription(
            this,
            this.listeDesMessagesEmis,
            this.listeDesMessagesRecus
        )
    }

    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
        }
    }

    async traitementMessage(mesg) {
        if (this.controleur.verboseall || this.verbose) {
            console.log(
                "INFO (" +
                    this.nomDInstance +
                    "): reçoit le message suivant à traiter"
            )
            console.log(mesg)
        }

        // Handle files list request
        if (mesg.files_list_request) {
            try {
                const socketId = mesg.id
                if (!socketId) throw new Error("Sender socket id not available")

                const userInfo =
                    await SocketIdentificationService.getUserInfoBySocketId(
                        socketId
                    )

                if (!userInfo)
                    throw new Error("User not found based on socket id")

                const { folderId } = mesg.files_list_request

                const query = {
                    ownerId: userInfo.uuid,
                    deleted: false,
                }

                if (folderId) {
                    query.parentId = folderId
                } else {
                    query.parentId = null
                }

                const files = await File.find(query).sort({ type: 1, name: 1 })

                const formattedFiles = files.map((file) => ({
                    id: file.id,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    mimeType: file.mimeType,
                    extension: file.extension,
                    createdAt: file.createdAt,
                    updatedAt: file.updatedAt,
                    parentId: file.parentId,
                    ownerId: file.ownerId,
                    shared: file.shared,
                    sharedWith: file.sharedWith,
                    sharedWithTeams: file.sharedWithTeams || [],
                }))

                const message = {
                    files_list_response: {
                        etat: true,
                        files: formattedFiles,
                    },
                    id: [mesg.id],
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    files_list_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }

        // Handle folders list request (for move file modal)
        if (mesg.folders_list_request) {
            try {
                const socketId = mesg.id
                if (!socketId) throw new Error("Sender socket id not available")

                const userInfo =
                    await SocketIdentificationService.getUserInfoBySocketId(
                        socketId
                    )
                if (!userInfo)
                    throw new Error("User not found based on socket id")

                const { excludeFolderId } = mesg.folders_list_request

                const query = {
                    ownerId: userInfo.uuid,
                    type: "folder",
                    deleted: false,
                }

                let excludedFolderIds = []
                if (excludeFolderId) {
                    excludedFolderIds.push(excludeFolderId)
                    const descendantFolders =
                        await this.getAllDescendantFolders(
                            excludeFolderId,
                            userInfo.uuid
                        )
                    excludedFolderIds = [
                        ...excludedFolderIds,
                        ...descendantFolders.map((folder) => folder.id),
                    ]
                    query.id = { $nin: excludedFolderIds }
                }

                const folders = await File.find(query).sort({ name: 1 })

                const formattedFolders = folders.map((folder) => ({
                    id: folder.id,
                    name: folder.name,
                    type: folder.type,
                    createdAt: folder.createdAt,
                    updatedAt: folder.updatedAt,
                    parentId: folder.parentId,
                    ownerId: folder.ownerId,
                }))

                const message = {
                    folders_list_response: {
                        etat: true,
                        folders: formattedFolders,
                    },
                    id: [mesg.id],
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    folders_list_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }

        // Handle file delete request
        if (mesg.file_delete_request) {
            try {
                const socketId = mesg.id
                if (!socketId) throw new Error("Sender socket id not available")

                const userInfo =
                    await SocketIdentificationService.getUserInfoBySocketId(
                        socketId
                    )
                if (!userInfo)
                    throw new Error("User not found based on socket id")

                const { fileId } = mesg.file_delete_request

                const file = await File.findOne({
                    id: fileId,
                    ownerId: userInfo.uuid,
                })

                if (!file)
                    throw new Error(
                        "File not found or you don't have permission"
                    )

                if (file.type === "folder") {
                    await this.recursiveDelete(fileId, userInfo.uuid)
                } else {
                    // Mark the file as deleted (soft delete)
                    file.deleted = true
                    file.deletedAt = new Date()
                    await file.save()

                    // Optionally delete the physical file
                    if (file.path) {
                        const fullPath = path.join(this.uploadsDir, file.path)
                        if (fs.existsSync(fullPath)) {
                            fs.unlinkSync(fullPath)
                        }
                    }
                }

                const message = {
                    file_delete_response: {
                        etat: true,
                        fileId,
                    },
                    id: [mesg.id],
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    file_delete_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }

        // Handle file rename request
        if (mesg.file_rename_request) {
            try {
                const socketId = mesg.id
                if (!socketId) throw new Error("Sender socket id not available")

                const userInfo =
                    await SocketIdentificationService.getUserInfoBySocketId(
                        socketId
                    )
                if (!userInfo)
                    throw new Error("User not found based on socket id")

                const { fileId, newName } = mesg.file_rename_request

                const file = await File.findOne({
                    id: fileId,
                    ownerId: userInfo.uuid,
                })

                if (!file)
                    throw new Error(
                        "File not found or you don't have permission"
                    ) // If it's a file, rename the physical file too
                if (file.type === "file" && file.path) {
                    const oldPath = path.join(this.uploadsDir, file.path)

                    // Extract directory and create new path with new name
                    const dir = path.dirname(oldPath)
                    const newPath = path.join(dir, newName)

                    if (fs.existsSync(oldPath)) {
                        fs.renameSync(oldPath, newPath)
                        // Update the path in database - replace only the filename part
                        const pathParts = file.path.split("/")
                        pathParts[pathParts.length - 1] = newName
                        file.path = pathParts.join("/")
                    }
                }

                file.name = newName
                file.updatedAt = new Date()
                await file.save()

                const message = {
                    file_rename_response: {
                        etat: true,
                    },
                    id: [mesg.id],
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    file_rename_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }

        // Handle file move request
        if (mesg.file_move_request) {
            try {
                const socketId = mesg.id
                if (!socketId) throw new Error("Sender socket id not available")

                const userInfo =
                    await SocketIdentificationService.getUserInfoBySocketId(
                        socketId
                    )
                if (!userInfo)
                    throw new Error("User not found based on socket id")

                const { fileId, newParentId } = mesg.file_move_request

                const file = await File.findOne({
                    id: fileId,
                    ownerId: userInfo.uuid,
                })

                if (!file)
                    throw new Error(
                        "File not found or you don't have permission"
                    ) // Check if trying to move to the same parent
                if (file.parentId === newParentId) {
                    throw new Error("File is already in the target location")
                }

                if (newParentId) {
                    const parentFolder = await File.findOne({
                        id: newParentId,
                        type: "folder",
                        ownerId: userInfo.uuid,
                        deleted: false,
                    })

                    if (!parentFolder)
                        throw new Error(
                            "Destination folder not found or you don't have permission"
                        )

                    // Check for circular reference if moving a folder
                    if (file.type === "folder") {
                        const isCircular = await this.isCircularReference(
                            fileId,
                            newParentId
                        )
                        if (isCircular)
                            throw new Error(
                                "Cannot move a folder into its own descendant"
                            )
                    }
                }

                file.parentId = newParentId || null
                file.updatedAt = new Date()
                await file.save()

                const message = {
                    file_move_response: {
                        etat: true,
                        fileId,
                        newParentId,
                    },
                    id: [mesg.id],
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    file_move_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }

        // Handle file share to team request
        if (mesg.file_share_to_team_request) {
            try {
                const socketId = mesg.id
                if (!socketId) throw new Error("Sender socket id not available")

                const userInfo =
                    await SocketIdentificationService.getUserInfoBySocketId(
                        socketId
                    )
                if (!userInfo)
                    throw new Error("User not found based on socket id")

                const { fileId, teamId } = mesg.file_share_to_team_request // Find the file
                const file = await File.findOne({
                    id: fileId,
                    ownerId: userInfo.uuid,
                })

                if (!file)
                    throw new Error(
                        "File not found or you don't have permission"
                    )

                // Verify user is member of the team
                const teamMember = await TeamMember.findOne({
                    teamId,
                    userId: userInfo._id,
                })

                if (!teamMember)
                    throw new Error("You are not a member of this team")

                // Initialize sharedWithTeams if it doesn't exist
                if (!file.sharedWithTeams) {
                    file.sharedWithTeams = []
                }

                // Add team to shared teams if not already there
                if (!file.sharedWithTeams.includes(teamId)) {
                    file.sharedWithTeams.push(teamId)
                }

                file.shared = true
                file.updatedAt = new Date()
                await file.save()

                const message = {
                    file_share_to_team_response: {
                        etat: true,
                        fileId,
                        teamId,
                    },
                    id: [mesg.id],
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    file_share_to_team_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        } // Handle shared files list request
        if (mesg.shared_files_list_request) {
            try {
                const socketId = mesg.id
                if (!socketId) throw new Error("Sender socket id not available")

                const userInfo =
                    await SocketIdentificationService.getUserInfoBySocketId(
                        socketId
                    )
                if (!userInfo)
                    throw new Error("User not found based on socket id")

                const { teamId } = mesg.shared_files_list_request

                let query = {
                    deleted: false,
                    $or: [
                        { sharedWith: { $in: [userInfo._id.toString()] } },
                        { sharedWithTeams: { $exists: true, $ne: [] } },
                    ],
                }

                // If teamId is provided, filter by files shared with specific team
                if (teamId) {
                    // Verify user is member of the team
                    const teamMember = await TeamMember.findOne({
                        teamId,
                        userId: userInfo._id,
                    })

                    if (!teamMember)
                        throw new Error("You are not a member of this team")

                    // Find files shared with this specific team
                    query = {
                        deleted: false,
                        sharedWithTeams: { $in: [teamId] },
                    }
                } else {
                    // If no teamId, find files shared with user or any team user belongs to
                    const userTeamMemberships = await TeamMember.find({
                        userId: userInfo._id,
                    })
                    const userTeamIds = userTeamMemberships.map(
                        (tm) => tm.teamId
                    )

                    query = {
                        deleted: false,
                        $or: [
                            { sharedWith: { $in: [userInfo._id.toString()] } },
                            { sharedWithTeams: { $in: userTeamIds } },
                        ],
                    }
                }

                // Get shared files
                const files = await File.find(query).sort({ updatedAt: -1 }) // Get owner information for each file
                const formattedFiles = await Promise.all(
                    files.map(async (file) => {
                        const owner = await User.findOne({
                            uuid: file.ownerId,
                        }).select("firstname lastname picture")
                        return {
                            id: file.id,
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            mimeType: file.mimeType,
                            extension: file.extension,
                            createdAt: file.createdAt,
                            updatedAt: file.updatedAt,
                            parentId: file.parentId,
                            ownerId: file.ownerId,
                            shared: file.shared,
                            sharedWith: file.sharedWith,
                            sharedWithTeams: file.sharedWithTeams || [],
                            owner: owner
                                ? {
                                      firstname: owner.firstname,
                                      lastname: owner.lastname,
                                      picture: owner.picture,
                                  }
                                : null,
                        }
                    })
                )

                const message = {
                    shared_files_list_response: {
                        etat: true,
                        files: formattedFiles,
                        teamId: teamId || null,
                    },
                    id: [mesg.id],
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    shared_files_list_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }

        // Handle folder create request
        if (mesg.folder_create_request) {
            try {
                const socketId = mesg.id
                if (!socketId) throw new Error("Sender socket id not available")

                const userInfo =
                    await SocketIdentificationService.getUserInfoBySocketId(
                        socketId
                    )
                if (!userInfo)
                    throw new Error("User not found based on socket id")

                const { name, parentId } = mesg.folder_create_request

                if (parentId) {
                    const parentFolder = await File.findOne({
                        id: parentId,
                        type: "folder",
                        ownerId: userInfo.uuid,
                    })

                    if (!parentFolder)
                        throw new Error(
                            "Parent folder not found or you don't have permission"
                        )
                }

                const folderId = uuidv4()

                const newFolder = new File({
                    id: folderId,
                    name,
                    type: "folder",
                    parentId: parentId || null,
                    ownerId: userInfo.uuid,
                })

                await newFolder.save()

                const message = {
                    folder_create_response: {
                        etat: true,
                    },
                    id: [mesg.id],
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    folder_create_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        } // Handle file download request
        if (mesg.file_download_request) {
            try {
                const socketId = mesg.id
                if (!socketId) throw new Error("Sender socket id not available")

                const userInfo =
                    await SocketIdentificationService.getUserInfoBySocketId(
                        socketId
                    )
                if (!userInfo)
                    throw new Error("User not found based on socket id")

                const { fileId } = mesg.file_download_request

                // Check if user owns the file or if it's shared with them
                const file = await File.findOne({
                    id: fileId,
                    type: "file",
                    deleted: false,
                    $or: [
                        { ownerId: userInfo.uuid },
                        { sharedWith: { $in: [userInfo._id.toString()] } },
                        { sharedWithTeams: { $exists: true, $ne: [] } },
                    ],
                })

                if (!file)
                    throw new Error(
                        "File not found or you don't have permission"
                    )

                // Generate a download URL pointing to our Express endpoint
                const downloadUrl = `/api/files/download/${file.id}`

                const message = {
                    file_download_response: {
                        etat: true,
                        downloadUrl,
                        fileName: file.name,
                        mimeType: file.mimeType,
                    },
                    id: [mesg.id],
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    file_download_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }
    }

    // Helper method to get all descendant folders of a given folder
    async getAllDescendantFolders(folderId, ownerId) {
        const descendants = []

        const children = await File.find({
            parentId: folderId,
            type: "folder",
            ownerId: ownerId,
            deleted: false,
        })

        descendants.push(...children)

        for (const child of children) {
            const childDescendants = await this.getAllDescendantFolders(
                child.id,
                ownerId
            )
            descendants.push(...childDescendants)
        }

        return descendants
    }

    // Helper method to recursively mark files and folders as deleted
    async recursiveDelete(folderId, ownerId) {
        await File.updateOne(
            { id: folderId, ownerId },
            { deleted: true, deletedAt: new Date() }
        )

        const children = await File.find({ parentId: folderId, ownerId })

        for (const child of children) {
            if (child.type === "folder") {
                await this.recursiveDelete(child.id, ownerId)
            } else {
                child.deleted = true
                child.deletedAt = new Date()
                await child.save()

                // Delete physical file
                if (child.path) {
                    const fullPath = path.join(this.uploadsDir, child.path)
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath)
                    }
                }
            }
        }
    }

    // Helper method to check if moving a folder would create a circular reference
    async isCircularReference(sourceFolderId, targetFolderId) {
        if (sourceFolderId === targetFolderId) {
            return true
        }

        const targetFolder = await File.findOne({ id: targetFolderId })
        if (!targetFolder || !targetFolder.parentId) {
            return false
        }

        return this.isCircularReference(sourceFolderId, targetFolder.parentId)
    }

    // Get the physical file path for a file ID
    getFilePath(fileId, userId, fileName) {
        return path.join(this.filesDir, userId, fileId, fileName)
    }

    // Ensure user directory exists
    ensureUserDirectory(userId, fileId) {
        const userDir = path.join(this.filesDir, userId)
        const fileDir = path.join(userDir, fileId)

        this.ensureDirectoryExists(userDir)
        this.ensureDirectoryExists(fileDir)

        return fileDir
    }
}

export default DriveService
