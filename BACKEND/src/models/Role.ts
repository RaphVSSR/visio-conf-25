import mongoose, { model, Model, Schema, Types } from "mongoose";
import Collection from "./core/Collection.ts";
import TracedError from "./core/TracedError.ts";
import Permission from "./Permission.ts";

const { models } = mongoose;


export type RoleType = {

    uuid: string,
    label: string,
    permissions?: Types.ObjectId[],
    default: boolean,

}
export default class Role extends Collection {

    protected static schema = new Schema<RoleType>({

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
        //TODO: have to implement default permissions for default role user
    });
    
    static model: Model<RoleType> = models.Role || model<RoleType>("Role", this.schema);

    modelInstance;

    constructor(dataToConstruct: RoleType){

        super();

        this.modelInstance = new Role.model(dataToConstruct);

    }

    static async inject() {

        if (process.env.VERBOSE === "true"){
            
            console.group("💉 Injecting Roles..");
        }

        if (await Permission.model.countDocuments({}) === 0) throw new Error("The permissions collection needs to be initialized before roles injection..");

        const rolesToInsert: RoleType[] = [
            {
                uuid: "admin",
                label: "Administrateur",
                permissions: (await Permission.model.find({default: true}, {_id: 1}).lean()).map(permObj => permObj._id),
                default: true,
            },
            {
                uuid: "user",
                label: "Utilisateur",
                permissions: (await Permission.model.find({default: true}, {_id: 1}).lean()).map(permObj => permObj._id),
                default: true,
            },
        ];

        for (const role of rolesToInsert) {

            if (!await this.model.findOne({label: role.label})) {

                const newRole = new Role(role);
                await newRole.save()

                if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3") console.log(`💾 New role "${role.label}" created`);

            } else {

                if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3") console.log(`💾 Role "${role.label}" already exists`);

            }
        }

        if (process.env.VERBOSE === "true"){
            
            console.log(`✅ ${await Role.model.countDocuments({})} roles created`);
            console.groupEnd();
            console.log("");
        }
    }

    async save(){

        try {
            
            await this.modelInstance.save();
            //if (process.env.VERBOSE) console.log("💾 User collection created and saved");

        } catch (err: any) {
            
            throw new TracedError("collectionSaving", err.message);
        }
    }

    static async getRole(label: string) {
    
        return this.model.findOne({label: label});
    }

    static async getRoles(labels: string[]) {

        return this.model.find({ label: {$in: labels}});
    }

    static async updateRole(label: string, newData: Partial<RoleType>) {

        return this.model.updateOne({email: label}, { $set: newData });
    }

    static async updateRoles(labels: string[], newData: Partial<RoleType>) {

        return this.model.updateMany({ email: {$in: labels}}, { $set: newData });
    }

    static async deleteRole(label: string) {

        return this.model.deleteOne({label: label});
    }

    static async deleteRoles(labels: string[]) {

        return this.model.deleteMany({ label: {$in: labels}});
    }

    static async flushAll() {
            
        return this.model.deleteMany({});
    }
}