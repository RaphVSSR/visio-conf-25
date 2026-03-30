import { sha256 } from "js-sha256"
import User from "../../User.ts"
import SessionManager from "./SessionManager.ts"
import { getMessagesByDomain } from "../../ListeMessages.ts"

type MessageHandler = (socketId: string, payload: any) => void

export default class AuthService {

	controleur: any
	nomDInstance: string
	private handlers = new Map<string, MessageHandler>()

	constructor(controleur: any, name: string) {
		this.controleur = controleur
		this.nomDInstance = name
	}

	private registerHandler(messageName: string, handler: MessageHandler) {
		this.handlers.set(messageName, handler)
	}

	private send(socketIds: string | string[], messageName: string, payload: unknown) {
		const ids = Array.isArray(socketIds) ? socketIds : [socketIds]
		this.controleur.envoie(this, { [messageName]: payload, id: ids })
	}

	traitementMessage(msg: any) {
		const action = Object.keys(msg).find(prop => prop !== "id")
		if (!action) return
		const handler = this.handlers.get(action)
		if (handler) handler(msg.id, msg[action])
	}

	register() {
		this.registerHandler("login", this.login)
		this.registerHandler("authenticate", this.authenticate)
		this.registerHandler("register", this.handleRegister)
		this.registerHandler("socket_disconnect", this.socketDisconnect)

		const outgoing = [...getMessagesByDomain("auth").received, ...getMessagesByDomain("socket").received]
		this.controleur.inscription(this, outgoing, [...this.handlers.keys()])
	}

	private login = async (socketId: string, payload: { email: string, password: string }) => {

		const { email, password } = payload

		const user = await User.getUser(email)
		if (!user) return this.send(socketId, "login_response", { status: "failure", reason: "user_not_found" })

		if (!AuthService.verifyPassword(password, user.password)) return this.send(socketId, "login_response", { status: "failure", reason: "wrong_password" })

		const userDetails = AuthService.sanitizeUser(user.toObject())
		const userId = user._id!.toString()

		const expiresAt = AuthService.bindSession(socketId, userId)
		this.send(socketId, "login_response", { status: "success", user: userDetails, expiresAt })
	}

	private authenticate = async (socketId: string) => {

		const userId = SessionManager.getUserId(socketId)
		if (!userId) return this.send(socketId, "authenticate_response", { status: "failure", reason: "session_expired" })

		const user = await User.model.findById(userId).select("-password").lean()
		if (!user) return this.send(socketId, "authenticate_response", { status: "failure", reason: "user_not_found" })

		const expiresAt = AuthService.bindSession(socketId, userId)
		this.send(socketId, "authenticate_response", { status: "success", user, expiresAt })
	}

	private handleRegister = async (socketId: string, payload: { password: string, firstname: string, lastname: string, email: string, phone: string }) => {

		const { password, firstname, lastname, email, phone } = payload

		const existingUser = await User.getUser(email)
		if (existingUser) return this.send(socketId, "register_response", { status: "failure", reason: "email_already_exists" })

		try {
			const newUser = new User({
				firstname, lastname, email, phone,
				password: AuthService.hashPassword(password),
				roles: ["user"],
			})
			await newUser.save()

			const userId = newUser.modelInstance._id!.toString()
			const expiresAt = AuthService.bindSession(socketId, userId)
			const userDetails = AuthService.sanitizeUser(newUser.modelInstance.toObject())

			this.send(socketId, "register_response", { status: "success", user: userDetails, expiresAt })
		} catch (error: any) {
			this.send(socketId, "register_response", { status: "failure", reason: error.message })
		}
	}

	private socketDisconnect = (socketId: string) => {

		SessionManager.unbind(socketId)
	}

	private static bindSession(socketId: string, userId: string): number {
		const expiresAt = Date.now() + SessionManager.getSessionDurationMs()
		SessionManager.bind(socketId, userId)
		return expiresAt
	}

	private static sanitizeUser(user: Record<string, any>) {
		const { password, ...sanitized } = user
		return sanitized
	}

	private static hashPassword(password: string): string {
		return sha256(password)
	}

	private static verifyPassword(password: string, hash: string): boolean {
		return sha256(password) === hash
	}
}
