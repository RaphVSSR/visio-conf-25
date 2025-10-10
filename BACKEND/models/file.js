import mongoose from "mongoose"
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const FileSchema = new Schema({
    id: { type: String, required: true }, // UUID for the file
    name: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ["file", "folder"],
        description: "Type of item: file or folder",
    },
    size: {
        type: Number,
        required: function () {
            return this.type === "file"
        },
        default: 0,
    },
    mimeType: {
        type: String,
        required: function () {
            return this.type === "file"
        },
        default: null,
    },
    extension: {
        type: String,
        required: function () {
            return this.type === "file"
        },
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
        required: function () {
            return this.type === "file"
        },
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
})

// Virtual for file's URL
FileSchema.virtual("url").get(function () {
    return "/file/" + this.id
})

// Virtual for file's full info
FileSchema.virtual("info").get(function () {
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

// Method to get children of a folder
FileSchema.statics.getChildren = async function (folderId, ownerId) {
    return await this.find({
        parentId: folderId,
        ownerId: ownerId,
        deleted: false,
    })
}

// Method to get shared files for a user
FileSchema.statics.getSharedWithUser = async function (userId) {
    return await this.find({
        sharedWith: { $in: [userId] },
        deleted: false,
    })
}

const File = mongoose.model("File", FileSchema)
export default File
