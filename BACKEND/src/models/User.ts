import mongoose, { type Model, type HydratedDocument, model, Schema, Types } from "mongoose"
import { v4 as uuidv4 } from "uuid"
import { type FileType, type FolderType } from "./services/FileSystem.ts";
import TracedError from "./core/TracedError.ts";
import { sha256 } from "js-sha256"
import Auth from "./services/Auth.ts";
import { Collection } from "mongodb";

const { models } = mongoose;

export type UserType = {

    _id?: Types.ObjectId,
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

}

export default class User {

    static betterAuthSchema = {

        socket_id: { type: "string" as const, required: false, defaultValue: "none" },  
        lastname: { type: "string" as const, required: false, input: true },
        phone: { type: "string" as const, required: true , input: true},
        status: {
            type: "string" as const,
            required: true,
            defaultValue: "waiting",
        },
        job: {
            type: "string" as const,
            required: false,
            input: true
        },
        desc: {
            type: "string" as const,
            required: true,
            input: true
        },
        picture: {
            type: "string" as const,
            required: false,
            defaultValue: "default_profile_picture.png",
        },
        is_online: { type: "boolean" as const, required: true, defaultValue: false },
        disturb_status: {
            type: "string" as const,
            required: true,
            defaultValue: "available",
        },
        last_connection: { type: "date" as const, required: true, defaultValue: Date.now },
        direct_manager: {
            type: "string" as const,
            required: true,
            defaultValue: "none",
        },
    }
    
    static model: Collection;

    //modelInstance;

    //testRootFolders;

    //constructor(dataToConstruct: UserType){

    //    this.modelInstance = new User.model(dataToConstruct);

    //    this.testRootFolders = this.defTestRootFolders(dataToConstruct);
    //    this.defTestSubFolders(dataToConstruct);

    //}

    //async save(){

    //    try {
            
    //        await this.modelInstance.save();
    //        //if (process.env.VERBOSE) console.log("💾 User collection created and saved");

    //    } catch (err: any) {
            
    //        throw new TracedError("collectionSaving", err.message);
    //    }
    //}

    static async fetchModel(){

        try {
            
            this.model = Auth.mongoClient.db().collection("users");

        } catch (err: any) {

            throw new Error("Fetching model failed");
        }
    }
    static async flushAll() {
        
        !this.model && await this.fetchModel();
        
        return this.model.deleteMany({});
    }

    //private defStatics(){

    //    // Method to get children of a folder
    //    this.schema.statics.getChildren = async function (folderId, ownerId) {

    //        return await this.find({
    //            parentId: folderId,
    //            ownerId: ownerId,
    //            deleted: false,
    //        })
    //    }

    //    // Method to get shared files for a user
    //    this.schema.statics.getSharedWithUser = async function (userId) {

    //        return await this.find({
    //            sharedWith: { $in: [userId] },
    //            deleted: false,
    //        })
    //    }
    //}

    //private defTestRootFolders(user: UserType){

    //    const docFolder = {

    //        name: "Documents",
    //        type: "folder",
    //        ownerId: user._id,
    //        parentId: null,
    //        createdAt: new Date(),
    //        updatedAt: new Date(),

    //    } as FolderType & { subFolders: FolderType[] };

    //    docFolder.files = [

    //        {

    //            name: "rapport_annuel.txt",
    //            type: "file",
    //            size: 0, // Sera calculé dynamiquement
    //            mimeType: "text/plain",
    //            extension: "txt",
    //            ownerId: user._id!,
    //            parentId: docFolder._id!,
    //            path: `files/${
    //                user._id
    //            }/${uuidv4()}/rapport_annuel.txt`,
    //            createdAt: new Date(),
    //            updatedAt: new Date(),
    //        },
    //        {

    //            name: "documentation_technique.txt",
    //            type: "file",
    //            size: 0, // Sera calculé dynamiquement
    //            mimeType: "text/plain",
    //            extension: "txt",
    //            ownerId: user._id!,
    //            parentId: docFolder._id!,
    //            path: `files/${
    //                user._id
    //            }/${uuidv4()}/documentation_technique.txt`,
    //            createdAt: new Date(),
    //            updatedAt: new Date(),
    //        },
    //        {

    //            name: "guide_utilisateur.txt",
    //            type: "file",
    //            size: 0, // Sera calculé dynamiquement
    //            mimeType: "text/plain",
    //            extension: "txt",
    //            ownerId: user._id!,
    //            parentId: docFolder._id!,
    //            path: `files/${
    //                user._id
    //            }/${uuidv4()}/guide_utilisateur.txt`,
    //            createdAt: new Date(),
    //            updatedAt: new Date(),
    //        },
    //    ]

    //    const imgFolder = {

