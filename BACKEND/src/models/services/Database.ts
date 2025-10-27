
import { connect, disconnect, type ConnectOptions } from "mongoose"
import path from "path";
import { fileURLToPath } from "url"
import fs from "fs"
import User from "../User.ts";
import TracedError from "../Core/TracedError.ts";
import FileSystem, { Folder } from "./FileSystem.ts";
import TestEnvironement from "../Core/TestEnvironement.ts";
import Role from "../Role.ts";
import Permission from "../Permission.ts";
import Channel from "../Channel.ts";
import Discussion from "../Discussion.ts";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Database {


	static async init(){

		if (process.env.VERBOSE === "true") console.group("⚙️ Processing Database..");

		await this.connect();

		await this.prepareProjectEnv();

		//await this.disconnect();

		if (process.env.VERBOSE === "true") console.groupEnd();
		
	}

	private static async connect(){

		if (!process.env.MONGO_URI) throw new TracedError("dbConnect", "Connection URI is missing..");

		const mongoOptions: ConnectOptions = { user: process.env.MONGO_USER, pass: process.env.MONGO_PASSWORD };
		
		try {
			
			await connect(process.env.MONGO_URI, process.env.MONGO_USER && process.env.MONGO_PASSWORD ? mongoOptions : undefined);
			
			if (process.env.VERBOSE === "true") console.log("✅ Database connection succeed");
			

		} catch (err: any) {
			
			throw new TracedError("dbConnect", err.message);
		}

	}

	private static async prepareProjectEnv(){

		try {
			
			if (process.env.FLUSH_DB_ON_START === "true"){
				
				FileSystem.flushUploadLocalDir();
				await Folder.flushAll();
				await User.flushAll();
				await Role.flushAll();
				await Permission.flushAll();
				await Discussion.flushAll();
				await Channel.flushAll();
			}

			if (process.env.VERBOSE === "true") console.log("✅ DB flushed successfully");

		} catch (err: any) {
			
			throw new TracedError("dbFlushing", err.message)
		}

		this.verifyUploadsEnvIntegrity();

		try {
			
			await Permission.inject();
			await Role.inject();
			await User.injectAdmin();
			if (process.env.NODE_ENV === "dev") await TestEnvironement.injectTestUsers();
			await Discussion.injectTest();

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

	//private static async restoreUsersFiles(users){

	//	if (!users) return console.error("Utilisateurs manquants");




	//}

	private static async disconnect(){

		try {
				
			await disconnect();

			if (process.env.VERBOSE === "true") console.log(`✅ MongoDb connection closed successfully\n`);

		} catch (err: any) {
			
			throw new TracedError("dbClose", err.message);
		}
	}
}