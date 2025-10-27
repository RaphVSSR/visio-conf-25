import mongoose, { model, Model, Schema } from "mongoose"
import Collection from "./Core/Collection.ts";
import TracedError from "./Core/TracedError.ts";

const { models } = mongoose;


export type ChannelType = {

    name: string,
    teamId: string,
    isPublic: boolean,
    createdBy: Schema.Types.ObjectId,
    createdAt?: Date,
    updatedAt?: Date,

}

export default class Channel extends Collection {

    protected static schema = new Schema<ChannelType>({

        name: {
            type: String,
            required: true,
            trim: true,
        },
        teamId: {
            type: String,
            required: true,
        },
        isPublic: {
            type: Boolean,
            default: true,
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
    });
    
    static model: Model<ChannelType> = models.Channel || model<ChannelType>("Channel", this.schema);

    modelInstance;

    constructor(dataToConstruct: ChannelType){

        super();

        this.modelInstance = new Channel.model(dataToConstruct);

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