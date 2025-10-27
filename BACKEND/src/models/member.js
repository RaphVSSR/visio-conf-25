import mongoose from "mongoose"
const Schema = mongoose.Schema

const memberSchema = new Schema({
    id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    channel_id: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    role_id: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    // role_id (channel.roles[role_id]) ???
    member_date_join: { type: Date, required: true, default: Date.now },
})

export default mongoose.model("Member", memberSchema)
