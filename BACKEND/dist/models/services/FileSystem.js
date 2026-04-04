import mongoose, { model, Schema } from "mongoose";
import crypto from "crypto";
import Collection from "../core/Collection.js";
import TracedError from "../core/TracedError.js";
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import multer from "multer";
const { models } = mongoose;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class Folder extends Collection {
    static schema = new Schema({
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
    static model = models.Folder || model("File", this.schema);
    modelInstance;
    files;
    constructor(dataToConstruct) {
        super();
        this.modelInstance = new Folder.model(dataToConstruct);
        if (dataToConstruct.files)
            this.files = dataToConstruct.files.map(file => {
                return new File(file);
            });
    }
    async save() {
        try {
            await this.modelInstance.save();
            try {
                if (this.files)
                    await Promise.all(this.files.map(file => file.save()));
            }
            catch (error) {
                console.error(error);
            }
        }
        catch (error) {
            throw new TracedError("collectionSaving", error.message);
        }
    }
    static async flushAll() {
        await File.flushAll();
        return this.model.deleteMany({});
    }
}
export class File extends Collection {
    static schema = new Schema({
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
    static areVirtualsInitialized = (() => {
        this.schema.virtual("url").get(function () {
            return "/file/" + this.id;
        });
        this.schema.virtual("info").get(function () {
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
            };
        });
        return true;
    })();
    static model = models.File || model("File", this.schema);
    modelInstance;
    constructor(dataToConstruct) {
        super();
        this.modelInstance = new File.model(dataToConstruct);
    }
    async save() {
        try {
            await this.modelInstance.save();
        }
        catch (error) {
            throw new TracedError("collectionSaving", error.message);
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
            fileSize: 50 * 1024 * 1024,
        },
        fileFilter: this.defFilter(),
    });
    static async copyTestFiles(testFileName, targetPath) {
        try {
            if (process.env.VERBOSE === "true") {
                console.group("⚙️ Copying test files..");
            }
            const testFilesPath = path.join(__dirname, "..", "..", "uploads", "usersFilesTest", testFileName);
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir))
                fs.mkdirSync(targetDir, { recursive: true });
            fs.copyFileSync(testFilesPath, targetPath);
            if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3")
                console.log(`📄 File copied : ${testFileName} -> ${targetPath}`);
            if (process.env.VERBOSE === "true") {
                console.groupEnd();
            }
        }
        catch (error) {
            throw new TracedError("testFilesCopying", error.message);
        }
    }
    static getFileSize(filePath) {
        try {
            return fs.statSync(filePath).size;
        }
        catch (error) {
            throw new TracedError("getFileSize", error.message);
        }
    }
    static flushUploadLocalDir() {
        try {
            fs.rmSync(this.filesDir, { recursive: true, force: true });
            fs.mkdirSync(this.filesDir, { recursive: true });
            if (process.env.VERBOSE === "true")
                console.log("✅ Local upload dir flushed successfully");
        }
        catch (error) {
            throw new Error("Error while flushing the upload directory. : " + error.message);
        }
    }
    static defStorage() {
        return multer.diskStorage({
            destination: (req, file, integrityStatus) => {
                const userId = req.user.uuid;
                const fileId = req.body.fileId || crypto.randomUUID();
                const userDir = path.join(FileSystem.filesDir, userId);
                const fileDir = path.join(userDir, fileId);
                integrityStatus(null, fileDir);
            },
            filename: function (req, file, integrityStatus) {
                integrityStatus(null, file.originalname);
            },
        });
    }
    static defFilter() {
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
            ];
            if (allowedMimes.includes(file.mimetype)) {
                integrityStatus(null, true);
            }
            else {
                integrityStatus(new Error("File type not allowed"), false);
            }
        };
    }
}
//# sourceMappingURL=FileSystem.js.map