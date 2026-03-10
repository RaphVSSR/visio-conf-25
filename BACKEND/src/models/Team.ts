import mongoose, { model, Model, Schema, Types } from "mongoose"
import Collection from "./core/Collection.ts"
import TracedError from "./core/TracedError.ts";
import User, { type UserType } from "./User.ts";
import TeamMember, { type TeamMemberType } from "./TeamMember.ts";
import Channel from "./Channel.ts";
import ChannelMember from "./ChannelMember.ts";

const { models } = mongoose;


export type TeamType = {

    name: string,
    description?: string,
    picture?: string,
    createdBy: Types.ObjectId,
    createdAt?: Date,
    updatedAt?: Date,
    members?: Types.ObjectId[],

}

export default class Team extends Collection {

    protected static schema = new Schema<TeamType>({

        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: "",
        },
        picture: {
            type: String,
            default: null,
            description: "Filename of the team picture stored",
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
            ref: "Teammember",
        }],
    });
    
    static model: Model<TeamType> = models.Team || model<TeamType>("Team", this.schema);

    modelInstance;

    constructor(dataToConstruct: TeamType){

        super();

        this.modelInstance = new Team.model(dataToConstruct);

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
            
            console.group("💉 Injecting testing teams..");
        }

        try {
            
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

            const teamsToInject = [
                {
                    name: "Département MMI",
                    description:
                        "Équipe des enseignants et personnels du département MMI",
                    createdBy: users.find(user => user.firstname === "John")!._id,
                    members: [
                        { id: users.find(user => user.firstname === "John")!._id, role: "admin" },
                        { id: users.find(user => user.firstname === "Janny")!._id, role: "member" },
                        { id: users.find(user => user.firstname === "Jean")!._id, role: "member" },
                        { id: users.find(user => user.firstname === "Hélios")!._id, role: "member" },
                        { id: users.find(user => user.firstname === "Marie")!._id, role: "member" },
                    ],
                },
                {
                    name: "Projet Web Avancé",
                    description: "Équipe de développement pour le projet web avancé",
                    createdBy: users.find(user => user.firstname === "Jean")!._id,
                    members: [
                        { id: users.find(user => user.firstname === "Jean")!._id, role: "admin" },
                        { id: users.find(user => user.firstname === "Sophie")!._id, role: "member" },
                    ],
                },
                {
                    name: "Administration",
                    description: "Équipe administrative de l'université",
                    createdBy: users.find(user => user.firstname === "Marie")!._id,
                    members: [
                        { id: users.find(user => user.firstname === "Marie")!._id, role: "admin" },
                        { id: users.find(user => user.firstname === "John")!._id, role: "member" },
                        { id: users.find(user => user.firstname === "Hélios")!._id, role: "member" },
                    ],
                },
            ]

            for (const team of teamsToInject) {

                if (!await this.model.findOne({name: team.name})){
                    
                    const newTeam = new Team({
                        name: team.name,
                        description: team.description,
                        createdBy: team.createdBy,
                    });

                    newTeam.modelInstance.members = team.members.map(member => {

                        const newMember = new TeamMember({...member, teamId: newTeam.modelInstance._id});
                        newMember.save();

                        return newMember.modelInstance._id;
                    })

                    await newTeam.save();


                    if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3") console.log(`💾 New team "${team.name}" created`);

                }else {

                    if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL === "3") console.log(`💾 Team "${team.name}" already exists`);
                }
            }

            if (process.env.VERBOSE === "true"){
                                
                console.log(`✅ ${await Team.model.countDocuments({})} teams created`);
                console.groupEnd();
                console.log("");
            }

        } catch (err: any) {

            console.trace(err);
        }
    }

}
