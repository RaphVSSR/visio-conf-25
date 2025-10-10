import mongoose from "mongoose"
const Schema = mongoose.Schema

const teamSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    picture: {
        type: String,
        default: null,
        description: "Filename of the team picture stored",
    },
    createdBy: {
        type: Schema.Types.ObjectId,
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

const Team = mongoose.model("Team", teamSchema)

export default Team
