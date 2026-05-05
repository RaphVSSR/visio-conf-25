import crypto from "crypto"
import mongoose from "mongoose"
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

	// Fix #6 — Deterministic routing: iterate over registered handler keys instead of Object.keys()
	traitementMessage(msg: any) {
		const socketId = msg.id
		for (const [name, handler] of this.handlers) {
			if (msg[name] !== undefined) {
				handler(socketId, msg[name])
				return
			}
		}
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

	// --- Helper: check if userId is a member of a discussion ---

	private isMember(discussion: any, userId: string): boolean {
		return discussion.members.some((m: any) => m.toString() === userId)
	}

	// --- Input validation helpers ---

	private static MAX_CONTENT_LENGTH = 2000
	private static MAX_NAME_LENGTH = 100
	private static ALLOWED_TYPES = ["group", "unique"]
	private static MAX_SEND_PER_MINUTE = 30

	private sendCounters = new Map<string, { count: number, resetAt: number }>()

	private canSend(userId: string): boolean {
		const now = Date.now()
		const entry = this.sendCounters.get(userId)
		if (!entry || entry.resetAt < now) {
			this.sendCounters.set(userId, { count: 1, resetAt: now + 60_000 })
			return true
		}
		if (entry.count >= ChatService.MAX_SEND_PER_MINUTE) return false
		entry.count++
		return true
	}

	// --- Chat CRUD operations ---

	private handleChatOperation = async (socketId: string, payload: { action: string, data: any }) => {

		const userId = SessionManager.getUserId(socketId)
		if (!userId) return this.send(socketId, "chat_operation_result", { action: payload.action, status: "error", message: "not_authenticated" })

		try {
			switch (payload.action) {

				case "CREATE": {
					// Validate name
					const name = typeof payload.data.name === "string" ? payload.data.name.trim() : ""
					if (name.length > ChatService.MAX_NAME_LENGTH) {
						return this.send(socketId, "chat_operation_result", { action: "CREATE", status: "error", message: "invalid_name" })
					}

					// Validate type
					const type = ChatService.ALLOWED_TYPES.includes(payload.data.type) ? payload.data.type : "group"

					// Validate members: each must exist as a real User
					const requestedMembers = Array.isArray(payload.data.members) ? payload.data.members : []
					const validIds = requestedMembers.filter((id: any) => mongoose.isValidObjectId(id))
					const existingUsers = await User.model.find({ _id: { $in: validIds } }).select("_id")
					const validatedMembers = existingUsers.map((u: any) => u._id.toString())
					const uniqueMembers = [...new Set([userId, ...validatedMembers])]

					if (type === "unique") {
						if (uniqueMembers.length !== 2) {
							return this.send(socketId, "chat_operation_result", { action: "CREATE", status: "error", message: "invalid_unique_members" })
						}
						const existing = await Discussion.model.findOne({ type: "unique", members: { $all: uniqueMembers, $size: 2 } })
						if (existing) {
							const populatedExisting = await Discussion.findPopulateMembersByDiscussionId(existing.uuid)
							return this.send(socketId, "chat_operation_result", { action: "CREATE", status: "success", data: populatedExisting })
						}
					}

					const newChat = new Discussion.model({
						uuid: crypto.randomUUID(),
						name: name || "Nouveau groupe",
						creator: userId,
						members: uniqueMembers,
						type,
						messages: [],
					})

					await newChat.save()

					const populatedChat = await Discussion.findPopulateMembersByDiscussionId(newChat.uuid)

					const targets = await this.getMemberSocketIds(newChat.members)
					this.send(targets.length > 0 ? targets : socketId, "chat_operation_result", { action: "CREATE", status: "success", data: populatedChat })
					break
				}

				// Fix #2 — READ: verify userId ∈ discussion.members
				case "READ": {
					const discussion = await Discussion.findPopulateMembersByDiscussionId(payload.data.uuid)
					if (!discussion) throw new Error("Discussion not found")

					if (!this.isMember(discussion, userId)) {
						return this.send(socketId, "chat_operation_result", { action: "READ", status: "error", message: "forbidden" })
					}

					this.send(socketId, "chat_operation_result", { action: "READ", status: "success", data: discussion })
					break
				}

				// Fix #1 — READ_ALL: use session userId, not client-provided userId
				case "READ_ALL": {
					const user = await User.model.findById(userId)
					if (!user) throw new Error("User not found")

					const discussions = await Discussion.findManyByUser(user as any)
					this.send(socketId, "chat_operation_result", { action: "READ_ALL", status: "success", data: discussions })
					break
				}

				case "DELETE": {
					const discussion = await Discussion.model.findOne({ uuid: payload.data.uuid })
					if (!discussion) throw new Error("Discussion not found")

					if (discussion.creator.toString() !== userId) {
						return this.send(socketId, "chat_operation_result", { action: "DELETE", status: "error", message: "forbidden" })
					}

					// Broadcast to all members before deleting
					const targets = await this.getMemberSocketIds(discussion.members)
					await Discussion.model.deleteOne({ uuid: payload.data.uuid })
					this.send(targets.length > 0 ? targets : socketId, "chat_operation_result", { action: "DELETE", status: "success", data: { uuid: payload.data.uuid } })
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
					// Rate limiting
					if (!this.canSend(userId)) {
						return this.send(socketId, "message_operation_result", { action: "SEND", status: "error", message: "rate_limit_exceeded" })
					}

					// Validate content
					if (typeof payload.data.content !== "string" || payload.data.content.trim().length === 0 || payload.data.content.length > ChatService.MAX_CONTENT_LENGTH) {
						return this.send(socketId, "message_operation_result", { action: "SEND", status: "error", message: "invalid_content" })
					}

					const discussion = await Discussion.model.findOne({ uuid: payload.data.chatUuid })
					if (!discussion) throw new Error("Discussion not found")

					if (!this.isMember(discussion, userId)) {
						return this.send(socketId, "message_operation_result", { action: "SEND", status: "error", message: "forbidden" })
					}

					const newMessage = {
						uuid: crypto.randomUUID(),
						content: payload.data.content,
						sender: userId,
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

					if (!this.isMember(discussion, userId)) {
						return this.send(socketId, "message_operation_result", { action: "DELETE", status: "error", message: "forbidden" })
					}

					// Only the message sender or the discussion creator can delete a message
					const targetMsg = (discussion as any).messages?.find((m: any) => m.uuid === payload.data.messageUuid)
					if (!targetMsg) throw new Error("Message not found")

					const isSender = targetMsg.sender.toString() === userId
					const isOwner = discussion.creator.toString() === userId
					if (!isSender && !isOwner) {
						return this.send(socketId, "message_operation_result", { action: "DELETE", status: "error", message: "forbidden" })
					}

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
