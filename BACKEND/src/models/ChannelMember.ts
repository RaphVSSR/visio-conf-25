import mongoose, { model, Model, Schema, Types } from "mongoose"
import Collection from "./core/Collection.ts";
import TracedError from "./core/TracedError.ts";

const { models } = mongoose;


export type ChannelMemberType = {

    channelId: Types.ObjectId,
    userId: Types.ObjectId,
    role?: string,
    joinedAt?: Date,

}

export default class ChannelMember extends Collection {

    protected static schema = new Schema<ChannelMemberType>({

        channelId: {
            type: Schema.Types.ObjectId,
            ref: "Channel",
            required: true,
        },
        userId: {
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
    });

    private static areIndexesInitialized = (() => {

        this.schema.index({ channelId: 1, userId: 1 }, { unique: true });
    })()
    
    static model: Model<ChannelMemberType> = models.ChannelMember || model<ChannelMemberType>("ChannelMember", this.schema);

    modelInstance;

    constructor(dataToConstruct: ChannelMemberType){

        super();

        this.modelInstance = new ChannelMember.model(dataToConstruct);

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