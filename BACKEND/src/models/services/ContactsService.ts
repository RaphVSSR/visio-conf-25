import { getMessagesByDomain } from "../ListeMessages.ts"
import SessionManager from "./authentication/SessionManager.ts"
import User from "../User.ts"

type MessageHandler = (socketId: string, payload: any) => void

export default class ContactsService {

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
		this.registerHandler("contacts:list", this.handleList)
		this.controleur.inscription(this, getMessagesByDomain("contacts").received, [...this.handlers.keys()])
	}

	private handleList = async (socketId: string, payload?: { excludeEmail?: string }) => {

		const userId = SessionManager.getUserId(socketId)
		if (!userId) return this.send(socketId, "contacts:list:response", [])

		try {

			const filter = payload?.excludeEmail
				? { email: { $ne: payload.excludeEmail } }
				: {}

			const users = await User.model.find(
				filter,
				{ firstname: 1, lastname: 1, picture: 1, is_online: 1, _id: 1, email: 1, roles: 1, desc: 1, phone: 1 }
			).lean()

			const contacts = users.map(u => ({
				id: u._id.toString(),
				firstname: u.firstname,
				lastname: u.lastname,
				picture: u.picture,
				is_online: u.is_online,
				email: u.email,
				roles: u.roles,
				desc: u.desc,
				phone: u.phone,
			}))

			this.send(socketId, "contacts:list:response", contacts)

		} catch (err) {

			console.error("[contacts:list] error:", err)
			this.send(socketId, "contacts:list:response", [])
		}
	}
}
