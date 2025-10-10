import mongoose from "mongoose"
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Default values
const DEFAULT_USER_PICTURE = "default_profile_picture.png"
const DEFAULT_ROLE = ["user"]
const DEFAULT_STATUS = "waiting"
const DEFAULT_DISTURB_STATUS = "available"

const UserSchema = new Schema({
    uuid: { type: String, required: true },
    socket_id: { type: String, required: true, default: "none" },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
        type: String,
        required: true,
        default: DEFAULT_STATUS,
        enum: ["waiting", "active", "banned", "deleted"],
        description:
            "Choose user status between : waiting, active, banned, deleted",
    },
    password: { type: String, required: true, description: "SHA256" },
    job: {
        type: String,
        required: true,
        description: "Job description",
    },
    desc: {
        type: String,
        required: true,
        description: "User description",
    },
    date_create: { type: Date, required: true, default: Date.now },
    picture: {
        type: String,
        required: true,
        default: DEFAULT_USER_PICTURE,
    },
    is_online: { type: Boolean, required: true, default: false },
    disturb_status: {
        type: String,
        required: true,
        default: DEFAULT_DISTURB_STATUS,
        enum: ["available", "offline", "dnd"],
        description: "Choose user status between : available, offline, dnd",
    },
    last_connection: { type: Date, required: true, default: Date.now },
    direct_manager: {
        type: String,
        required: true,
        default: "none",
        description: "User uuid of the direct manager",
    },
    tokens: { type: Object, default: {} },
    roles: [
        {
            type: ObjectId,
            ref: "Role",
            default: DEFAULT_ROLE,
            description: `List of roles id created by admin in the roles collection`,
        },
    ],
})

const User = mongoose.model("User", UserSchema)
export default User
