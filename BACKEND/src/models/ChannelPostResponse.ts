import mongoose, { model, Model, Schema, Types } from "mongoose"
import Collection from "./core/Collection.ts";
import TracedError from "./core/TracedError.ts";

const { models } = mongoose;


export type ChannelPostResponseType = {

    postId: Types.ObjectId,
    content: string,
    authorId: Types.ObjectId,
    createdAt?: Date,
    updatedAt?: Date,

}

export default class ChannelPostResponse extends Collection {

    protected static schema = new Schema<ChannelPostResponseType>({

        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChannelPost",
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
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

    private static areIndexesInitialized = (() => {

        this.schema.index({ postId: 1, createdAt: 1 });
    })()
    
    static model: Model<ChannelPostResponseType> = models.ChannelPostResponse || model<ChannelPostResponseType>("ChannelPostResponse", this.schema);

    modelInstance;

    constructor(dataToConstruct: ChannelPostResponseType){

        super();

        this.modelInstance = new ChannelPostResponse.model(dataToConstruct);

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
};
