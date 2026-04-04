import mongoose, { model, Schema } from "mongoose";
import Collection from "./core/Collection.js";
import TracedError from "./core/TracedError.js";
const { models } = mongoose;
export default class TeamMember extends Collection {
    static schema = new Schema({
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
    });
    static areIndexesInitialized = (() => {
        this.schema.index({ teamId: 1, id: 1 }, { unique: true });
    })();
    static model = models.TeamMember || model("TeamMember", this.schema);
    modelInstance;
    constructor(dataToConstruct) {
        super();
        this.modelInstance = new TeamMember.model(dataToConstruct);
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
//# sourceMappingURL=TeamMember.js.map