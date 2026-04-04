import { connect, disconnect } from "mongoose";
import fs from "fs";
import User from "../User.js";
import TracedError from "../core/TracedError.js";
import FileSystem, { Folder } from "./FileSystem.js";
import Channel from "../Channel.js";
import Discussion from "../Discussion.js";
import Team from "../Team.js";
import TeamMember from "../TeamMember.js";
import ChannelMember from "../ChannelMember.js";
import ChannelPost from "../ChannelPost.js";
import ChannelPostResponse from "../ChannelPostResponse.js";
import Permission from "../Permission.js";
import Role from "../Role.js";
import { sha256 } from "js-sha256";
export default class Database {
    static async connectToMongo() {
        if (!process.env.MONGO_URI)
            throw new TracedError("dbConnect", "Connection URI is missing..");
        const mongoOptions = { user: process.env.MONGO_USER, pass: process.env.MONGO_PASSWORD };
        try {
            await connect(process.env.MONGO_URI, process.env.MONGO_USER && process.env.MONGO_PASSWORD ? mongoOptions : undefined);
            if (process.env.VERBOSE === "true")
                console.log("✅ Connection succeed");
        }
        catch (error) {
            throw new TracedError("dbConnect", error.message);
        }
    }
    static async flushAllCollections() {
        try {
            FileSystem.flushUploadLocalDir();
            await Folder.flushAll();
            await Role.flushAll();
            await Permission.flushAll();
            await Discussion.flushAll();
            await TeamMember.flushAll();
            await Team.flushAll();
            await ChannelPost.flushAll();
            await ChannelPostResponse.flushAll();
            await ChannelMember.flushAll();
            await Channel.flushAll();
            await User.model.deleteMany({});
            if (process.env.VERBOSE === "true")
                console.log("✅ DB flushed successfully");
        }
        catch (error) {
            throw new TracedError("dbFlushing", error.message);
        }
    }
    static async injectDefaultAdmin() {
        try {
            const existingAdmin = await User.getUser("dev@visioconf.com");
            if (existingAdmin)
                return;
            const admin = new User({
                firstname: "Dev",
                lastname: "Admin",
                email: "dev@visioconf.com",
                phone: "06 42 58 66 95",
                password: sha256("d3vV1s10C0nf"),
                desc: "Admin de la plateforme",
                status: "active",
                roles: ["admin", "user"],
            });
            await admin.save();
            if (process.env.VERBOSE === "true")
                console.log("✅ Admin user injected");
        }
        catch (error) {
            throw new TracedError("injectAdmin", error.message);
        }
    }
    static ensureUploadDirectories() {
        try {
            if (!fs.existsSync(FileSystem.uploadsDir))
                fs.mkdirSync(FileSystem.uploadsDir, { recursive: true });
            if (!fs.existsSync(FileSystem.filesDir))
                fs.mkdirSync(FileSystem.filesDir, { recursive: true });
            if (process.env.VERBOSE === "true")
                console.log("✅ Upload environement integrity verified");
        }
        catch (error) {
            throw new TracedError("uploadsIntegrity", `Among the uploads files hierarchy, some are missing..\n${error.message}`);
        }
    }
    static async disconnect() {
        try {
            await disconnect();
            if (process.env.VERBOSE === "true")
                console.log(`✅ MongoDb connection closed successfully\n`);
        }
        catch (error) {
            throw new TracedError("dbClose", error.message);
        }
    }
}
//# sourceMappingURL=Database.js.map