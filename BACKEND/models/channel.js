import mongoose from "mongoose"

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    teamId: {
        type: String,
        required: true,
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
})

const Channel = mongoose.model("Channel", channelSchema)

export default Channel
