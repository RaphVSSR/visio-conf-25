import mongoose, { type Model, type HydratedDocument, model, Schema, Types } from "mongoose"
import { type FileType, type FolderType } from "./services/FileSystem.ts";
import TracedError from "./core/TracedError.ts";
import { sha256 } from "js-sha256"

const { models } = mongoose;

export type UserType = {

    _id?: Types.ObjectId,
    socket_id?: string,
    firstname: string,
    lastname: string,
    email: string,
    phone: string,
    status?: "waiting" | "active",
    password: string,
    job?: string,
    desc: string,
    date_created?: Date,
    picture?: string,
    is_online?: boolean,
    disturb_status?: string,
    last_connection?: Date,
    direct_manager?: string,
    roles?: Types.ObjectId,

}

export default class User {
  protected static schema = new Schema<UserType>({
    socket_id: { type: String, default: "none" },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      required: true,
      default: "waiting",
      enum: ["waiting", "active", "banned", "deleted"],
      description:
        "Choose user status between : waiting, active, banned, deleted",
    },
    password: { type: String, required: true, description: "SHA256" },
    job: {
      type: String,
      //required: true,
      description: "Job description",
    },
    desc: {
      type: String,
      required: true,
      description: "User description",
    },
    date_created: { type: Date, required: true, default: Date.now },
    picture: {
      type: String,
      required: true,
      default: "default_profile_picture.png",
    },
    is_online: { type: Boolean, required: true, default: false },
    disturb_status: {
      type: String,
      required: true,
      default: "available",
      enum: ["available", "offline", "dnd"],
      description: "Choose user status between : available, offline, dnd",
    },
    last_connection: { type: Date, required: true, default: Date.now },
    direct_manager: {
      type: String,
      required: true,
      default: "none",
      description: "User uuid of the direct manager",
    },
    //tokens: { type: Object, default: {} },
    roles: [
      {
        type: Schema.Types.ObjectId,
        ref: "Role",
        default: "user",
        description: `List of roles id created by admin in the roles collection`,
      },
    ],
  });

  static betterAuthSchema = {
    socket_id: {
      type: "string" as const,
      required: false,
      defaultValue: "none",
    },
    lastname: { type: "string" as const, required: false, input: true },
    phone: { type: "string" as const, required: true, input: true },
    status: {
      type: "string" as const,
      required: true,
      defaultValue: "waiting",
    },
    job: {
      type: "string" as const,
      required: false,
      input: true,
    },
    desc: {
      type: "string" as const,
      required: true,
      input: true,
    },
    picture: {
      type: "string" as const,
      required: false,
      defaultValue: "default_profile_picture.png",
    },
    is_online: {
      type: "boolean" as const,
      required: true,
      defaultValue: false,
    },
    disturb_status: {
      type: "string" as const,
      required: true,
      defaultValue: "available",
    },
    last_connection: {
      type: "date" as const,
      required: true,
      defaultValue: Date.now,
    },
    direct_manager: {
      type: "string" as const,
      required: true,
      defaultValue: "none",
    },
  };

        socket_id: { type: String, default: "none" },
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        status: {
            type: String,
            required: true,
            default: "waiting",
            enum: ["waiting", "active"],
            description:
                "Choose user status between : waiting, active",
        },
        password: { type: String, required: true, description: "SHA256" },
        job: {
            type: String,
            description: "Job description",
        },
        desc: {
            type: String,
            default: "",
            description: "User description",
        },
        date_created: { type: Date, required: true, default: Date.now },
        picture: {
            type: String,
            required: true,
            default: "default_profile_picture.png",
        },
        is_online: { type: Boolean, required: true, default: false },
        disturb_status: {
            type: String,
            required: true,
            default: "available",
            enum: ["available", "offline", "dnd"],
            description: "Choose user status between : available, offline, dnd",
        },
        last_connection: { type: Date, required: true, default: Date.now },
        direct_manager: {
            type: String,
            required: true,
            default: "none",
            description: "User uuid of the direct manager",
        },
        //tokens: { type: Object, default: {} },
        roles: [
            {
                type: Schema.Types.ObjectId,
                ref: "Role",
                default: "user",
                description: `List of roles id created by admin in the roles collection`,
            },
        ],
    });

    static model: Model<UserType> = models.User || model<UserType>("User", this.schema);

    modelInstance;

    //testRootFolders;

    constructor(dataToConstruct: UserType){

        this.modelInstance = new User.model(dataToConstruct);

        //this.testRootFolders = this.defTestRootFolders(dataToConstruct);
        //this.defTestSubFolders(dataToConstruct);

    }

    static async inject(){

        [{
            firstname: "test1",
            lastname: "testlast1",
            email: "test1@visioconf.com",
            phone: "06 52 14 55 45",
            password: sha256("12345678"),
            desc: "Une description vreumannnnn",
        },
        {
            firstname: "test2",
            lastname: "testlast2",
            email: "test2@visioconf.com",
            phone: "06 52 14 55 45",
            password: sha256("12345678"),
            desc: "Une description vreumannnnn",
        },
        {
            firstname: "test3",
            lastname: "testlast3",
            email: "test3@visioconf.com",
            phone: "06 52 14 55 45",
            password: sha256("12345678"),
            desc: "Une description vreumannnnn",
        },
        {
            firstname: "test4",
            lastname: "testlast4",
            email: "test4@visioconf.com",
            phone: "06 52 14 55 45",
            password: sha256("12345678"),
            desc: "Une description vreumannnnn",
        },
        {
            firstname: "test5",
            lastname: "testlast5",
            email: "test5@visioconf.com",
            phone: "06 52 14 55 45",
            password: sha256("12345678"),
            desc: "Une description vreumannnnn",
        }].map(user => {

            const newUser = new User(user);
            newUser.save();
        })
    }

    async save(){

        try {
            
            await this.modelInstance.save();
            //if (process.env.VERBOSE) console.log("💾 User collection created and saved");

        } catch (err: any) {
            
            throw new TracedError("collectionSaving", err.message);
        }
    }

    static async getUser(email: string) {

        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return;

        return this.model.findOne({email: email});
    }

    static async getUsers(emails: string[]) {
        
        emails.forEach((email, index) => {
            
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) emails.splice(index, 1);

        });

        return this.model.find({ email: {$in: emails}});
    }

    static async updateUser(email: string, newData: Partial<UserType>) {
        
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return;

        return this.model.updateOne({email: email}, { $set: newData});
    }

    static async updateUsers(emails: string[], newData: Partial<UserType>) {
        
        emails.forEach((email, index) => {
            
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) emails.splice(index, 1);

        });

        return this.model.updateMany({ email: {$in: emails}}, {$set: newData});
    }

    static async deleteUser(email: string) {
        
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return;

        return this.model.deleteOne({email: email});
    }

    static async deleteUsers(emails: string[]) {
        
        emails.forEach((email, index) => {
            
            if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) emails.splice(index, 1);

        });

        return this.model.deleteMany({ email: {$in: emails}});
    }

    static async flushAll() {

        return this.model.deleteMany({});
    }

}
