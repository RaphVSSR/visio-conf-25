import mongoose, { type HydratedDocument, model, Schema, Types } from "mongoose"
import crypto from "crypto"
import Collection from "./core/Collection.ts"
import { Model } from "mongoose"
import TracedError from "./core/TracedError.ts"
import User, { type UserType } from "./User.ts"

const { models } = mongoose;


export type DiscuType = {

    uuid: string,
    name: string,
    description?: string,
    creator: Types.ObjectId,
    type?: string,
    members: Types.ObjectId[],
    date_created?: Date,
    messages?: {

        uuid: string,
        content: string,
        sender: Types.ObjectId,
        date_created: Date,
        react_list?: {

            user: Types.ObjectId,
            type: string,
        },
        status?: string,
    }[],

}

export default class Discussion extends Collection {

    protected static schema = new Schema<DiscuType>({

        uuid: { type: String, required: true },
        name: { type: String, default: "" },
        description: { type: String, default: "" },
        creator: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            required: true,
            default: "unique",
            enum: ["unique", "group"],
            description: "Choose discussion type between : unique, group",
        },
        members: [
            { type: Schema.Types.ObjectId, ref: "User", required: true },
        ],
        date_created: { type: Date, required: true, default: Date.now },
        messages: [
            {
                uuid: { type: String, required: true },
                content: { type: String, required: true },
                sender: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                date_created: {
                    type: Date,
                    required: true,
                    default: Date.now,
                },
                react_list: [
                    {
                        user: {
                            type: Schema.Types.ObjectId,
                            ref: "User",
                            required: true,
                        },
                        type: {
                            type: String,
                            required: true,
                            default: "like",
                            enum: ["like", "love", "haha", "wow", "sad", "angry"],
                            description:
                                "Choose react type between : like, love, haha, wow, sad, angry",
                        },
                    },
                ],
                status: {
                    type: String,
                    required: true,
                    default: "sent",
                    enum: ["sent", "read"],
                    description:
                        "Choose message status between : sent, received, read",
                },
            },
        ],
    });
    
    static model: Model<DiscuType> = models.Discussion || model<DiscuType>("Discussion", this.schema);

    private static areVirtualsInitialized = (() => {
    
        this.schema.virtual("discussionMembersCount").get(function ( this: HydratedDocument<DiscuType>): number {
            return this.members.length;
        });

        this.schema.virtual("discussionMessagesCount").get(function ( this: HydratedDocument<DiscuType>): number {
            return this.messages?.length ?? 0;
        });

        this.schema.virtual("info").get(function ( this: HydratedDocument<DiscuType>): DiscuType {
            return {
                uuid: this.uuid,
                name: this.name,
                description: this.description,
                creator: this.creator,
                type: this.type,
                members: this.members,
                date_created: this.date_created,
                //members_count: this.members_count,
                //messages_count: this.messages_count,
            }
        });

        return true;

    })()
    private static areMethodsInitialized = (() => {
    
        this.schema.methods.findLastMessage = function () {

            return this.discussion_messages[this.discussion_messages.length - 1];
        }

        return true;

    })()

    modelInstance;

    constructor(dataToConstruct: DiscuType){

        super();

        this.modelInstance = new Discussion.model(dataToConstruct);

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
            
            console.group("💉 Injecting testing discussions..");
        }

        if (await User.model.countDocuments({}) < 2)  throw new Error("❌ Pas assez d'utilisateurs pour créer des discussions");

        const users: (UserType & { _id: Types.ObjectId })[] = await User.model.find({

            $or: [
                { firstname: {$regex: "^John$", $options: "i"}},
                { firstname: {$regex: "^Janny$", $options: "i"}},
                { firstname: {$regex: "^Jean$", $options: "i"}},
                { firstname: {$regex: "^Hélios$", $options: "i"}},
                { firstname: {$regex: "^Sophie$", $options: "i"}},
                { firstname: {$regex: "^Marie$", $options: "i"}}
            ]
        
        }, {_id: 1, firstname: 1}).lean();

        const discussionsToInsert = [
            {
                uuid: crypto.randomUUID(),
                creator: users.find(user => user.firstname === "John")!._id,
                members: [users.find(user => user.firstname === "John")!._id, users.find(user => user.firstname === "Janny")!._id],
                name: "Discussion John et Janny",
                messages: [
                    {
                        uuid: crypto.randomUUID(),
                        content: "Salut Janny, comment vas-tu ?",
                        sender: users.find(user => user.firstname === "John")!._id,
                        date_created: new Date(),
                    },
                    {
                        uuid: crypto.randomUUID(),
                        content: "Très bien John, merci !",
                        sender: users.find(user => user.firstname === "John")!._id,
                        date_created: new Date(),
                    },
                ],
            },
            {
                uuid: crypto.randomUUID(),
                creator: users.find(user => user.firstname === "Jean")!._id,
                members: [users.find(user => user.firstname === "Jean")!._id, users.find(user => user.firstname === "Hélios")!._id],
                name: "Discussion Jean et Hélios",
                messages: [
                    {
                        uuid: crypto.randomUUID(),
                        content: "Hélios, tu as avancé sur le projet ?",
                        sender: users.find(user => user.firstname === "Jean")!._id,
                        date_created: new Date(),
                    },
                    {
                        uuid: crypto.randomUUID(),
                        content: "Oui Jean, je t'envoie ça ce soir.",
                        sender: users.find(user => user.firstname === "Hélios")!._id,
                        date_created: new Date(),
                    },
                ],
            },
            {
                uuid: crypto.randomUUID(),
                creator: users.find(user => user.firstname === "John")!._id,
                members: [users.find(user => user.firstname === "John")!._id, users.find(user => user.firstname === "Jean")!._id, users.find(user => user.firstname === "Sophie")!._id],
                name: "Équipe pédagogique",
                type: "group",
                messages: [
                    {
                        uuid: crypto.randomUUID(),
                        content: "Réunion demain à 10h.",
                        sender: users.find(user => user.firstname === "John")!._id,
                        date_created: new Date(),
                    },
                ],
            },
            {
                uuid: crypto.randomUUID(),
                creator: users.find(user => user.firstname === "Hélios")!._id,
                members: [users.find(user => user.firstname === "Hélios")!._id, users[5]!._id],
                name: "Projet étudiant",
                type: "group",
                messages: [
                    {
                        uuid: crypto.randomUUID(),
                        content: "On commence le projet aujourd'hui !",
                        sender: users.find(user => user.firstname === "Hélios")!._id,
                        date_created: new Date(),
                    },
                ],
            },
            {
                uuid: crypto.randomUUID(),
                creator: users.find(user => user.firstname === "Sophie")!._id,
                members: [users.find(user => user.firstname === "Sophie")!._id, users.find(user => user.firstname === "Marie")!._id],
                name: "Discussion Sophie et Marie",
                messages: [
                    {
                        uuid: crypto.randomUUID(),
                        content: "Marie, peux-tu m'envoyer le planning ?",
                        sender: users.find(user => user.firstname === "Sophie")!._id,
                        date_created: new Date(),
                    },
                ],
            },
        ]

        for (const discussion of discussionsToInsert) {

            if (!await this.model.findOne({name: discussion.name})){

                const newDiscussion = new Discussion(discussion);
                await newDiscussion.save();
    
                if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3") console.log(`💾 New discussion "${discussion.name}" created`);

            }else {

                if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3") console.log(`💾 Discussion "${discussion.name}" already exists`);
            }
        }

        if (process.env.VERBOSE === "true"){
                    
            console.log(`✅ ${await Discussion.model.countDocuments({})} discussions created`);
            console.groupEnd();
            console.log("");
        }
    }

    static async findManyByUser(user: UserType & { _id: number }) {

        return await this.model
            .find({
                members: user._id,
            })
            .populate({
                path: "members",
                model: "User",
                select: "firstname lastname picture socket_id uuid",
            })
            .populate({
                path: "messages.sender",
                model: "User",
                select: "firstname lastname picture socket_id uuid",
            })
    }

    static async findPopulateMembersByDiscussionId(uuid: string) {

        return await this.model
            .findOne({
                uuid: uuid,
            })
            .populate({
                path: "members",
                model: "User",
                select: "firstname lastname picture socket_id uuid is_online",
            })
            .populate({
                path: "messages.sender",
                model: "User",
                select: "firstname lastname picture socket_id uuid is_online",
            })
    }

}
