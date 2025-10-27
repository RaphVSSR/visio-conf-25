import mongoose from "mongoose"
const { Schema } = mongoose

const teamMemberSchema = new Schema({
    teamId: {
        type: Schema.Types.ObjectId,
        ref: "Team",
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
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

// Index pour éviter les doublons
teamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true })

const TeamMember = mongoose.model("TeamMember", teamMemberSchema)
export default TeamMember
