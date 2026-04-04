import mongoose, { model, Schema } from "mongoose";
import Collection from "./core/Collection.js";
import TracedError from "./core/TracedError.js";
const { models } = mongoose;
export default class ChannelPostResponse extends Collection {
    static schema = new Schema({
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
    static areIndexesInitialized = (() => {
        this.schema.index({ postId: 1, createdAt: 1 });
    })();
    static model = models.ChannelPostResponse || model("ChannelPostResponse", this.schema);
    modelInstance;
    constructor(dataToConstruct) {
        super();
        this.modelInstance = new ChannelPostResponse.model(dataToConstruct);
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
;
//# sourceMappingURL=ChannelPostResponse.js.map