import crypto from "crypto"
import { sha256 } from "js-sha256"
import User from "../../User.ts"
import SessionManager from "./SessionManager.ts"
import { getMessagesByDomain } from "../../ListeMessages.ts"

type MessageHandler = (socketId: string, payload: any) => void

type PendingSessionRequest = {
	socketId: string
	userId: string
	user: any
	deviceInfo: string
	timeout: NodeJS.Timeout
}

export default class AuthService {

	controleur: any
	nomDInstance: string
	private handlers = new Map<string, MessageHandler>()
	private pendingRequests = new Map<string, PendingSessionRequest>()

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
		const action = Object.keys(msg).find(k => k !== "id")
		if (!action) return
		const handler = this.handlers.get(action)
		if (handler) handler(msg.id, msg[action])
	}

	register() {
		this.registerHandler("login", this.login)
		this.registerHandler("authenticate", this.authenticate)
		this.registerHandler("register", this.handleRegister)
		this.registerHandler("session", this.handleSession)
		this.registerHandler("socket_disconnect", this.socketDisconnect)

		const outgoing = [...getMessagesByDomain("auth").received, ...getMessagesByDomain("socket").received]
		this.controleur.inscription(this, outgoing, [...this.handlers.keys()])
	}

	private login = async (socketId: string, payload: { email: string, password: string, deviceInfo: string }) => {

		const { email, password, deviceInfo } = payload

		const user = await User.getUser(email)
		if (!user) return this.send(socketId, "login_response", { status: "failure", reason: "user_not_found" })

		if (!AuthService.verifyPassword(password, user.password)) return this.send(socketId, "login_response", { status: "failure", reason: "wrong_password" })

		const userDetails = AuthService.sanitizeUser(user.toObject())
		const userId = user._id!.toString()

		if (SessionManager.hasActiveSessions(userId)) {
			this.createManualSessionValidation(socketId, userDetails, deviceInfo)
		} else {
			const expiresAt = AuthService.bindSession(socketId, userId)
			this.send(socketId, "login_response", { status: "success", user: userDetails, expiresAt })
		}
	}

	private authenticate = async (socketId: string) => {

		const userId = SessionManager.getUserId(socketId)
		if (!userId) return this.send(socketId, "authenticate_response", { status: "failure", reason: "session_expired" })

		const user = await User.model.findById(userId).select("-password").lean()
		if (!user) return this.send(socketId, "authenticate_response", { status: "failure", reason: "user_not_found" })

		const userSockets = SessionManager.getUserSocketIds(userId)

		if (userSockets.length > 0) {
			this.createManualSessionValidation(socketId, user, "re-auth")
		} else {
			const expiresAt = AuthService.bindSession(socketId, userId)
			this.send(socketId, "authenticate_response", { status: "success", user, expiresAt })
			this.resendPendingRequests(userId, socketId)
		}
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

	private handleSession = (socketId: string, payload: { type: string, [key: string]: any }) => {

		const dispatchers: Record<string, () => void> = {
			disconnect: () => this.userDisconnect(socketId),
			refresh: () => this.sessionRefresh(socketId),
			pending_choice: () => this.sessionPendingChoice(socketId, payload),
		}

		dispatchers[payload.type]?.()
	}

	private userDisconnect = async (socketId: string) => {

		const userId = SessionManager.getUserId(socketId)
		if (!userId) return this.send(socketId, "session_response", { status: "failure", reason: "not_authenticated" })

		SessionManager.unbind(socketId)
		this.send(socketId, "session_response", { status: "disconnected" })
	}

	private sessionRefresh = async (socketId: string) => {

		const userId = SessionManager.getUserId(socketId)
		if (!userId) return this.send(socketId, "session_response", { status: "expired" })

		SessionManager.refreshSession(socketId)
		const expiresAt = Date.now() + SessionManager.getSessionDurationMs()
		this.send(socketId, "session_response", { status: "refreshed", expiresAt })
	}

	private sessionPendingChoice = (_socketId: string, payload: { requestId: string, accepted: boolean }) => {

		const { requestId, accepted } = payload

		if (accepted) {
			this.succeedManualSessionValidation(requestId)
		} else {
			this.rejectManualSessionValidation(requestId, "rejected")
		}
	}

	private socketDisconnect = (socketId: string) => {

		SessionManager.unbind(socketId)
	}

	private createManualSessionValidation(socketId: string, user: any, deviceInfo: string) {

		const requestId = crypto.randomUUID()
		const userId = user._id!.toString()
		const timeoutSeconds = parseInt(process.env.SESSION_APPROVAL_TIMEOUT_SECONDS || "60")

		const timeout = setTimeout(() => {
			this.rejectManualSessionValidation(requestId, "timeout")
		}, timeoutSeconds * 1000)

		this.pendingRequests.set(requestId, { socketId, userId, user, deviceInfo, timeout })

		this.send(socketId, "login_response", { status: "pending", requestId })

		const userSockets = SessionManager.getUserSocketIds(userId)
		if (userSockets.length > 0) {
			this.send(userSockets, "session_response", {
				status: "pending_request",
				requestId,
				requesterInfo: `${user.firstname} ${user.lastname}`,
				deviceInfo: AuthService.parseDeviceInfo(deviceInfo),
			})
		}
	}

	private async succeedManualSessionValidation(requestId: string) {

		const pending = this.pendingRequests.get(requestId)
		if (!pending) return

		clearTimeout(pending.timeout)
		this.pendingRequests.delete(requestId)

		const expiresAt = AuthService.bindSession(pending.socketId, pending.userId)
		this.send(pending.socketId, "login_response", { status: "success", user: pending.user, expiresAt })

		const userSockets = SessionManager.getUserSocketIds(pending.userId)
		if (userSockets.length > 0) {
			this.send(userSockets, "session_response", { status: "pending_accepted", requestId })
		}
	}

	private async rejectManualSessionValidation(requestId: string, reason: string) {

		const pending = this.pendingRequests.get(requestId)
		if (!pending) return

		clearTimeout(pending.timeout)
		this.pendingRequests.delete(requestId)

		this.send(pending.socketId, "login_response", { status: "failure", reason })

		const userSockets = SessionManager.getUserSocketIds(pending.userId)
		if (userSockets.length > 0) {
			this.send(userSockets, "session_response", { status: "pending_rejected", requestId })
		}
	}

	private resendPendingRequests(userId: string, socketId: string) {
		for (const [requestId, pending] of this.pendingRequests) {
			if (pending.userId !== userId) continue
			this.send(socketId, "session_response", {
				status: "pending_request",
				requestId,
				requesterInfo: `${pending.user.firstname} ${pending.user.lastname}`,
				deviceInfo: AuthService.parseDeviceInfo(pending.deviceInfo),
			})
		}
	}

	private static parseDeviceInfo(ua: string): string {
		const browser =
			/Edg\//i.test(ua) ? "Edge" :
			/OPR|Opera/i.test(ua) ? "Opera" :
			/Chrome/i.test(ua) ? "Chrome" :
			/Firefox/i.test(ua) ? "Firefox" :
			/Safari/i.test(ua) ? "Safari" :
			"Inconnu"

		const os =
			/Windows/i.test(ua) ? "Windows" :
			/Mac OS/i.test(ua) ? "macOS" :
			/Android/i.test(ua) ? "Android" :
			/iPhone|iPad/i.test(ua) ? "iOS" :
			/Linux/i.test(ua) ? "Linux" :
			"Inconnu"

		return `${browser} sur ${os}`
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
