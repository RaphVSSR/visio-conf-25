import Controller from "./controleur.js"
import CanalSocketio from "../canalsocketio.js"
import SocketIO from "../models/services/SocketIO.ts"
import AuthService from "../models/services/authentication/AuthService.ts"

export function init() {

	if (process.env.VERBOSE === "true") console.group("⚙️ Processing Controller..")

	const controleur = new Controller()
	controleur.verboseall = process.env.VERBOSE === "true" && Number(process.env.VERBOSE_LVL) >= 3

	new CanalSocketio(SocketIO.server, controleur, "canalsocketio")

	new AuthService(controleur, "AuthService",
		["auth_success", "auth_failure", "login_success", "login_failure", "login_pending",
			"registration_success", "registration_failure", "user_disconnect_success",
			"session_refreshed", "session_expired",
			"session_pending", "session_pending_accepted", "session_pending_rejected"],
		["authenticate", "login", "register", "user_disconnect", "session_refresh",
			"session_pending_choice", "client_deconnexion"]
	)

	if (process.env.VERBOSE === "true") {
		console.log("✅ Controller initialized")
		console.groupEnd()
	}
}
