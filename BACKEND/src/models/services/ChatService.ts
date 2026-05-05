import crypto from "crypto"
import { getMessagesByDomain } from "../ListeMessages.ts"
import SessionManager from "./authentication/SessionManager.ts"
import Discussion from "../Discussion.ts"
import User from "../User.ts"

type MessageHandler = (socketId: string, payload: any) => void

export default class ChatService {

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
		this.registerHandler("chat_operation", this.handleChatOperation)
		this.registerHandler("message_operation", this.handleMessageOperation)

		this.controleur.inscription(this, getMessagesByDomain("chat").received, [...this.handlers.keys()])
	}

	// --- Broadcast helper: resolve all socket IDs for a list of member ObjectIds ---

	private async getMemberSocketIds(memberIds: any[]): Promise<string[]> {
		const allSockets: string[] = []
		for (const memberId of memberIds) {
			allSockets.push(...SessionManager.getUserSocketIds(memberId.toString()))
		}
		return [...new Set(allSockets)]
	}

	// --- Chat CRUD operations ---

	private handleChatOperation = async (socketId: string, payload: { action: string, data: any }) => {

		const userId = SessionManager.getUserId(socketId)
		if (!userId) return this.send(socketId, "chat_operation_result", { action: payload.action, status: "error", message: "not_authenticated" })

		try {
			switch (payload.action) {

				case "CREATE": {
					if (!payload.data.creator) {
						return this.send(socketId, "chat_operation_result", { action: "CREATE", status: "error", message: "Missing creator" })
					}

					const newChat = new Discussion.model({
						uuid: crypto.randomUUID(),
						name: payload.data.name || "Nouveau groupe",
						creator: payload.data.creator,
						members: payload.data.members || [payload.data.creator],
						type: payload.data.type || "group",
						messages: [],
					})

					await newChat.save()

					const populatedChat = await Discussion.findPopulateMembersByDiscussionId(newChat.uuid)

					const targets = await this.getMemberSocketIds(newChat.members)
					this.send(targets.length > 0 ? targets : socketId, "chat_operation_result", { action: "CREATE", status: "success", data: populatedChat })
					break
				}

				case "READ": {
					const discussion = await Discussion.findPopulateMembersByDiscussionId(payload.data.uuid)
					this.send(socketId, "chat_operation_result", { action: "READ", status: "success", data: discussion })
					break
				}

				case "READ_ALL": {
					const user = await User.model.findById(payload.data.userId)
					if (!user) throw new Error("User not found")

					const discussions = await Discussion.findManyByUser(user as any)
					this.send(socketId, "chat_operation_result", { action: "READ_ALL", status: "success", data: discussions })
					break
				}

				case "DELETE": {
					await Discussion.model.deleteOne({ uuid: payload.data.uuid })
					this.send(socketId, "chat_operation_result", { action: "DELETE", status: "success", data: { uuid: payload.data.uuid } })
					break
				}
			}

		} catch (err: any) {
			console.error(`[${this.nomDInstance}] chat_operation [${payload.action}] error:`, err)
			this.send(socketId, "chat_operation_result", { action: payload.action, status: "error", message: err.message })
		}
	}

	// --- Message operations ---

	private handleMessageOperation = async (socketId: string, payload: { action: string, data: any }) => {

		const userId = SessionManager.getUserId(socketId)
		if (!userId) return this.send(socketId, "message_operation_result", { action: payload.action, status: "error", message: "not_authenticated" })

		try {
			switch (payload.action) {

				case "SEND": {
					const discussion = await Discussion.model.findOne({ uuid: payload.data.chatUuid })
					if (!discussion) throw new Error("Discussion not found")

					const newMessage = {
						uuid: crypto.randomUUID(),
						content: payload.data.content,
						sender: payload.data.sender,
						date_created: new Date(),
					}

					await Discussion.model.updateOne(
						{ _id: discussion._id },
						{ $push: { messages: newMessage } }
					)

					const targets = await this.getMemberSocketIds(discussion.members)
					this.send(
						targets.length > 0 ? targets : socketId,
						"message_operation_result",
						{ action: "SEND", status: "success", data: { chatUuid: discussion.uuid, message: newMessage } }
					)
					break
				}

				case "DELETE": {
					const discussion = await Discussion.model.findOne({ uuid: payload.data.chatUuid })
					if (!discussion) throw new Error("Discussion not found")

					await Discussion.model.updateOne(
						{ uuid: payload.data.chatUuid },
						{ $pull: { messages: { uuid: payload.data.messageUuid } } as any }
					)

					const targets = await this.getMemberSocketIds(discussion.members)
					this.send(
						targets.length > 0 ? targets : socketId,
						"message_operation_result",
						{ action: "DELETE", status: "success", data: { chatUuid: discussion.uuid, messageUuid: payload.data.messageUuid } }
					)
					break
				}
			}

		} catch (err: any) {
			console.error(`[${this.nomDInstance}] message_operation [${payload.action}] error:`, err)
			this.send(socketId, "message_operation_result", { action: payload.action, status: "error", message: err.message })
		}
	}
}
