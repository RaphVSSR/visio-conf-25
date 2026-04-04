import mongoose, { model, Schema } from "mongoose";
import Collection from "./core/Collection.js";
import TracedError from "./core/TracedError.js";
import Team from "./Team.js";
import ChannelMember from "./ChannelMember.js";
import TeamMember from "./TeamMember.js";
const { models } = mongoose;
export default class Channel extends Collection {
    static schema = new Schema({
        name: {
            type: String,
            required: true,
            trim: true,
        },
        teamId: {
            type: Schema.Types.ObjectId,
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
        members: [{
                type: Schema.Types.ObjectId,
                ref: "ChannelMember",
            }],
    });
    static model = models.Channel || model("Channel", this.schema);
    modelInstance;
    constructor(dataToConstruct) {
        super();
        this.modelInstance = new Channel.model(dataToConstruct);
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
            console.group("💉 Injecting testing channels..");
        }
        if (await Team.model.countDocuments({}) === 0)
            throw new TracedError("noTeamsFound");
        try {
            for (const team of await Team.model.find({})) {
                const generalChannel = new Channel({
                    name: "Général",
                    teamId: team._id,
                    isPublic: true,
                    createdBy: team.createdBy,
                });
                if (team.members) {
                    generalChannel.modelInstance.members = await Promise.all(team.members.map(async (memberId) => {
                        const newMember = new ChannelMember({
                            channelId: generalChannel.modelInstance._id,
                            userId: memberId,
                            role: (await TeamMember.model.findOne({ _id: memberId }, { _id: 0, role: 1 }).lean())?.role,
                        });
                        await newMember.save();
                        return newMember.modelInstance._id;
                    }));
                }
                await generalChannel.save();
                if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3")
                    console.log(`💾 New channel "${generalChannel.modelInstance.name}" created`);
                async function injectAdditionalChannels(additionalChannels) {
                    for (const channel of additionalChannels) {
                        const newChannel = new Channel({
                            name: channel.name,
                            teamId: team._id,
                            isPublic: channel.isPublic,
                            createdBy: channel.createdBy,
                        });
                        if (channel.members) {
                            newChannel.modelInstance.members = await Promise.all(channel.members.map(async (memberId) => {
                                const newMember = new ChannelMember({
                                    userId: memberId,
                                    role: (await TeamMember.model.findOne({ _id: memberId }, { _id: 0, role: 1 }).lean())?.role,
                                    channelId: newChannel.modelInstance._id,
                                });
                                await newMember.save();
                                return newMember.modelInstance._id;
                            }));
                        }
                        else if (channel.isPublic) {
                            newChannel.modelInstance.members = await Promise.all(team.members.map(async (memberId) => {
                                const newMember = new ChannelMember({
                                    userId: memberId,
                                    role: (await TeamMember.model.findOne({ _id: memberId }, { _id: 0, role: 1 }).lean())?.role,
                                    channelId: newChannel.modelInstance._id,
                                });
                                await newMember.save();
                                return newMember.modelInstance._id;
                            }));
                        }
                        await newChannel.save();
                        if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3")
                            console.log(`💾 New channel "${newChannel.modelInstance.name}" created`);
                    }
                }
                switch (team.name) {
                    case "Département MMI": {
                        await injectAdditionalChannels([{
                                name: "Réunions",
                                isPublic: true,
                                createdBy: team.createdBy,
                            },
                            {
                                name: "Événements",
                                isPublic: true,
                                createdBy: team.createdBy,
                            },
                            {
                                name: "Direction",
                                isPublic: false,
                                createdBy: team.createdBy,
                                members: await TeamMember.model.find({ role: "admin" }, { _id: 1 }),
                            }]);
                        break;
                    }
                    case "Projet Web Avancé": {
                        await injectAdditionalChannels([{
                                name: "Frontend",
                                isPublic: true,
                                createdBy: team.createdBy,
                            },
                            {
                                name: "Backend",
                                isPublic: true,
                                createdBy: team.createdBy,
                            },
                            {
                                name: "Design",
                                isPublic: true,
                                createdBy: team.createdBy,
                            }]);
                        break;
                    }
                    case "Administration": {
                        await injectAdditionalChannels([{
                                name: "Plannings",
                                isPublic: true,
                                createdBy: team.createdBy,
                            },
                            {
                                name: "Budget",
                                isPublic: false,
                                createdBy: team.createdBy,
                                members: await TeamMember.model.find({ role: "admin" }, { _id: 1 }),
                            }]);
                        break;
                    }
                }
            }
            if (process.env.VERBOSE === "true") {
                console.log(`✅ ${await Channel.model.countDocuments({})} channels created`);
                console.groupEnd();
                console.log("");
            }
        }
        catch (error) {
            console.trace(error);
            throw new Error(error.message);
        }
    }
}
//# sourceMappingURL=Channel.js.map