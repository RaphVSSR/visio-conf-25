import crypto from "crypto"
import { sha256 } from "js-sha256"
import User from "../../User.ts"
import Session from "./Session.ts"
import { ControllerBinder, type ControllerMessage } from "../../../Controller/Controller.abstracts.ts"


type PendingSessionRequest = {
	socketId: string
	userId: string
	user: any
	deviceInfo: string
	timeout: NodeJS.Timeout
}

export default class AuthService extends ControllerBinder {

	private pendingRequests = new Map<string, PendingSessionRequest>()

	traitementMessage(mesg: ControllerMessage) {

		const socketId = mesg.id
		const action = Object.keys(mesg).find(key => key !== "id")

		switch (action) {

			case "login":
				this.login(socketId, mesg[action] as { email: string, password: string, deviceInfo: string }); break

			case "authenticate":
				this.authenticate(socketId, mesg[action] as { sessionId: string }); break

			case "register":
				this.register(socketId, mesg[action] as { password: string, firstname: string, lastname: string, email: string, phone: string }); break

			case "user_disconnect":
				this.user_disconnect(socketId); break

			case "session_refresh":
				this.session_refresh(socketId); break

			case "session_pending_choice":
				this.resultManualSessionValidationByUser(socketId, mesg[action] as { requestId: string, accepted: boolean }); break

			case "client_deconnexion":
				this.client_deconnexion(mesg[action] as string); break
		}
	}

	private async login(socketId: string, payload: { email: string, password: string, deviceInfo: string }) {

		const { email, password, deviceInfo } = payload

		const user = await User.getUser(email)
		if (!user) return this.controleur.envoie(this, { login_failure: { reason: "user_not_found" }, id: [socketId] })

		if (!this.verifyPassword(password, user.password)) return this.controleur.envoie(this, { login_failure: { reason: "wrong_password" }, id: [socketId] })

		const userDetails = user.toObject()
		delete userDetails.password

		const existingSessions = await Session.getSessions(user._id!.toString())

		if (existingSessions.length > 0) {

			this.createManualSessionValidationByUser(socketId, userDetails, deviceInfo)

		} else {

			const { sessionId, expiresAt } = await this.createSession(socketId, user._id!.toString())
			this.controleur.envoie(this, { login_success: { user: userDetails, expiresAt, sessionId }, id: [socketId] })

		}
	}

