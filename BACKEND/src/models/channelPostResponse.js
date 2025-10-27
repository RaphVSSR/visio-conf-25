import mongoose from "mongoose"

const channelPostResponseSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChannelPost",
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    authorId: {
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

// Index pour accélérer les recherches par post
channelPostResponseSchema.index({ postId: 1, createdAt: 1 })

const ChannelPostResponse = mongoose.model(
    "ChannelPostResponse",
    channelPostResponseSchema
)

export default ChannelPostResponse
