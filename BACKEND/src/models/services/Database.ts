import mongoose, { connect, disconnect, type ConnectOptions } from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
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
import Session from "./authentication/Session.ts";
import { sha256 } from "js-sha256";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class Database {
  static async init() {
    if (process.env.VERBOSE === "true")
      console.group("⚙️ Processing Database..");

    await this.connect();

    await Auth.init();

		await this.connect();

		if (process.env.FLUSH_DB_ON_START === "true") await this.flushDb();

		await User.inject();

		await Permission.inject();
		await Role.inject();

		await this.injectAdminUser();

		await this.prepareProjectEnv();

		if (process.env.VERBOSE === "true") console.groupEnd();

	}

  private static async connect() {
    if (!process.env.MONGO_URI)
      throw new TracedError("dbConnect", "Connection URI is missing..");

    const mongoOptions: ConnectOptions = {
      user: process.env.MONGO_USER,
      pass: process.env.MONGO_PASSWORD,
    };

		const mongoOptions: ConnectOptions = { user: process.env.MONGO_USER, pass: process.env.MONGO_PASSWORD };

		try {

			await connect(process.env.MONGO_URI, process.env.MONGO_USER && process.env.MONGO_PASSWORD ? mongoOptions : undefined);

			if (process.env.VERBOSE === "true") console.log("✅ Connection succeed");

      if (process.env.VERBOSE === "true") console.log("✅ Connection succeed");
    } catch (err: any) {
      throw new TracedError("dbConnect", err.message);
    }
  }

		} catch (err: any) {

			throw new TracedError("dbConnect", err.message);
		}

      await Auth.flushAll();
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

      if (process.env.VERBOSE === "true")
        console.log("✅ DB flushed successfully");
    } catch (err: any) {
      throw new TracedError("dbFlushing", err.message);
    }
  }

		try {

			FileSystem.flushUploadLocalDir();

			await Session.flushAll();
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

  private static verifyUploadsEnvIntegrity() {
    try {
      if (!fs.existsSync(FileSystem.uploadsDir))
        fs.mkdirSync(FileSystem.uploadsDir, { recursive: true });
      if (!fs.existsSync(FileSystem.filesDir))
        fs.mkdirSync(FileSystem.filesDir, { recursive: true });

		} catch (err: any) {

			throw new TracedError("dbFlushing", err.message)
		}
	}

	/**
	 * Injecte un utilisateur admin par défaut au démarrage.
	 * Doit être appelé APRÈS Role.inject() pour pouvoir assigner le rôle admin.
	 */
	private static async injectAdminUser(){

		try {

			const existingAdmin = await User.getUser("dev@visioconf.com");
			if (existingAdmin) return;

			const adminRole = await Role.model.findOne({ uuid: "admin" });

			const admin = new User({
				firstname: "Dev",
				lastname: "Admin",
				email: "dev@visioconf.com",
				phone: "06 42 58 66 95",
				password: sha256("d3vV1s10C0nf"),
				desc: "Admin de la plateforme",
				status: "active",
				roles: adminRole ? [adminRole._id] : [],
			});

			await admin.save();

			if (process.env.VERBOSE === "true") console.log("✅ Admin user injected");

		} catch (err: any) {

			throw new TracedError("injectAdmin", err.message);
		}
	}

	private static async prepareProjectEnv(){

  //	if (!users) return console.error("Utilisateurs manquants");

		try {

		} catch (err: any) {

			throw new TracedError("injectingCollection", err.message);
		}

	}


	private static verifyUploadsEnvIntegrity(){

		try {

			if (!fs.existsSync(FileSystem.uploadsDir)) fs.mkdirSync(FileSystem.uploadsDir, { recursive: true });
			if (!fs.existsSync(FileSystem.filesDir)) fs.mkdirSync(FileSystem.filesDir, { recursive: true });

			if (process.env.VERBOSE === "true") console.log("✅ Upload environement integrity verified");

		} catch (err: any) {

			throw new TracedError("uploadsIntegrity", `Among the uploads files hierarchy, some are missing..\n${err.message}`);
		}
	}

	private static async disconnect(){

		try {

			await disconnect();

			if (process.env.VERBOSE === "true") console.log(`✅ MongoDb connection closed successfully\n`);

		} catch (err: any) {

			throw new TracedError("dbClose", err.message);
		}
	}
}
