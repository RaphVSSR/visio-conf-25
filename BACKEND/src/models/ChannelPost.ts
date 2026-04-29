import mongoose, { model, Model, Schema, Types } from "mongoose"
import Collection from "./core/Collection.ts"
import TracedError from "./core/TracedError.ts"
import Channel from "./Channel.ts";
import ChannelPostResponse from "./ChannelPostResponse.ts";
import User from "./User.ts";
import ChannelMember from "./ChannelMember.ts";

const { models } = mongoose;


export type ChannelPostType = {

    channelId: Types.ObjectId,
    content: string,
    authorId: Types.ObjectId,
    createdAt?: Date,
    updatedAt?: Date,
    responseCount?: number,

}

export default class ChannelPost extends Collection {

    protected static schema = new Schema<ChannelPostType>({

        channelId: {
            type: Schema.Types.ObjectId,
            ref: "Channel",
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        authorId: {
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
        // Champ pour stocker le nombre de réponses (pour optimiser les performances)
        responseCount: {
            type: Number,
            default: 0,
        },
    });

    private static areIndexesInitialized = (() => {

        this.schema.index({ channelId: 1, createdAt: -1 });
    })()
    
    static model: Model<ChannelPostType> = models.ChannelPost || model<ChannelPostType>("ChannelPost", this.schema);

    modelInstance;

    constructor(dataToConstruct: ChannelPostType){

        super();

        this.modelInstance = new ChannelPost.model(dataToConstruct);

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

    static async injectTest(){

        if (process.env.VERBOSE === "true"){
            
            console.group("💉 Injecting channels posts..");
        }

        try {

            for (const channel of await Channel.model.find({})){
            
                for ( const channelPost of [
                    {
                        channelId: channel._id,
                        content: `First message in channel.`,
                        authorId: channel.createdBy,
                    },
                    {
                        channelId: channel._id,
                        content: `Second message in channel`,
                        authorId: channel.createdBy,
                    },
                ]){

                    const newPost = new ChannelPost(channelPost);
                    await newPost.save();

                    if (channel.members && channel.members.length > 0){

                        for (const member of await Promise.all(channel.members.map( async (memberId) => await ChannelMember.model.findById(memberId)))){

                            if (member!.role === "admin") continue;
                            
                            const newResponse = new ChannelPostResponse(
            
                                {
                                    postId: newPost.modelInstance._id,
                                    content: `Answer to "${channelPost.content}"`,
                                    authorId: member!._id,
                                }
                            )
                            await newResponse.save();
                        };

                    };
                };

                if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3"){
                                                    
                    console.log(`💾 ${await ChannelPost.model.countDocuments({channelId: channel._id})} posts created for "${channel.name}"`);
                }
            };

            if (process.env.VERBOSE === "true"){
                                                    
                console.log(`✅ ${await ChannelPost.model.countDocuments({})} posts created in total`);
                console.groupEnd();
                console.log("");
            }
            
        } catch (err: any) {
            
            throw new Error(err.message);
        }
    };
};