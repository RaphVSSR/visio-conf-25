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
import RoleService from "./models/services/RoleService.ts"
import ChannelService from "./models/services/ChannelService.ts"
import TeamService from "./models/services/TeamService.ts"
import UserService from "./models/services/UserService.ts"
import CallSignaling from "./models/services/CallSignaling.ts"
import ContactsService from "./models/services/ContactsService.ts"
import ChatService from "./models/services/ChatService.ts"
import FilesService from "./models/services/FilesService.ts"

dotenv.config()

function registerServices(controleur: any, io: any) {
	new AuthService(controleur, "AuthService").register()
	new RoleService(controleur, "RoleService").register()
	new ChannelService(controleur, "ChannelService").register()
	new TeamService(controleur, "TeamService").register()
	new UserService(controleur, "UserService").register()
	new CallSignaling(controleur, "CallSignaling").register()
	new ContactsService(controleur, "ContactsService").register()
	new ChatService(controleur, "ChatService").register()
	new FilesService(controleur, io, "FilesService").register()
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
			origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
				const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:3000"]

				// socket.io peut parfois se connecter sans header Origin (ex: certains clients / outils)
				if (!origin) return callback(null, true)

				// Autoriser l'origine configurée côté backend + les dev locaux (http/https)
				// Note: on compare host+port pour être tolérant entre http/https.
				const normalizeHostPort = (value: string) => {
					try {
						return new URL(value).host
					} catch {
						return value
					}
				}
				const isAllowedOrigin =
					allowedOrigins.includes(origin) ||
					allowedOrigins.map(normalizeHostPort).includes(normalizeHostPort(origin))
				const isLocalOrigin =
					/^http(s)?:\/\/localhost:\d+$/.test(origin) ||
					/^http(s)?:\/\/127\.0\.0\.1:\d+$/.test(origin)

				if (isAllowedOrigin || isLocalOrigin) return callback(null, true)

				console.log(`Socket.IO CORS: Origin ${origin} not allowed`)
				return callback(new Error("Not allowed by CORS"))
			},
			methods: ["GET", "POST"],
			credentials: true,
		}
	})
	SessionManager.bindToServer(socketServer)
	socketServer.engine.use(RestService.sessionMiddleware)

	const controleur = new Controleur()
	new CanalSocketIO(socketServer, controleur, "canalsocketio")

	registerServices(controleur, socketServer)

	HTTPServer.listen()

	if (process.env.VERBOSE === "true") console.log("✅ All services registered & server listening")

} catch (error) {

	TracedError.errorHandler(error)
}
