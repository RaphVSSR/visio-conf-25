
import path from "path"
import { fileURLToPath } from "url"
import express, { type Express, Router, type Request, type Response, type NextFunction, type RequestHandler } from "express"
import session from "express-session"
import ConnectMongoDBSession from "connect-mongodb-session"
import cors from "cors"
import AuthRoutes from "../../routes/AuthRoutes.ts"
import PermissionRoutes from "../../routes/PermissionRoutes.ts"
import TracedError from "../core/TracedError.ts";
import SessionManager from "./authentication/SessionManager.ts";

const MongoDBStore = ConnectMongoDBSession(session)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default class RestService {

	private static server: Express = express();
	static sessionMiddleware: RequestHandler;

	static async implement(){

		if (process.env.VERBOSE === "true" && (process.env.VERBOSE_LVL ?? "0") >= "2") console.group("⚙️ Implementing Express server..");

		this.server.use(express.json());
		this.corsDef();
		this.sessionDef();

		this.server.use(express.static(path.join(__dirname, "..", "..", "public")));

		await this.routesDef();

		if (process.env.VERBOSE === "true" && (process.env.VERBOSE_LVL ?? "0") >= "2") {

			console.log("✅ Success");
			console.groupEnd();
		}

		return this.server;

	}

	private static sessionDef() {

		const store = new MongoDBStore({
			uri: process.env.MONGO_URI || "mongodb://localhost:27017/visioconf",
			collection: "sessions",
		})

		store.on("error", (error: Error) => {
			console.error("Session store error:", error)
		})

		this.sessionMiddleware = session({
			name: "visioconf_session",
			secret: process.env.SESSION_SECRET || "visioconf-session-secret",
			resave: false,
			saveUninitialized: true,
			store,
			cookie: {
				maxAge: SessionManager.getSessionDurationMs(),
				httpOnly: true,
				sameSite: "lax",
				secure: process.env.NODE_ENV === "prod",
			},
		})

		this.server.use(this.sessionMiddleware)

		if (process.env.VERBOSE === "true") console.log("✅ Session middleware configured (connect-mongodb-session)")
	}

	private static corsDef(){

		try {

			this.server.use(

				cors({

					origin: (origin, callback) => {
						const allowedOrigins = [
							process.env.FRONTEND_URL || "http://localhost:3000",
							"http://127.0.0.1:3000",
							"http://localhost:3001"
						]
						if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
							callback(null, true)
						} else {
							console.log(`CORS: Origin ${origin} not allowed`)
							callback(new Error("Not allowed by CORS"))
						}
					},
					credentials: true,
					methods: ["GET", "POST", "PUT", "DELETE"],
					allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Guard"],

				})
			);

			if (process.env.VERBOSE === "true") console.log(`✅ CORS fully defined`);

		} catch (error: any) {

			throw new TracedError("restCorsDef", error.message);
		}

	}

	private static async routesDef(){

		try {

			const coreRouter = Router();

			coreRouter.use("/auth", AuthRoutes);
			coreRouter.use("/permissions", PermissionRoutes);

			this.server.use(process.env.API_BASE_PREFIX?.startsWith("/") ? process.env.API_BASE_PREFIX : "/", coreRouter);

			if (process.env.VERBOSE === "true") console.log(`✅ Routes fully initialized\n`);

		} catch (error: any) {

			throw new TracedError("restRoutesDef", error.message);

		}

	}
}