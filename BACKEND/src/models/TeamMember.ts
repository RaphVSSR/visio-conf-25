import mongoose, { model, Model, Schema, Types } from "mongoose"
import Collection from "./core/Collection.ts"
import TracedError from "./core/TracedError.ts";

const { models } = mongoose;


export type TeamMemberType = {

    id: Types.ObjectId,
    role?: string,
    joinedAt?: Date,
    teamId: Types.ObjectId

}

export default class TeamMember extends Collection {

    static schema = new Schema<TeamMemberType>({

        id: {

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
        teamId: {

            type: Schema.Types.ObjectId,
            ref: "Team",
            required: true,
        },

    })

    private static areIndexesInitialized = (() => {

        this.schema.index({ teamId: 1, id: 1 }, { unique: true });
    })()
    
    static model: Model<TeamMemberType> = models.TeamMember || model<TeamMemberType>("TeamMember", this.schema);

    modelInstance;

    constructor(dataToConstruct: TeamMemberType){

        super();

        this.modelInstance = new TeamMember.model(dataToConstruct);

    }

    async save(){

        try {
            
            await this.modelInstance.save();
            //if (process.env.VERBOSE === "true") console.log("💾 User collection created and saved");

        } catch (err: any) {
            
            throw new TracedError("collectionSaving", err.message);
        }
    }

    static async flushAll() {
        
        return this.model.deleteMany({});
    }
}