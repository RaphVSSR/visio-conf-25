import mongoose, { model, Schema } from "mongoose";
import Collection from "./core/Collection.js";
import TracedError from "./core/TracedError.js";
import Permission from "./Permission.js";
const { models } = mongoose;
export default class Role extends Collection {
    static schema = new Schema({
        uuid: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        permissions: [{
                type: Schema.Types.ObjectId,
                ref: "Permission"
            }],
        default: {
            type: Boolean,
            required: true,
            default: false
        },
    });
    static model = models.Role || model("Role", this.schema);
    modelInstance;
    constructor(dataToConstruct) {
        super();
        this.modelInstance = new Role.model(dataToConstruct);
    }
    static async inject() {
        if (process.env.VERBOSE === "true") {
            console.group("💉 Injecting Roles..");
        }
        if (await Permission.model.countDocuments({}) === 0)
            throw new Error("The permissions collection needs to be initialized before roles injection..");
        const rolesToInsert = [
            {
                uuid: "admin",
                label: "Administrateur",
                permissions: (await Permission.model.find({}, { _id: 1 }).lean()).map(permObj => permObj._id),
                default: true,
            },
            {
                uuid: "user",
                label: "Utilisateur",
                permissions: (await Permission.model.find({ default: true }, { _id: 1 }).lean()).map(permObj => permObj._id),
                default: true,
            },
        ];
        for (const role of rolesToInsert) {
            if (!await this.model.findOne({ label: role.label })) {
                const newRole = new Role(role);
                await newRole.save();
                if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3")
                    console.log(`💾 New role "${role.label}" created`);
            }
            else {
                if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3")
                    console.log(`💾 Role "${role.label}" already exists`);
            }
        }
        if (process.env.VERBOSE === "true") {
            console.log(`✅ ${await Role.model.countDocuments({})} roles created`);
            console.groupEnd();
            console.log("");
        }
    }
    async save() {
        try {
            await this.modelInstance.save();
        }
        catch (error) {
            throw new TracedError("collectionSaving", error.message);
        }
    }
    static async getRole(label) {
        return this.model.findOne({ label: label });
    }
    static async getRoles(labels) {
        return this.model.find({ label: { $in: labels } });
    }
    static async updateRole(label, newData) {
        return this.model.updateOne({ label: label }, { $set: newData });
    }
    static async updateRoles(labels, newData) {
        return this.model.updateMany({ label: { $in: labels } }, { $set: newData });
    }
    static async deleteRole(label) {
        return this.model.deleteOne({ label: label });
    }
    static async deleteRoles(labels) {
        return this.model.deleteMany({ label: { $in: labels } });
    }
    static async flushAll() {
        return this.model.deleteMany({});
    }
}
//# sourceMappingURL=Role.js.map