import mongoose, { model, Schema, type Document, type HydratedDocument, type Model, type Types } from "mongoose";
import { v4 as uuidv4 } from "uuid"
import Collection from "../core/Collection.ts";
import TracedError from "../core/TracedError.ts";
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs"
import multer from "multer"

const { models } = mongoose;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type FolderType = {

    _id?: Types.ObjectId,
    name: string,
    type: "folder",
    createdAt: Date,
    updatedAt: Date,
    parentId: Types.ObjectId | null,
    ownerId: Types.ObjectId,
    files?: FileType[],
}

/**
 * @extends Collection
 * 
 * Folder est une sous classe -> elle hérite des propriétés et des méthodes de la classe Collection.
 * Chaque dossier est une nouvelle entrée de la collection "Files".
 *
 * @param {FolderType} dataToConstruct - Chaque dossier créé attend des paramètres bien définies pour être valides à l'ajout dans la DB.
 * 
 * La classe Collection est une template que chaque "Collection like" va hériter pour n'avoir à gérer que ses propres propriétés/méthodes personnalisées.
 * 
 * Sur ce point la majorité des propriétés et méthodes des collections sont statiques pour travailler plus facilement avec leurs models.
 * Néanmoins ce ne sont pas des singletons statiques puisque les informations d'instanciation sont stockées dans la propriété "modelInstance" si besoin.
 * 
 * Une fois que toutes les informations sont renseignées et vérifiées, on peut appeller .save() pour envoyer la collection dans la DB.
 * 
 * @see {@link Collection}
 */
export class Folder extends Collection {

    protected static schema = new Schema({

        name: { type: String, required: true },
        type: {
            type: String,
            required: true,
            default: "folder",
        },
        createdAt: { type: Date, required: true, default: Date.now },
        updatedAt: { type: Date, required: true, default: Date.now },
        parentId: {
            type: String,
            required: false,
            default: null,
            description: "ID of the parent folder, null if in root",
        },
        ownerId: {
            type: String,
            required: true,
            description: "UUID of the user who owns this file/folder",
        },
        shared: {
            type: Boolean,
            required: true,
            default: false,
            description: "Whether this file/folder is shared publicly",
        },
        sharedWith: [
            {
                type: String,
                description: "UUIDs of users this file/folder is shared with",
            },
        ],
        sharedWithTeams: [
            {
                type: String,
                description: "IDs of teams this file/folder is shared with",
            },
        ],
        deleted: {
            type: Boolean,
            required: true,
            default: false,
            description: "Soft delete flag",
        },
        deletedAt: {
            type: Date,
            required: false,
            default: null,
        },
    });

    static model: Model<FolderType> = models.Folder || model<FolderType>("File", this.schema);

    modelInstance;
    files?: File[];

    constructor(dataToConstruct: FolderType){

        super();

        this.modelInstance = new Folder.model(dataToConstruct);

        if (dataToConstruct.files)
            
            this.files = dataToConstruct.files.map(file => {

                return new File(file);
            })

    }

    async save(){
    
        try {
            
            await this.modelInstance.save();
            
            try {
                
                if (this.files) await Promise.all(this.files.map(file => file.save()));

            } catch (error) {
                
                console.error(error);
            }

            //if (process.env.VERBOSE) console.log("💾 Folder collection created and saved");

        } catch (err: any) {
            
            throw new TracedError("collectionSaving", err.message);
        }
    }

    static async flushAll() {
        
        await File.flushAll();
        return this.model.deleteMany({});
    }
}



export type FileType = {

    _id?: Types.ObjectId,
    name: string,
    type: "file",
    size: number,
    mimeType: string,
    extension: string,
    createdAt: Date,
    updatedAt: Date,
    parentId: Types.ObjectId | null,
    ownerId: Types.ObjectId,
    shared?: boolean,
    sharedWith?: string,
    sharedWithTeams?: string,
    path: string,
    deleted?: boolean,
    deletedAt?: Date,
}

/**
 * @extends Collection
 * 
 * File est une sous classe -> elle hérite des propriétés et des méthodes de la classe Collection.
 * Chaque fichier est une nouvelle entrée de la collection "Files".
 *
 * @param {FileType} dataToConstruct - Chaque fichier créé attend des paramètres bien définies pour être valides à l'ajout dans la DB.
 * 
 * La classe Collection est une template que chaque "Collection like" va hériter pour n'avoir à gérer que ses propres propriétés/méthodes personnalisées.
 * 
 * Sur ce point la majorité des propriétés et méthodes des collections sont statiques pour travailler plus facilement avec leurs models.
 * Néanmoins ce ne sont pas des singletons statiques puisque les informations d'instanciation sont stockées dans la propriété "modelInstance" si besoin.
 * 
 * Une fois que toutes les informations sont renseignées et vérifiées, on peut appeller .save() pour envoyer la collection dans la DB.
 * 
 * @see {@link Collection}
 */
export class File extends Collection {

