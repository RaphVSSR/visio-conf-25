import { connect, disconnect, type ConnectOptions } from "mongoose";
import fs from "fs";
import User from "../User.ts";
import TracedError from "../Core/TracedError.ts";
import FileSystem, { Folder } from "./FileSystem.ts";
import Channel from "../Channel.ts";
import Discussion from "../Discussion.ts";
import Team from "../Team.ts";
import TeamMember from "../TeamMember.ts";
import ChannelMember from "../ChannelMember.ts";
import ChannelPost from "../ChannelPost.ts";
import ChannelPostResponse from "../ChannelPostResponse.ts";
import Permission from "../Permission.ts";
import Role from "../Role.ts";
import { sha256 } from "js-sha256";

export default class Database {

	static async connectToMongo() {
		if (!process.env.MONGO_URI) throw new TracedError("dbConnect", "Connection URI is missing..");

		const mongoOptions: ConnectOptions = { user: process.env.MONGO_USER, pass: process.env.MONGO_PASSWORD };

		try {
			await connect(
				process.env.MONGO_URI,
				process.env.MONGO_USER && process.env.MONGO_PASSWORD ? mongoOptions : undefined,
			);

			if (process.env.VERBOSE === "true") console.log("âœ… Connection succeed");

		} catch (error: any) {
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
			await User.flushAll();

			if (process.env.VERBOSE === "true") console.log("âœ… DB flushed successfully");
			
		} catch (error: any) {
			throw new TracedError("dbFlushing", error.message);
		}
	}

	static async injectDefaultAdmin() {
		try {
			const existingAdmin = await User.getUser("dev@visioconf.com");
			if (existingAdmin) return;

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

			if (process.env.VERBOSE === "true") console.log("âœ… Admin user injected");

		} catch (error: any) {
			throw new TracedError("injectAdmin", error.message);
		}
	}

	static ensureUploadDirectories() {

		try {
			if (!fs.existsSync(FileSystem.uploadsDir)) fs.mkdirSync(FileSystem.uploadsDir, { recursive: true });
			if (!fs.existsSync(FileSystem.filesDir)) fs.mkdirSync(FileSystem.filesDir, { recursive: true });

			if (process.env.VERBOSE === "true") console.log("âœ… Upload environement integrity verified");

		} catch (error: any) {
			throw new TracedError(
				"uploadsIntegrity",
				`Among the uploads files hierarchy, some are missing..\n${error.message}`,
			);
		}
	}

	static async disconnect() {

		try {
			await disconnect();

			if (process.env.VERBOSE === "true") console.log(`âœ… MongoDb connection closed successfully\n`);
			
		} catch (error: any) {
			throw new TracedError("dbClose", error.message);
		}
	}
}
