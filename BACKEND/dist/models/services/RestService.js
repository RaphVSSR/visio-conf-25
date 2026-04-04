import path from "path";
import { fileURLToPath } from "url";
import express, { Router } from "express";
import session from "express-session";
import ConnectMongoDBSession from "connect-mongodb-session";
import cors from "cors";
import AuthRoutes from "../../routes/AuthRoutes.js";
import TracedError from "../core/TracedError.js";
import SessionManager from "./authentication/SessionManager.js";
const MongoDBStore = ConnectMongoDBSession(session);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default class RestService {
    static server = express();
    static sessionMiddleware;
    static async implement() {
        if (process.env.VERBOSE === "true" && (process.env.VERBOSE_LVL ?? "") >= "2")
            console.group("⚙️ Implementing Express server..");
        this.server.use(express.json());
        this.corsDef();
        this.sessionDef();
        this.server.use(express.static(path.join(__dirname, "..", "..", "public")));
        await this.routesDef();
        if (process.env.VERBOSE === "true" && (process.env.VERBOSE_LVL ?? "") >= "2") {
            console.log("✅ Success");
            console.groupEnd();
        }
        return this.server;
    }
    static sessionDef() {
        const store = new MongoDBStore({
            uri: process.env.MONGO_URI || "mongodb://localhost:27017/visioconf",
            collection: "sessions",
        });
        store.on("error", (error) => {
            console.error("Session store error:", error);
        });
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
        });
        this.server.use(this.sessionMiddleware);
        if (process.env.VERBOSE === "true")
            console.log("✅ Session middleware configured (connect-mongodb-session)");
    }
    static corsDef() {
        try {
            this.server.use(cors({
                origin: (origin, callback) => {
                    if (!origin)
                        return callback(null, true);
                    const allowedOrigins = [
                        process.env.FRONTEND_URL ?? "http://localhost:3000",
                        "http://127.0.0.1:3000",
                    ];
                    const ipPattern = /^http:\/\/((192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|127\.0\.0\.1)\d{1,3}\.\d{1,3}|localhost):3000$/;
                    if (allowedOrigins.includes(origin) || ipPattern.test(origin)) {
                        callback(null, true);
                    }
                    else {
                        console.log(`CORS: Origin ${origin} not allowed`);
                        callback(new Error("Not allowed by CORS"));
                    }
                },
                credentials: true,
                methods: ["GET", "POST"],
                allowedHeaders: ["Content-Type", "Authorization"],
            }));
            if (process.env.VERBOSE === "true")
                console.log(`✅ CORS fully defined`);
        }
        catch (error) {
            throw new TracedError("restCorsDef", error.message);
        }
    }
    static async routesDef() {
        try {
            const coreRouter = Router();
            coreRouter.use("/auth", AuthRoutes);
            this.server.use(process.env.API_BASE_PREFIX?.startsWith("/") ? process.env.API_BASE_PREFIX : "/", coreRouter);
            if (process.env.VERBOSE === "true")
                console.log(`✅ Routes fully initialized\n`);
        }
        catch (error) {
            throw new TracedError("restRoutesDef", error.message);
        }
    }
}
//# sourceMappingURL=RestService.js.map