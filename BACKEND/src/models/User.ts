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
    job?: string, //TODO: Le rendre obligatoire quand les tests sont finis
    desc: string,
    date_created?: Date,
    picture?: string,
    is_online?: boolean,
    disturb_status?: string,
    last_connection?: Date,
    direct_manager?: string,
    roles?: Types.ObjectId,

}

export default class User {

    protected static schema = new Schema<UserType>({

        socket_id: { type: String, default: "none" },
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
            //required: true,
            description: "Job description",
        },
        desc: {
            type: String,
            required: true,
            description: "User description",
        },
        date_created: { type: Date, required: true, default: Date.now },
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
        //tokens: { type: Object, default: {} },
        roles: [
            {
                type: Schema.Types.ObjectId,
                ref: "Role",
                default: "user",
                description: `List of roles id created by admin in the roles collection`,
            },
        ],
    });

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
    
    static mongooseModel: Model<UserType> = models.User || model<UserType>("User", this.schema);
    static model: Collection; //TODO: Model Better Auth à enlever par la suite.

    modelInstance;

    //testRootFolders;

    constructor(dataToConstruct: UserType){

        this.modelInstance = new User.mongooseModel(dataToConstruct);

        //this.testRootFolders = this.defTestRootFolders(dataToConstruct);
        //this.defTestSubFolders(dataToConstruct);

    }

    static async inject(){

        [{
            firstname: "test1",
            lastname: "testlast1",
            email: "test1@visioconf.com",
            phone: "06 52 14 55 45",
            password: "12345678",
            desc: "Une description vreumannnnn",
        },
        {
            firstname: "test2",
            lastname: "testlast2",
            email: "test2@visioconf.com",
            phone: "06 52 14 55 45",
            password: "12345678",
            desc: "Une description vreumannnnn",
        },
        {
            firstname: "test3",
            lastname: "testlast3",
            email: "test3@visioconf.com",
            phone: "06 52 14 55 45",
            password: "12345678",
            desc: "Une description vreumannnnn",
        },
        {
            firstname: "test4",
            lastname: "testlast4",
            email: "test4@visioconf.com",
            phone: "06 52 14 55 45",
            password: "12345678",
            desc: "Une description vreumannnnn",
        },
        {
            firstname: "test5",
            lastname: "testlast5",
            email: "test5@visioconf.com",
            phone: "06 52 14 55 45",
            password: "12345678",
            desc: "Une description vreumannnnn",
        }].map(user => {

            const newUser = new User(user);
            newUser.save();
        })
    }

    async save(){

        try {
            
            await this.modelInstance.save();
            //if (process.env.VERBOSE) console.log("💾 User collection created and saved");

        } catch (err: any) {
            
            throw new TracedError("collectionSaving", err.message);
        }
    }

    static async fetchModel(){

        try {
            
            this.model = Auth.mongoClient.db().collection("users");

        } catch (err: any) {

            throw new Error("Fetching model failed");
        }
    }

    static async getUser(email: string) {
        
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return;

        return this.mongooseModel.findOne({email: email});
    }

    static async getUsers(emails: string[]) {
        
        emails.forEach((email, index) => {
            
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) emails.splice(index, 1);

        });

        return this.mongooseModel.find({ email: {$in: emails}});
    }

    static async updateUser(email: string, newData: Partial<UserType>) {
        
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return;

        return this.mongooseModel.updateOne({email: email}, { $set: newData});
    }

    static async updateUsers(emails: string[], newData: Partial<UserType>) {
        
        emails.forEach((email, index) => {
            
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) emails.splice(index, 1);

        });

        return this.mongooseModel.updateMany({ email: {$in: emails}}, {$set: newData});
    }

    static async deleteUser(email: string) {
        
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return;

        return this.mongooseModel.deleteOne({email: email});
    }

    static async deleteUsers(emails: string[]) {
        
        emails.forEach((email, index) => {
            
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) emails.splice(index, 1);

        });

        return this.mongooseModel.deleteMany({ email: {$in: emails}});
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
