import mongoose, { type Model, type HydratedDocument, model, Schema, Types } from "mongoose"
import Collection from "./Core/Collection.ts";
import { v4 as uuidv4 } from "uuid"
import { type FileType, type FolderType } from "./services/FileSystem.ts";
import TracedError from "./Core/TracedError.ts";
import { sha256 } from "js-sha256"
import Role from "./Role.ts";

const { models } = mongoose;

export type UserType = {
    
    uuid: string,
    socket_id?: string,
    firstname: string,
    lastname: string,
    email: string,
    phone: string,
    status?: "waiting" | "active" | "banned" | "deleted",
    password: string,
    job: string,
    desc: string,
    date_create?: Date,
    picture?: string,
    is_online?: boolean,
    disturb_status?: string,
    last_connection?: Date,
    direct_manager?: string,
    tokens?: {},
    roles?: Types.ObjectId[],

}

export default class User extends Collection {

    protected static schema = new Schema<UserType>({

            uuid: { type: String, required: true },
            socket_id: { type: String, required: true, default: "none" },
            firstname: { type: String, required: true },
            lastname: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
            status: {
                type: String,
                required: true,
                default: "waiting",
                enum: ["waiting", "active", "banned", "deleted"],
                description:
                    "Choose user status between : waiting, active, banned, deleted",
            },
            password: { type: String, required: true, description: "SHA256" },
            job: {
                type: String,
                required: true,
                description: "Job description",
            },
            desc: {
                type: String,
                required: true,
                description: "User description",
            },
            date_create: { type: Date, required: true, default: Date.now },
            picture: {
                type: String,
                required: true,
                default: "default_profile_picture.png",
            },
            is_online: { type: Boolean, required: true, default: false },
            disturb_status: {
                type: String,
                required: true,
                default: "available",
                enum: ["available", "offline", "dnd"],
                description: "Choose user status between : available, offline, dnd",
            },
            last_connection: { type: Date, required: true, default: Date.now },
            direct_manager: {
                type: String,
                required: true,
                default: "none",
                description: "User uuid of the direct manager",
            },
            tokens: { type: Object, default: {} },
            roles: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Role",
                    default: "user",
                    description: `List of roles id created by admin in the roles collection`,
                },
            ],
        });

    private static areStaticsInitialized = (() => {

        // Method to get children of a folder
        this.schema.statics.getChildren = async function (folderId, ownerId) {

            return await this.find({
                parentId: folderId,
                ownerId: ownerId,
                deleted: false,
            })
        }

        // Method to get shared files for a user
        this.schema.statics.getSharedWithUser = async function (userId) {

            return await this.find({
                sharedWith: { $in: [userId] },
                deleted: false,
            })
        }

        return true;

    })();
    
    static model: Model<UserType> = models.User || model<UserType>("User", this.schema);

    modelInstance;

    testRootFolders;

    constructor(dataToConstruct: UserType){

        super();

        this.modelInstance = new User.model(dataToConstruct);

        this.testRootFolders = this.defTestRootFolders(dataToConstruct);
        this.defTestSubFolders(dataToConstruct);

    }

    async save(){

        try {
            
            await this.modelInstance.save();
            //if (process.env.VERBOSE) console.log("💾 User collection created and saved");

        } catch (err: any) {
            
            throw new TracedError("collectionSaving", err.message);
        }
    }

    static async flushAll() {
        
        return this.model.deleteMany({});
    }

    private defTestRootFolders(user: UserType){

        const docFolder = {

            id: uuidv4(),
            name: "Documents",
            type: "folder",
            ownerId: user.uuid,
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),

        } as FolderType & { subFolders: FolderType[] };

        docFolder.files = [

            {
                id: uuidv4(),
                name: "rapport_annuel.txt",
                type: "file",
                size: 0, // Sera calculé dynamiquement
                mimeType: "text/plain",
                extension: "txt",
                ownerId: user.uuid,
                parentId: docFolder.id,
                path: `files/${
                    user.uuid
                }/${uuidv4()}/rapport_annuel.txt`,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: "documentation_technique.txt",
                type: "file",
                size: 0, // Sera calculé dynamiquement
                mimeType: "text/plain",
                extension: "txt",
                ownerId: user.uuid,
                parentId: docFolder.id,
                path: `files/${
                    user.uuid
                }/${uuidv4()}/documentation_technique.txt`,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: "guide_utilisateur.txt",
                type: "file",
                size: 0, // Sera calculé dynamiquement
                mimeType: "text/plain",
                extension: "txt",
                ownerId: user.uuid,
                parentId: docFolder.id,
                path: `files/${
                    user.uuid
                }/${uuidv4()}/guide_utilisateur.txt`,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]

        const imgFolder = {

            id: uuidv4(),
            name: "Images",
            type: "folder",
            ownerId: user.uuid,
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),

        } as FolderType & { subFolders: FolderType[] };

        imgFolder.files = [

            {
                id: uuidv4(),
                name: "default_profile_picture.png",
                type: "file",
                size: 0, // Sera calculé dynamiquement
                mimeType: "image/png",
                extension: "png",
                ownerId: user.uuid,
                parentId: imgFolder.id,
                path: `files/${
                    user.uuid
                }/${uuidv4()}/default_profile_picture.png`,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: "Logo_Univ.png",
                type: "file",
                size: 0, // Sera calculé dynamiquement
                mimeType: "image/png",
                extension: "png",
                ownerId: user.uuid,
                parentId: imgFolder.id,
                path: `files/${user.uuid}/${uuidv4()}/Logo_Univ.png`,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]

        const projFolder = {

            id: uuidv4(),
            name: "Projets",
            type: "folder",
            ownerId: user.uuid,
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),

        } as FolderType & { subFolders: FolderType[] };

        return [docFolder, imgFolder, projFolder];
    }

    private defTestSubFolders(user: UserType){

        this.testRootFolders.forEach(rootFolder => {

            switch (rootFolder.name){

                case "Documents": {

                    const coursFolder = {

						id: uuidv4(),
						name: "Cours",
						type: "folder",
						ownerId: user.uuid,
						parentId: rootFolder.id,
						createdAt: new Date(),
						updatedAt: new Date(),

					} as FolderType;

                    coursFolder.files = [

                        {
                            id: uuidv4(),
                            name: "cours_web.txt",
                            type: "file",
                            size: 0, // Sera calculé dynamiquement
                            mimeType: "text/plain",
                            extension: "txt",
                            ownerId: user.uuid,
                            parentId: coursFolder.id,
                            path: `files/${user.uuid}/${uuidv4()}/cours_web.txt`,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        {
                            id: uuidv4(),
                            name: "notes_cours.txt",
                            type: "file",
                            size: 0, // Sera calculé dynamiquement
                            mimeType: "text/plain",
                            extension: "txt",
                            ownerId: user.uuid,
                            parentId: coursFolder.id,
                            path: `files/${user.uuid}/${uuidv4()}/notes_cours.txt`,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },

                    ];

                    rootFolder.subFolders = [coursFolder];

                    break;
                }

                case "Projets": {

                    const projWebFolder = {

						id: uuidv4(),
						name: "Projet Web",
						type: "folder",
						ownerId: user.uuid,
						parentId: rootFolder.id,
						createdAt: new Date(),
						updatedAt: new Date(),

					} as FolderType;

                    projWebFolder.files = [

                        {
                            id: uuidv4(),
                            name: "index.html",
                            type: "file",
                            size: 0, // Sera calculé dynamiquement
                            mimeType: "text/html",
                            extension: "html",
                            ownerId: user.uuid,
                            parentId: projWebFolder.id,
                            path: `files/${user.uuid}/${uuidv4()}/index.html`,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        {
                            id: uuidv4(),
                            name: "style.css",
                            type: "file",
                            size: 0, // Sera calculé dynamiquement
                            mimeType: "text/css",
                            extension: "css",
                            ownerId: user.uuid,
                            parentId: projWebFolder.id,
                            path: `files/${user.uuid}/${uuidv4()}/style.css`,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        {
                            id: uuidv4(),
                            name: "script.js",
                            type: "file",
                            size: 0, // Sera calculé dynamiquement
                            mimeType: "application/javascript",
                            extension: "js",
                            ownerId: user.uuid,
                            parentId: projWebFolder.id,
                            path: `files/${user.uuid}/${uuidv4()}/script.js`,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                    ];

                    rootFolder.subFolders = [projWebFolder];

                    break;
                }

            }
        })
    }

    static async injectAdmin(){


        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new TracedError("adminCredentialsNotReferenced");

        const adminPasswordHash = sha256(process.env.ADMIN_PASSWORD);

        try {
            
            const adminRole = await Role.model.findOne({uuid: "admin"});
            const userRole = await Role.model.findOne({uuid: "user"});

            if (!adminRole || !userRole) throw new TracedError("roleNotFound");

            if (process.env.VERBOSE === "true"){
                
                console.group("⚙️ Injecting Admin user..")
            }

            const newUser = new User({
                uuid: uuidv4(),
                firstname: "Admin",
                lastname: "Admin",
                email: process.env.ADMIN_EMAIL,
                phone: "06.00.00.00.00",
                job: "Administrateur Système",
                desc: "Administrateur principal de la plateforme VisioConf.",
                password: adminPasswordHash,
                status: "active",
                roles: [adminRole._id, userRole._id],
            })
            newUser.save();

            if (process.env.VERBOSE === "true"){
                
                console.log(`✅ Admin injected`);
                console.groupEnd();
                console.log("");
            }

        } catch (err: any) {
            
            throw new TracedError("injectingCollection", err.message);
        }
    }

}
