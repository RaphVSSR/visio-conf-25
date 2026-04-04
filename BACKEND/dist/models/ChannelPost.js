import mongoose, { model, Schema } from "mongoose";
import Collection from "./core/Collection.js";
import TracedError from "./core/TracedError.js";
import Channel from "./Channel.js";
import ChannelPostResponse from "./ChannelPostResponse.js";
import ChannelMember from "./ChannelMember.js";
const { models } = mongoose;
export default class ChannelPost extends Collection {
    static schema = new Schema({
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
        responseCount: {
            type: Number,
            default: 0,
        },
    });
    static areIndexesInitialized = (() => {
        this.schema.index({ channelId: 1, createdAt: -1 });
    })();
    static model = models.ChannelPost || model("ChannelPost", this.schema);
    modelInstance;
    constructor(dataToConstruct) {
        super();
        this.modelInstance = new ChannelPost.model(dataToConstruct);
    }
    async save() {
        try {
            await this.modelInstance.save();
        }
        catch (error) {
            throw new TracedError("collectionSaving", error.message);
        }
    }
    static async flushAll() {
        return this.model.deleteMany({});
    }
    static async injectTest() {
        if (process.env.VERBOSE === "true") {
            console.group("💉 Injecting channels posts..");
        }
        try {
            for (const channel of await Channel.model.find({})) {
                for (const channelPost of [
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
                ]) {
                    const newPost = new ChannelPost(channelPost);
                    await newPost.save();
                    if (channel.members && channel.members.length > 0) {
                        for (const member of await Promise.all(channel.members.map(async (memberId) => await ChannelMember.model.findById(memberId)))) {
                            if (member.role === "admin")
                                continue;
                            const newResponse = new ChannelPostResponse({
                                postId: newPost.modelInstance._id,
                                content: `Answer to "${channelPost.content}"`,
                                authorId: member._id,
                            });
                            await newResponse.save();
                        }
                        ;
                    }
                    ;
                }
                ;
                if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3") {
                    console.log(`💾 ${await ChannelPost.model.countDocuments({ channelId: channel._id })} posts created for "${channel.name}"`);
                }
            }
            ;
            if (process.env.VERBOSE === "true") {
                console.log(`✅ ${await ChannelPost.model.countDocuments({})} posts created in total`);
                console.groupEnd();
                console.log("");
            }
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
    ;
}
;
//# sourceMappingURL=ChannelPost.js.map