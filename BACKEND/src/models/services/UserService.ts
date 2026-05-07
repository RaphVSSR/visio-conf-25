import { getMessagesByDomain } from "../ListeMessages.ts"
import SessionManager from "./authentication/SessionManager.ts"
import AccessRoleGuard from "./AccessRoleGuard.ts"
import User from "../User.ts"

type MessageHandler = (socketId: string, payload: any) => void

export default class UserService {

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
		this.registerHandler("user_get", this.handleUserQuery)
		this.registerHandler("user_update", this.handleUserUpdate)

		this.controleur.inscription(this, getMessagesByDomain("user").received, [...this.handlers.keys()])
	}

	private resolveUserId(socketId: string): string | null {
		return SessionManager.getUserId(socketId)
	}

	private handleUserQuery = (socketId: string, payload: any) => {

		const dispatchers: Record<string, () => void> = {
			list: () => this.getUsersList(socketId),
			info: () => this.getUserInfo(socketId, payload),
			search: () => this.searchUsers(socketId, payload),
		}

		dispatchers[payload.type]?.()
	}

	private handleUserUpdate = (socketId: string, payload: any) => {

		const dispatchers: Record<string, () => void> = {
			profile: () => this.updateUser(socketId, payload),
			status: () => this.updateUserStatus(socketId, payload),
			roles: () => this.updateUserRoles(socketId, payload),
		}

		dispatchers[payload.type]?.()
	}

	private getUsersList = async (socketId: string) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "user_get_response", { type: "list", etat: false, error: "not_authenticated" })

		// On récupère tous les utilisateurs (actifs ou en attente) pour l'annuaire en dev
		const users = await User.model.find({})
			.select("firstname lastname email picture is_online job roles desc phone status")
			.lean()

		const formattedUsers = users.map(user => ({
			id: user._id!.toString(),
			firstname: user.firstname,
			lastname: user.lastname,
			email: user.email,
			picture: user.picture,
			is_online: user.is_online, // Unifié en snake_case pour le frontend
			job: user.job,
			roles: user.roles,
			desc: user.desc,
			phone: user.phone,
			status: user.status
		}))

		this.send(socketId, "user_get_response", { type: "list", etat: true, users: formattedUsers })
	}

	private getUserInfo = async (socketId: string, payload: { userId: string }) => {

		const requesterId = this.resolveUserId(socketId)
		if (!requesterId) return this.send(socketId, "user_get_response", { type: "info", etat: false, error: "not_authenticated" })

		const { userId } = payload

		const user = await User.model.findById(userId)
			.select("firstname lastname email picture is_online job desc phone date_created")
			.lean()

		if (!user) return this.send(socketId, "user_get_response", { type: "info", etat: false, error: "user_not_found" })

		const formattedUser = {
			id: user._id!.toString(),
			firstname: user.firstname,
			lastname: user.lastname,
			email: user.email,
			picture: user.picture,
			is_online: user.is_online,
			job: user.job,
			desc: user.desc,
			phone: user.phone,
			dateCreated: user.date_created,
		}

		this.send(socketId, "user_get_response", { type: "info", etat: true, user: formattedUser })
	}

	private searchUsers = async (socketId: string, payload: { query: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "user_get_response", { type: "search", etat: false, error: "not_authenticated" })

		const { query } = payload
		const regex = new RegExp(query, "i")

		const users = await User.model.find({
			status: "active",
			$or: [
				{ firstname: regex },
				{ lastname: regex },
				{ email: regex },
			],
		})
			.select("firstname lastname email picture is_online")
			.limit(20)
			.lean()

		const formattedUsers = users.map(user => ({
			id: user._id!.toString(),
			firstname: user.firstname,
			lastname: user.lastname,
			email: user.email,
			picture: user.picture,
			is_online: user.is_online,
		}))

		this.send(socketId, "user_get_response", { type: "search", etat: true, users: formattedUsers })
	}

	private updateUser = async (socketId: string, payload: Record<string, any>) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "user_update_response", { type: "profile", etat: false, error: "not_authenticated" })

		const allowedFields = ["firstname", "lastname", "phone", "job", "desc", "picture"]
		const updateData: Record<string, any> = {}

		for (const field of allowedFields) {
			if (payload[field] !== undefined) updateData[field] = payload[field]
		}

		await User.model.updateOne({ _id: userId }, { $set: updateData })

		this.send(socketId, "user_update_response", { type: "profile", etat: true })
	}

	private updateUserStatus = async (socketId: string, payload: { userId: string, status: string }) => {

		const guard = await AccessRoleGuard.requireRole(socketId, "admin")
		if (!guard.authorized) return this.send(socketId, "user_update_response", { type: "status", etat: false, error: guard.reason })

		const { userId, status } = payload

		await User.model.updateOne({ _id: userId }, { $set: { status } })

		this.send(socketId, "user_update_response", { type: "status", etat: true, userId, status })
	}

	private updateUserRoles = async (socketId: string, payload: { userId: string, roles: string[] }) => {

		const guard = await AccessRoleGuard.requireRole(socketId, "admin")
		if (!guard.authorized) return this.send(socketId, "user_update_response", { type: "roles", etat: false, error: guard.reason })

		const { userId, roles } = payload

		await User.model.updateOne({ _id: userId }, { $set: { roles } })

		this.send(socketId, "user_update_response", { type: "roles", etat: true, userId, roles })
	}
}
