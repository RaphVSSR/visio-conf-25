
import path from "path"
import { fileURLToPath } from "url"
import express, { type Express, Router, type Request, type Response, type NextFunction  } from "express"
import cors from "cors"
import FileRoutes from "../../routes/FileRoutes.ts"
import TracedError from "../core/TracedError.ts";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default class RestService {

	private static server: Express = express();

	static async implement(){

		if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL >= "2") console.group("⚙️ Implementing Express server..");
		
		this.server.use(express.json());
		this.corsDef();

		this.server.use(express.static(path.join(__dirname, "..", "..", "public")));

		await this.routesDef();

		if (process.env.VERBOSE === "true" && process.env.VERBOSE_LVL >= "2") {
			
			console.log("✅ Success");
			console.groupEnd();
		}

		return this.server;

	}

	private static corsDef(){

		try {

			this.server.use(
			
				cors({

					origin: (origin, callback) => {
				
						// Autoriser les requêtes sans origin (applications mobiles, Postman, etc.)
						if (!origin) return callback(null, true) // Liste des origines autorisées

						const allowedOrigins = [
							process.env.FRONTEND_URL ?? "http://localhost:3000",
							"http://127.0.0.1:3000",
						]
				
						// Permettre toute adresse IP locale sur le port 3000
						const ipPattern =
							/^http:\/\/((192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|127\.0\.0\.1)\d{1,3}\.\d{1,3}|localhost):3000$/
				
						if (allowedOrigins.includes(origin) || ipPattern.test(origin)) {
							callback(null, true)
						} else {
							console.log(`CORS: Origin ${origin} not allowed`)
							callback(new Error("Not allowed by CORS"))
						}
					},
					credentials: true,
					methods: ["GET", "POST"],
					allowedHeaders: ["Content-Type", "Authorization"],

				})
			);

			if (process.env.VERBOSE === "true") console.log(`✅ CORS fully defined`);
			
		} catch (err: any) {
			
			throw new TracedError("restCorsDef", err.message);
		}

	}

	private static async routesDef(){

		try {

			const AuthRoutes = (await import("../../routes/AuthRoutes.ts")).default;
						
			const coreRouter = Router();

			coreRouter.use("/auth", AuthRoutes);
			coreRouter.use("/files", FileRoutes);

			this.server.use(process.env.API_BASE_PREFIX?.startsWith("/") ? process.env.API_BASE_PREFIX : "/", coreRouter);

			if (process.env.VERBOSE === "true") console.log(`✅ Routes fully initialized\n`);

		} catch (err: any) {
			
			throw new TracedError("restRoutesDef", err.message);

		}

	}

	//fileUpload(){

		
	//}
}