    //        name: "Images",
    //        type: "folder",
    //        ownerId: user._id,
    //        parentId: null,
    //        createdAt: new Date(),
    //        updatedAt: new Date(),

    //    } as FolderType & { subFolders: FolderType[] };

    //    imgFolder.files = [

    //        {

    //            name: "default_profile_picture.png",
    //            type: "file",
    //            size: 0, // Sera calculé dynamiquement
    //            mimeType: "image/png",
    //            extension: "png",
    //            ownerId: user._id!,
    //            parentId: imgFolder._id!,
    //            path: `files/${
    //                user._id
    //            }/${uuidv4()}/default_profile_picture.png`,
    //            createdAt: new Date(),
    //            updatedAt: new Date(),
    //        },
    //        {

    //            name: "Logo_Univ.png",
    //            type: "file",
    //            size: 0, // Sera calculé dynamiquement
    //            mimeType: "image/png",
    //            extension: "png",
    //            ownerId: user._id!,
    //            parentId: imgFolder._id!,
    //            path: `files/${user._id}/${uuidv4()}/Logo_Univ.png`,
    //            createdAt: new Date(),
    //            updatedAt: new Date(),
    //        },
    //    ]

    //    const projFolder = {

    //        name: "Projets",
    //        type: "folder",
    //        ownerId: user._id,
    //        parentId: null,
    //        createdAt: new Date(),
    //        updatedAt: new Date(),

    //    } as FolderType & { subFolders: FolderType[] };

    //    return [docFolder, imgFolder, projFolder];
    //}

    //private defTestSubFolders(user: UserType){

    //    this.testRootFolders.forEach(rootFolder => {

    //        switch (rootFolder.name){

    //            case "Documents": {

    //                const coursFolder = {


	//					name: "Cours",
	//					type: "folder",
	//					ownerId: user._id!,
	//					parentId: rootFolder._id!,
	//					createdAt: new Date(),
	//					updatedAt: new Date(),

	//				} as FolderType;

    //                coursFolder.files = [

    //                    {

    //                        name: "cours_web.txt",
    //                        type: "file",
    //                        size: 0, // Sera calculé dynamiquement
    //                        mimeType: "text/plain",
    //                        extension: "txt",
    //                        ownerId: user._id!,
    //                        parentId: coursFolder._id!,
    //                        path: `files/${user._id!}/${uuidv4()}/cours_web.txt`,
    //                        createdAt: new Date(),
    //                        updatedAt: new Date(),
    //                    },
    //                    {

    //                        name: "notes_cours.txt",
    //                        type: "file",
    //                        size: 0, // Sera calculé dynamiquement
    //                        mimeType: "text/plain",
    //                        extension: "txt",
    //                        ownerId: user._id!,
    //                        parentId: coursFolder._id!,
    //                        path: `files/${user._id!}/${uuidv4()}/notes_cours.txt`,
    //                        createdAt: new Date(),
    //                        updatedAt: new Date(),
    //                    },

    //                ];

    //                rootFolder.subFolders = [coursFolder];

    //                break;
    //            }

    //            case "Projets": {

    //                const projWebFolder = {


	//					name: "Projet Web",
	//					type: "folder",
	//					ownerId: user._id!,
	//					parentId: rootFolder._id!,
	//					createdAt: new Date(),
	//					updatedAt: new Date(),

	//				} as FolderType;

    //                projWebFolder.files = [

    //                    {

    //                        name: "index.html",
    //                        type: "file",
    //                        size: 0, // Sera calculé dynamiquement
    //                        mimeType: "text/html",
    //                        extension: "html",
    //                        ownerId: user._id!,
    //                        parentId: projWebFolder._id!,
    //                        path: `files/${user._id!}/${uuidv4()}/index.html`,
    //                        createdAt: new Date(),
    //                        updatedAt: new Date(),
    //                    },
    //                    {

    //                        name: "style.css",
    //                        type: "file",
    //                        size: 0, // Sera calculé dynamiquement
    //                        mimeType: "text/css",
    //                        extension: "css",
    //                        ownerId: user._id!,
    //                        parentId: projWebFolder._id!,
    //                        path: `files/${user._id!}/${uuidv4()}/style.css`,
    //                        createdAt: new Date(),
    //                        updatedAt: new Date(),
    //                    },
    //                    {

    //                        name: "script.js",
    //                        type: "file",
    //                        size: 0, // Sera calculé dynamiquement
    //                        mimeType: "application/javascript",
    //                        extension: "js",
    //                        ownerId: user._id!,
    //                        parentId: projWebFolder._id!,
    //                        path: `files/${user._id!}/${uuidv4()}/script.js`,
    //                        createdAt: new Date(),
    //                        updatedAt: new Date(),
    //                    },
    //                ];

    //                rootFolder.subFolders = [projWebFolder];

    //                break;
    //            }

    //        }
    //    })
    //}

}
