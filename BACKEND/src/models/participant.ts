import mongoose from "mongoose"
const Schema = mongoose.Schema

const participantSchema = new Schema({
    id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    team_id: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    role_id: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    participant_date_join: { type: Date, required: true, default: Date.now },
})

export default mongoose.model("Participant", participantSchema)
