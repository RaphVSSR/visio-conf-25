import dotenv from "dotenv";
import { Server } from "socket.io";
import Database from "./models/services/Database.js";
import TracedError from "./models/core/TracedError.js";
import HTTPServer from "./models/core/HTTPServer.js";
import RestService from "./models/services/RestService.js";
import SessionManager from "./models/services/authentication/SessionManager.js";
import Controleur from "./controller/controleur.js";
import CanalSocketIO from "./controller/canalsocketio.js";
import User from "./models/User.js";
import Permission from "./models/Permission.js";
import Role from "./models/Role.js";
import AuthService from "./models/services/authentication/AuthService.js";
import ChannelService from "./models/services/ChannelService.js";
import TeamService from "./models/services/TeamService.js";
import UserService from "./models/services/UserService.js";
dotenv.config();
function registerServices(controleur) {
    new AuthService(controleur, "AuthService").register();
    new ChannelService(controleur, "ChannelService").register();
    new TeamService(controleur, "TeamService").register();
    new UserService(controleur, "UserService").register();
}
try {
    if (process.env.VERBOSE === "true")
        console.log(`Lancement de l'app : [${new Date().toISOString()}]\n`);
    await Database.connectToMongo();
    if (process.env.FLUSH_DB_ON_START === "true")
        await Database.flushAllCollections();
    await User.inject();
    await Permission.inject();
    await Role.inject();
    await Database.injectDefaultAdmin();
    Database.ensureUploadDirectories();
    const expressApp = await RestService.implement();
    HTTPServer.createFromExpress(expressApp);
    const socketServer = new Server(HTTPServer.server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        }
    });
    SessionManager.bindToServer(socketServer);
    socketServer.engine.use(RestService.sessionMiddleware);
    const controleur = new Controleur();
    new CanalSocketIO(socketServer, controleur, "canalsocketio");
    registerServices(controleur);
    HTTPServer.listen();
    if (process.env.VERBOSE === "true")
        console.log("✅ All services registered & server listening");
}
catch (error) {
    TracedError.errorHandler(error);
}
//# sourceMappingURL=index.js.map