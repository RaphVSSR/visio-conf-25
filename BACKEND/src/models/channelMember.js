import mongoose from "mongoose"

const channelMemberSchema = new mongoose.Schema({
    channelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    role: {
        type: String,
        enum: ["admin", "member"],
        default: "member",
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
})

// Ensure a user can only be a member of a channel once
channelMemberSchema.index({ channelId: 1, userId: 1 }, { unique: true })

const ChannelMember = mongoose.model("ChannelMember", channelMemberSchema)

export default ChannelMember