    protected static schema = new Schema<FileType>({

        name: { type: String, required: true },
        type: {
            type: String,
            required: true,
            default: "file",
        },
        size: {
            type: Number,
            required: true,
            default: 0,
        },
        mimeType: {
            type: String,
            required: true,
            default: null,
        },
        extension: {
            type: String,
            required: true,
            default: null,
        },
        createdAt: { type: Date, required: true, default: Date.now },
        updatedAt: { type: Date, required: true, default: Date.now },
        parentId: {
            type: String,
            required: false,
            default: null,
            description: "ID of the parent folder, null if in root",
        },
        ownerId: {
            type: String,
            required: true,
            description: "UUID of the user who owns this file/folder",
        },
        shared: {
            type: Boolean,
            required: true,
            default: false,
            description: "Whether this file/folder is shared publicly",
        },
        sharedWith: [
            {
                type: String,
                description: "UUIDs of users this file/folder is shared with",
            },
        ],
        sharedWithTeams: [
            {
                type: String,
                description: "IDs of teams this file/folder is shared with",
            },
        ],
        path: {
            type: String,
            required: true,
            description: "Path to the file in storage",
        },
        deleted: {
            type: Boolean,
            required: true,
            default: false,
            description: "Soft delete flag",
        },
        deletedAt: {
            type: Date,
            required: false,
            default: null,
        },
    });

    private static areVirtualsInitialized = (() => {

        //Virtual for file's URL
        this.schema.virtual("url").get(function () {

            return "/file/" + this.id;
        })

        //Virtual for file's full info
        this.schema.virtual("info").get(function ( this: HydratedDocument<FileType>): FileType {
            return {
                id: this.id,
                name: this.name,
                type: this.type,
                size: this.size,
                mimeType: this.mimeType,
                extension: this.extension,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
                parentId: this.parentId,
                ownerId: this.ownerId,
                shared: this.shared,
                sharedWith: this.sharedWith,
                path: this.path,
            }
        })

        return true;

    })();

    static model: Model<FileType> = models.File || model<FileType>("File", this.schema);
    modelInstance;

    constructor(dataToConstruct: FileType){

        super();
        
        this.modelInstance = new File.model(dataToConstruct);

    }

    async save(){
    
        try {
            
            await this.modelInstance.save();
            //if (process.env.VERBOSE) console.log("💾 File collection created and saved");

        } catch (err: any) {
            
            throw new TracedError("collectionSaving", err.message);
        }
    }

    static async flushAll() {
        
        return this.model.deleteMany({});
    }
}

export default class FileSystem {

    static uploadsDir = path.join(__dirname, "..", "..", "uploads");
	static filesDir = path.join(this.uploadsDir, "files");
	static upload = multer({

		storage: this.defStorage(),
		limits: {
			fileSize: 50 * 1024 * 1024, // 50MB limit
		},
		fileFilter: this.defFilter(),
	});

    static async copyTestFiles(testFileName: string, targetPath: string) {

		try {
            
    		if (process.env.VERBOSE === "true") {
                
                console.group("⚙️ Copying test files..");
            }

            const testFilesPath = path.join(__dirname, "..", "..", "uploads", "usersFilesTest", testFileName);
            const targetDir = path.dirname(targetPath);

            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, {recursive: true});

            fs.copyFileSync(testFilesPath, targetPath);
            
            if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3") console.log(`📄 File copied : ${testFileName} -> ${targetPath}`);

            if (process.env.VERBOSE === "true") {
                
                console.groupEnd();
            }
            
        } catch (err: any) {
            
            throw new TracedError("testFilesCopying", err.message);
        }
		
	}

    static getFileSize(filePath: string){

        try {
            
			return fs.statSync(filePath).size;

        } catch (err: any) {
         
			throw new TracedError("getFileSize", err.message);
        }			
	}

    static flushUploadLocalDir() {

        try {
            
            fs.rmSync(this.filesDir, { recursive: true, force: true });
            fs.mkdirSync(this.filesDir, { recursive: true });

			if (process.env.VERBOSE === "true") console.log("✅ Local upload dir flushed successfully");

        } catch (err: any) {

            throw new Error("Error while flushing the upload directory. : " + err.message);

        }
    }

	private static defStorage(){
		
		return multer.diskStorage({

			destination: (req, file, integrityStatus) => {

				const userId = req.user.uuid;
				const fileId = req.body.fileId || uuidv4();

				//req.fileId = fileId // Store for later use
		
				const userDir = path.join(FileSystem.filesDir, userId);
				const fileDir = path.join(userDir, fileId);
		
				integrityStatus(null, fileDir);
			},
			filename: function (req, file, integrityStatus) {

				integrityStatus(null, file.originalname)
			},
		})

	}

	private static defFilter(){

		return (req, file, integrityStatus) => {

			const allowedMimes = [
				"image/jpeg",
				"image/png",
				"image/gif",
				"image/webp",
				"application/pdf",
				"application/msword",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"text/plain",
				"text/csv",
				"application/zip",
				"application/x-rar-compressed",
				"video/mp4",
				"video/quicktime",
				"video/x-msvideo",
				"audio/mpeg",
				"audio/wav",
			]

			if (allowedMimes.includes(file.mimetype)) {

				integrityStatus(null, true);

			} else {

				integrityStatus(new Error("File type not allowed"), false);
			}
		}

	}
}