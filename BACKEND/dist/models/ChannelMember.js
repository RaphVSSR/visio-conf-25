import mongoose, { model, Schema } from "mongoose";
import Collection from "./core/Collection.js";
import TracedError from "./core/TracedError.js";
const { models } = mongoose;
export default class ChannelMember extends Collection {
    static schema = new Schema({
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
    static areIndexesInitialized = (() => {
        this.schema.index({ channelId: 1, userId: 1 }, { unique: true });
    })();
    static model = models.ChannelMember || model("ChannelMember", this.schema);
    modelInstance;
    constructor(dataToConstruct) {
        super();
        this.modelInstance = new ChannelMember.model(dataToConstruct);
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
}
//# sourceMappingURL=ChannelMember.js.map