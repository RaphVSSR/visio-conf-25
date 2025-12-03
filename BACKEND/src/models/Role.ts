
import mongoose, { model, Model, Schema } from "mongoose"
import Collection from "./Core/Collection.ts";
import TracedError from "./Core/TracedError.ts";
import Permission from "./Permission.ts";

const { models } = mongoose;


export type RoleType = {

    uuid: string,
    label: string,
    permissions?: any[],
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

    async save(){

        try {
            
            await this.modelInstance.save();
            //if (process.env.VERBOSE) console.log("💾 User collection created and saved");

        } catch (err: any) {
            
            throw new TracedError("collectionSaving", err.message);
        }
    }

    static async flushAll() {
            
        return this.model.deleteMany({});
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
                permissions: (await Permission.model.find({}, {_id: 1}).lean()).map(permObj => permObj._id),
                default: true,
            },
            {
                uuid: "user",
                label: "Utilisateur",
                permissions: (await Permission.model.find({}, {_id: 1}).lean()).map(permObj => permObj._id),
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
}