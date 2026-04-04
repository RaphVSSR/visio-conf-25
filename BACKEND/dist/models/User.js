import mongoose, { model, Schema } from "mongoose";
import TracedError from "./core/TracedError.js";
import { sha256 } from "js-sha256";
const { models } = mongoose;
export default class User {
    static schema = new Schema({
        socket_id: { type: String, default: "none" },
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        status: {
            type: String,
            required: true,
            default: "waiting",
            enum: ["waiting", "active"],
            description: "Choose user status between : waiting, active",
        },
        password: { type: String, required: true, description: "SHA256" },
        job: {
            type: String,
            description: "Job description",
        },
        desc: {
            type: String,
            default: "",
            description: "User description",
        },
        date_created: { type: Date, required: true, default: Date.now },
        picture: {
            type: String,
            required: true,
            default: "default_profile_picture.png",
        },
        is_online: { type: Boolean, required: true, default: false },
        disturb_status: {
            type: String,
            required: true,
            default: "available",
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
        roles: [
            {
                type: String,
                default: "user",
                description: `List of role uuids (e.g. "admin", "user")`,
            },
        ],
    });
    static model = models.User || model("User", this.schema);
    modelInstance;
    constructor(dataToConstruct) {
        this.modelInstance = new User.model(dataToConstruct);
    }
    static async inject() {
        [{
                firstname: "test1",
                lastname: "testlast1",
                email: "test1@visioconf.com",
                phone: "06 52 14 55 45",
                password: sha256("12345678"),
                desc: "Une description vreumannnnn",
                status: "active",
                roles: ["admin", "user"],
            },
            {
                firstname: "test2",
                lastname: "testlast2",
                email: "test2@visioconf.com",
                phone: "06 52 14 55 45",
                password: sha256("12345678"),
                desc: "Une description vreumannnnn",
                status: "active",
                roles: ["user"],
            },
            {
                firstname: "test3",
                lastname: "testlast3",
                email: "test3@visioconf.com",
                phone: "06 52 14 55 45",
                password: sha256("12345678"),
                desc: "Une description vreumannnnn",
                status: "active",
                roles: ["user"],
            },
            {
                firstname: "test4",
                lastname: "testlast4",
                email: "test4@visioconf.com",
                phone: "06 52 14 55 45",
                password: sha256("12345678"),
                desc: "Une description vreumannnnn",
                status: "active",
                roles: ["user"],
            },
            {
                firstname: "test5",
                lastname: "testlast5",
                email: "test5@visioconf.com",
                phone: "06 52 14 55 45",
                password: sha256("12345678"),
                desc: "Une description vreumannnnn",
                status: "active",
                roles: ["user"],
            }].map(user => {
            const newUser = new User(user);
            newUser.save();
        });
    }
    async save() {
        try {
            await this.modelInstance.save();
        }
        catch (error) {
            throw new TracedError("collectionSaving", error.message);
        }
    }
    static async getUser(email) {
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
            return;
        return this.model.findOne({ email: email });
    }
    static async getUsers(emails) {
        emails.forEach((email, index) => {
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
                emails.splice(index, 1);
        });
        return this.model.find({ email: { $in: emails } });
    }
    static async updateUser(email, newData) {
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
            return;
        return this.model.updateOne({ email: email }, { $set: newData });
    }
    static async updateUsers(emails, newData) {
        emails.forEach((email, index) => {
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
                emails.splice(index, 1);
        });
        return this.model.updateMany({ email: { $in: emails } }, { $set: newData });
    }
    static async deleteUser(email) {
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
            return;
        return this.model.deleteOne({ email: email });
    }
    static async deleteUsers(emails) {
        emails.forEach((email, index) => {
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))
                emails.splice(index, 1);
        });
        return this.model.deleteMany({ email: { $in: emails } });
    }
    static async flushAll() {
        return this.model.deleteMany({});
    }
}
//# sourceMappingURL=User.js.map