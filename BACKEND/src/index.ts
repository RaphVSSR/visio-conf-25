import dotenv from "dotenv"
import { Server } from "socket.io"
import Database from "./models/services/Database.ts"
import TracedError from "./models/core/TracedError.ts"
import HTTPServer from "./models/core/HTTPServer.ts"
import RestService from "./models/services/RestService.ts"
import SessionManager from "./models/services/authentication/SessionManager.ts"
import Controleur from "./controller/controleur.js"
import CanalSocketIO from "./controller/canalsocketio.js"
import User from "./models/User.ts"
import Permission from "./models/Permission.ts"
import Role from "./models/Role.ts"
import AuthService from "./models/services/authentication/AuthService.ts"
import ChannelService from "./models/services/ChannelService.ts"
import TeamService from "./models/services/TeamService.ts"
import UserService from "./models/services/UserService.ts"

dotenv.config()

function registerServices(controleur: any) {
	new AuthService(controleur, "AuthService").register()
	new ChannelService(controleur, "ChannelService").register()
	new TeamService(controleur, "TeamService").register()
	new UserService(controleur, "UserService").register()
}

try {

	if (process.env.VERBOSE === "true") console.log(`Lancement de l'app : [${new Date().toISOString()}]\n`)

	await Database.connectToMongo()

	if (process.env.FLUSH_DB_ON_START === "true") await Database.flushAllCollections()

	await User.inject()
	await Permission.inject()
	await Role.inject()
	await Database.injectDefaultAdmin()
	Database.ensureUploadDirectories()

	const expressApp = await RestService.implement()
	HTTPServer.createFromExpress(expressApp)

	const socketServer = new Server(HTTPServer.server, {
		cors: {
			origin: process.env.FRONTEND_URL || "http://localhost:3000",
			methods: ["GET", "POST"],
			credentials: true,
		}
	})
	SessionManager.bindToServer(socketServer)
	socketServer.engine.use(RestService.sessionMiddleware)

	const controleur = new Controleur()
	new CanalSocketIO(socketServer, controleur, "canalsocketio")

	registerServices(controleur)

	HTTPServer.listen()

	if (process.env.VERBOSE === "true") console.log("✅ All services registered & server listening")

} catch (error) {

	TracedError.errorHandler(error)
}
