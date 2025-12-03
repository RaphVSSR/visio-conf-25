
import ewpress, { type Request, type Response, type NextFunction } from "express"
//import jwt from "jsonwebtoken"

import { betterAuth, type Auth as BetterAuthClient } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import Database from "./Database.ts";
import { Db, MongoClient } from "mongodb";
import User from "../User.ts";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";


export default class Auth {

	static mongoClient: MongoClient = new MongoClient(process.env.MONGO_URI!);
	static betterAuthClient: BetterAuthClient;
	private static accessController: ReturnType<typeof createAccessControl>;

	static async init(){

		await this.mongoClient.connect();

		this.defAccessController();

		this.betterAuthClient = betterAuth({
  
			database: mongodbAdapter(this.mongoClient.db("visioconf")),
			trustedOrigins: ["http://localhost:3000"],
			emailAndPassword: { 
				enabled: true, 
			}, 

			plugins: [

				admin({

					ac: this.accessController,
					defaultRole: "user",
  					adminRole: "admin",
					roles: this.defNewRoles()

				}),
			],

			user: {

				modelName: "users",
				fields: {
					name: "firstname",
				},
				additionalFields: User.betterAuthSchema,
			}

		});

	}

	private static defAccessController(){

		this.accessController = createAccessControl(this.defPerms());
	}

	private static defPerms(){

		return {

			...defaultStatements,
			teams: ["list", "create", "modify", "delete"],
			messages: ["send"],
			discussions: ["list", "create", "history", "details"],
			notifications: ["get", "update"],
			status: ["change"],
			profile: ["update", "avatar"],
			calls: ["recieve", "create", "hangUp", "listUsers"],

		}

	}

	private static defNewRoles(){

		const admin = this.accessController.newRole({

			...adminAc.statements,
			teams: ["list", "create", "modify", "delete"],
			messages: ["send"],
			discussions: ["list", "create", "history", "details"],
			notifications: ["get", "update"],
			status: ["change"],
			profile: ["update", "avatar"],
			calls: ["recieve", "create", "hangUp", "listUsers"],
		});

		return { admin };
	}

	static async injectAdminUser(){

		try {
			
			//@ts-ignore
			await this.betterAuthClient.api.createUser({
	
				body: {
	
					name: "Dev",
					email: "dev@visioconf.com",
					password: "d3vV1s10C0nf",
					role: "admin",
					data: {

						phone:"06 42 58 66 95",
						desc: "Admin de la plateforme"
		
					}
	
				}
			})

		} catch (err: any) {

			console.log(err);
			throw new Error("The admin creation failed", {cause: err});
		}

	}

	static async flushAll(){

		await User.flushAll();
		await this.mongoClient.db().collection("account").deleteMany({});
		await this.mongoClient.db().collection("session").deleteMany({});
	}
}


//export default async function autenticateToken(req: Request, res: Response, next: NextFunction){

//	const authHeader = req.headers["authorization"];
//	let token = authHeader && authHeader.split(" ")[1];

//	if (!token) {

//		if (req.headers.cookie){

//			const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
	
//				const [key, value] = cookie.trim().split("=");
//				acc[key] = value;
//				return acc;
	
//			}, {})

//			//token = cookies.token;

//		}else {

//			return res.status(401).json({ error: "Access token required" })

//		}
		
//	}

//	try {
		
//		const decoded = jwt.verify(token, process.env.JWT_SECRET);

//		const user = await User.findById(decoded.userId);

//		if (user) {
			
//			req.user = user;
//			next();

//		}else {
			
//			return res.status(401).json({ error: "User not found" });

//		};

//	} catch (error) {
		
//		return res.status(403).json({ error: "Invalid token" });

//	}

//}