	private async createManualSessionValidationByUser(socketId: string, user: any, deviceInfo: string) {

		const requestId = crypto.randomUUID()
		const userId = user._id!.toString()
		const timeoutSeconds = parseInt(process.env.SESSION_APPROVAL_TIMEOUT_SECONDS || "60")

		const timeout = setTimeout(() => {
			this.rejectManualSessionValidationByUser(requestId, "timeout")
		}, timeoutSeconds * 1000)

		this.pendingRequests.set(requestId, { socketId, userId, user, deviceInfo, timeout })

		this.controleur.envoie(this, { login_pending: { requestId }, id: [socketId] })

		const userSockets = await Session.getUserSocketIds(userId)
		if (userSockets.length > 0) {
			this.controleur.envoie(this, {
				session_pending: { requestId, requesterInfo: `${user.firstname} ${user.lastname}`, deviceInfo: AuthService.parseDeviceInfo(deviceInfo) },
				id: userSockets,
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

	private resendPendingRequests(userId: string, socketId: string) {
		for (const [requestId, pending] of this.pendingRequests) {
			if (pending.userId !== userId) continue
			this.controleur.envoie(this, {
				session_pending: {
					requestId,
					requesterInfo: `${pending.user.firstname} ${pending.user.lastname}`,
					deviceInfo: AuthService.parseDeviceInfo(pending.deviceInfo),
				},
				id: [socketId],
			})
		}
	}

	private async succeedManualSessionValidationByUser(requestId: string) {

		const pending = this.pendingRequests.get(requestId)
		if (!pending) return

		clearTimeout(pending.timeout)
		this.pendingRequests.delete(requestId)

		const { sessionId, expiresAt } = await this.createSession(pending.socketId, pending.userId)

		this.controleur.envoie(this, {
			login_success: { user: pending.user, expiresAt, sessionId },
			id: [pending.socketId],
		})

		const userSockets = await Session.getUserSocketIds(pending.userId)
		if (userSockets.length > 0) {
			this.controleur.envoie(this, { session_pending_accepted: { requestId }, id: userSockets })
		}
	}

	private async rejectManualSessionValidationByUser(requestId: string, reason: string) {

		const pending = this.pendingRequests.get(requestId)
		if (!pending) return

		clearTimeout(pending.timeout)
		this.pendingRequests.delete(requestId)

		this.controleur.envoie(this, { login_failure: { reason }, id: [pending.socketId] })

		const userSockets = await Session.getUserSocketIds(pending.userId)
		if (userSockets.length > 0) {
			this.controleur.envoie(this, { session_pending_rejected: { requestId }, id: userSockets })
		}
	}

	private async authenticate(socketId: string, payload: { sessionId: string }) {

		const { sessionId } = payload

		if (!sessionId) return this.controleur.envoie(this, { auth_failure: { reason: "session_id_required" }, id: [socketId] })

		const session = await Session.getSession(sessionId)
		if (!session) return this.controleur.envoie(this, { auth_failure: { reason: "session_no_longer_exists" }, id: [socketId] })

		if (new Date(session.expiresAt).getTime() <= Date.now()) return this.controleur.envoie(this, { auth_failure: { reason: "session_expired" }, id: [socketId] })

		const user = await User.model.findById(session.userId).select('-password').lean()
		if (!user) return this.controleur.envoie(this, { auth_failure: { reason: "user_not_found" }, id: [socketId] })

		const userSockets = await Session.getUserSocketIds(session.userId.toString())

		if (userSockets.length > 0) {

			this.createManualSessionValidationByUser(socketId, user, session.deviceInfo)

		} else {

			await Session.bindSocket(sessionId, socketId)
			this.controleur.envoie(this, {
				auth_success: { user, expiresAt: new Date(session.expiresAt).getTime() },
				id: [socketId],
			})
			this.resendPendingRequests(session.userId.toString(), socketId)
		}
	}

	private async register(socketId: string, payload: { password: string, firstname: string, lastname: string, email: string, phone: string }) {

		const { password, firstname, lastname, email, phone } = payload

		const existingUser = await User.getUser(email)
		if (existingUser) return this.controleur.envoie(this, { registration_failure: { reason: "email_already_exists" }, id: [socketId] })

		try {

			const newUser = new User({
				firstname, lastname, email, phone,
				password: this.hashPassword(password),
			})
			await newUser.save()

			const { sessionId, expiresAt } = await this.createSession(socketId, newUser.modelInstance._id!.toString())
			const userDetails = newUser.modelInstance.toObject()
			delete userDetails.password

			this.controleur.envoie(this, {
				registration_success: { user: userDetails, expiresAt, sessionId },
				id: [socketId],
			})

		} catch (err: any) {

			this.controleur.envoie(this, { registration_failure: { reason: err.message }, id: [socketId] })
		}
	}

	private async user_disconnect(socketId: string) {

		const session = await Session.getSessionBySocket(socketId)
		if (!session) return this.controleur.envoie(this, { auth_failure: { reason: "not_authenticated" }, id: [socketId] })

		await Session.deleteSession(session._id!.toString())
		this.controleur.envoie(this, { user_disconnect_success: {}, id: [socketId] })
	}

	private async session_refresh(socketId: string) {

		const session = await Session.getSessionBySocket(socketId)
		if (!session) return this.controleur.envoie(this, { session_expired: {}, id: [socketId] })

		const sessionId = session._id!.toString()
		const expiresAt = Date.now() + Session.getSessionDurationMs()
		await Session.refreshSession(sessionId, new Date(expiresAt))

		this.controleur.envoie(this, { session_refreshed: { expiresAt }, id: [socketId] })
	}

	private resultManualSessionValidationByUser(socketId: string, payload: { requestId: string, accepted: boolean }) {

		const { requestId, accepted } = payload

		if (accepted) {
			this.succeedManualSessionValidationByUser(requestId)
		} else {
			this.rejectManualSessionValidationByUser(requestId, "rejected")
		}
	}

	private async client_deconnexion(socketId: string) {

		await Session.clearSocket(socketId)
	}

	private async createSession(socketId: string, userId: string): Promise<{ sessionId: string, expiresAt: number }> {

		const expiresAt = Date.now() + Session.getSessionDurationMs()
		const session = await Session.createSession(userId, socketId, "web", new Date(expiresAt))

		return { sessionId: session._id!.toString(), expiresAt }
	}

	private hashPassword(password: string): string {
		return sha256(password)
	}

	private verifyPassword(password: string, hash: string): boolean {
		return sha256(password) === hash
	}
}
