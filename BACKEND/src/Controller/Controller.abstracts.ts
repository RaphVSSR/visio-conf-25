
import ControllerMessageBus from "./controleur.js"
import CanalSocketio from "../canalsocketio.js"
import SocketIO from "../models/services/SocketIO.ts"
import AuthService from "../models/services/authentication/AuthService.ts"


export type ControllerMessage = { id: string } & Record<string, unknown>

export type Controller = {
	verboseall: boolean,
	inscription: (binder: ControllerBinder, emitted: string[], received: string[]) => void,
	desincription: (binder: ControllerBinder, emitted: string[], received: string[]) => void,
	envoie: (binder: ControllerBinder, message: Record<string, unknown>) => void,
}

export abstract class ControllerBinder {

	readonly nomDInstance: string
	protected readonly controleur: Controller
	readonly messagesEmitted: string[]
	readonly messagesReceived: string[]

	abstract traitementMessage(mesg: ControllerMessage): void

	constructor(nomDInstance: string, controleur: Controller, messagesEmitted: string[], messagesReceived: string[]) {
		this.nomDInstance = nomDInstance
		this.controleur = controleur
		this.messagesEmitted = messagesEmitted
		this.messagesReceived = messagesReceived
		controleur.inscription(this, this.messagesEmitted, this.messagesReceived)
	}
}

export class ControllerManager {

	private static instance: Controller | null = null

	static createController() {

		if (this.instance) return

		if (process.env.VERBOSE === "true") console.group("⚙️ Processing Controller..")

		const controleur = new ControllerMessageBus()
		controleur.verboseall = process.env.VERBOSE === "true" && Number(process.env.VERBOSE_LVL) >= 3

		new CanalSocketio(SocketIO.server, controleur, "canalsocketio")

		this.instance = controleur

		if (process.env.VERBOSE === "true") console.log("✅ Controller created")
	}

	static registerServices() {

		new AuthService("AuthService", this.getController(),
			["auth_success", "auth_failure", "login_success", "login_failure", "login_pending",
				"registration_success", "registration_failure", "user_disconnect_success",
				"session_refreshed", "session_expired",
				"session_pending", "session_pending_accepted", "session_pending_rejected"],
			["authenticate", "login", "register", "user_disconnect", "session_refresh",
				"session_pending_choice", "client_deconnexion"]
		)

		if (process.env.VERBOSE === "true") {
			console.log("✅ Services registered")
			console.groupEnd()
		}
	}

	static getController(): Controller {

		if (!this.instance) throw new Error("Controller not created yet — call ControllerManager.createController() first")
		return this.instance
	}
}
