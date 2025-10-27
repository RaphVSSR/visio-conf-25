import mongoose from "mongoose"

const channelPostSchema = new mongoose.Schema({
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
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
    // Champ pour stocker le nombre de réponses (pour optimiser les performances)
    responseCount: {
        type: Number,
        default: 0,
    },
})

// Index pour accélérer les recherches par canal
channelPostSchema.index({ channelId: 1, createdAt: -1 })

const ChannelPost = mongoose.model("ChannelPost", channelPostSchema)

export default ChannelPost
