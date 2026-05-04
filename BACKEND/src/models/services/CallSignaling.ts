import { getMessagesByDomain } from "../ListeMessages.ts"
import SessionManager from "./authentication/SessionManager.ts"
import ActiveCallStore from "../ActiveCall.ts"

type MessageHandler = (socketId: string, payload: any) => void

export default class CallSignaling {

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
		if (Array.isArray(msg.id)) return
		if (typeof msg.socket_disconnect === "string") {
			this.handleDisconnect(msg.socket_disconnect)
			return
		}
		const action = Object.keys(msg).find(prop => prop !== "id")
		if (!action) return
		const handler = this.handlers.get(action)
		if (handler) handler(msg.id, msg[action])
	}

	register() {
		this.registerHandler("call:initiate", this.handleInitiate)
		this.registerHandler("call:accept", this.handleAccept)
		this.registerHandler("call:reject", this.handleReject)
		this.registerHandler("call:offer", this.handleOffer)
		this.registerHandler("call:answer", this.handleAnswer)
		this.registerHandler("call:ice-candidate", this.handleIceCandidate)
		this.registerHandler("call:hangup", this.handleHangup)
		this.registerHandler("call:mute-toggle", this.handleMuteToggle)
		this.registerHandler("socket_disconnect", this.handleDisconnect)

		this.controleur.inscription(this, getMessagesByDomain("call").received, [...this.handlers.keys()])
	}

	private firstSocketForUser(userId: string): string | null {
		const ids = SessionManager.getUserSocketIds(userId)
		return ids[0] ?? null
	}

	private participantSocketIds(callId: string, exceptSocketId?: string): string[] {
		const call = ActiveCallStore.getCall(callId)
		if (!call) return []
		const ids: string[] = []
		for (const p of call.participants.values()) {
			if (p.socketId !== exceptSocketId) ids.push(p.socketId)
		}
		return ids
	}

	private handleInitiate = (socketId: string, payload: {
		callId: string,
		callType?: "audio" | "video",
		targetUserIds: string[],
		callerName: string,
		callerPicture: string,
		isGroupCall: boolean,
	}) => {
		const callerId = SessionManager.getUserId(socketId)
		if (!callerId) return

		if (ActiveCallStore.isUserInCall(callerId)) {
			this.send(socketId, "call:error", { message: "Vous êtes déjà en communication" })
			return
		}

		const callType = payload.callType || "audio"
		const call = ActiveCallStore.createCall(
			payload.callId, callerId, payload.targetUserIds, payload.isGroupCall, callType
		)

		ActiveCallStore.addParticipant(payload.callId, {
			userId: callerId,
			socketId,
			firstname: payload.callerName.split(" ")[0]!,
			lastname: payload.callerName.split(" ").slice(1).join(" "),
			picture: payload.callerPicture,
			joinedAt: Date.now(),
		})

		let reachedCount = 0
		for (const targetUserId of payload.targetUserIds) {
			const targetSocketId = this.firstSocketForUser(targetUserId)
			if (targetSocketId) {
				reachedCount++
				this.send(targetSocketId, "call:incoming", {
					callId: payload.callId,
					callType,
					callerId,
					callerName: payload.callerName,
					callerPicture: payload.callerPicture,
					isGroupCall: payload.isGroupCall,
					participants: Array.from(call.participants.values()),
				})
			}
		}

		if (reachedCount === 0) {
			ActiveCallStore.deleteCall(payload.callId)
			this.send(socketId, "call:error", {
				message: payload.isGroupCall
					? "Aucun participant n'est joignable"
					: "Le destinataire est hors ligne",
			})
		}
	}

	private handleAccept = (socketId: string, payload: {
		callId: string,
		userName: string,
		userPicture: string,
	}) => {
		const userId = SessionManager.getUserId(socketId)
		const call = ActiveCallStore.getCall(payload.callId)
		if (!call || !userId) return

		ActiveCallStore.addParticipant(payload.callId, {
			userId,
			socketId,
			firstname: payload.userName.split(" ")[0]!,
			lastname: payload.userName.split(" ").slice(1).join(" "),
			picture: payload.userPicture,
			joinedAt: Date.now(),
		})

		const others = this.participantSocketIds(payload.callId, socketId)
		if (others.length) {
			this.send(others, "call:user-joined", {
				callId: payload.callId,
				userId,
				userName: payload.userName,
				userPicture: payload.userPicture,
				socketId,
			})
		}

		const existingParticipants = Array.from(call.participants.values())
			.filter(p => p.userId !== userId)

		this.send(socketId, "call:participants-list", {
			callId: payload.callId,
			participants: existingParticipants,
		})
	}

	private handleOffer = (_socketId: string, payload: {
		callId: string,
		fromUserId: string,
		toUserId: string,
		sdp: any,
	}) => {
		const targetSocketId = this.firstSocketForUser(payload.toUserId)
		if (targetSocketId) {
			this.send(targetSocketId, "call:offer", {
				callId: payload.callId,
				fromUserId: payload.fromUserId,
				sdp: payload.sdp,
			})
		}
	}

	private handleAnswer = (_socketId: string, payload: {
		callId: string,
		fromUserId: string,
		toUserId: string,
		sdp: any,
	}) => {
		const targetSocketId = this.firstSocketForUser(payload.toUserId)
		if (targetSocketId) {
			this.send(targetSocketId, "call:answer", {
				callId: payload.callId,
				fromUserId: payload.fromUserId,
				sdp: payload.sdp,
			})
		}
	}

	private handleIceCandidate = (_socketId: string, payload: {
		callId: string,
		fromUserId: string,
		toUserId: string,
		candidate: any,
	}) => {
		const targetSocketId = this.firstSocketForUser(payload.toUserId)
		if (targetSocketId) {
			this.send(targetSocketId, "call:ice-candidate", {
				callId: payload.callId,
				fromUserId: payload.fromUserId,
				candidate: payload.candidate,
			})
		}
	}

	private handleHangup = (socketId: string, payload: { callId: string }) => {
		const userId = SessionManager.getUserId(socketId)
		if (!userId) return
		this.removeUserFromCall(payload.callId, userId, socketId)
	}

	private handleReject = (socketId: string, payload: { callId: string }) => {
		const userId = SessionManager.getUserId(socketId)
		if (!userId) return
		const call = ActiveCallStore.getCall(payload.callId)
		if (!call) return

		const others = this.participantSocketIds(payload.callId, socketId)
		if (others.length) {
			this.send(others, "call:user-rejected", {
				callId: payload.callId,
				userId,
			})
		}

		if (!call.isGroupCall && call.participants.size <= 1) {
			this.endCall(payload.callId)
		}
	}

	private handleMuteToggle = (socketId: string, payload: {
		callId: string,
		isMuted: boolean,
	}) => {
		const userId = SessionManager.getUserId(socketId)
		if (!userId) return

		const others = this.participantSocketIds(payload.callId, socketId)
		if (others.length) {
			this.send(others, "call:mute-toggle", {
				callId: payload.callId,
				userId,
				isMuted: payload.isMuted,
			})
		}
	}

	private handleDisconnect = (socketId: string) => {
		const found = ActiveCallStore.getCallAndUserBySocketId(socketId)
		if (!found) return
		this.removeUserFromCall(found.call.callId, found.userId, socketId)
	}

	private removeUserFromCall(callId: string, userId: string, socketId: string) {
		const beforeOthers = this.participantSocketIds(callId, socketId)
		const call = ActiveCallStore.removeParticipant(callId, userId)

		if (!call || call.participants.size === 0) {
			if (beforeOthers.length) this.send(beforeOthers, "call:ended", { callId })
			ActiveCallStore.deleteCall(callId)
		} else if (call.participants.size === 1 && !call.isGroupCall) {
			const allSocketIds = Array.from(call.participants.values()).map(p => p.socketId)
			this.send(allSocketIds, "call:ended", { callId })
			ActiveCallStore.deleteCall(callId)
		} else {
			const allSocketIds = Array.from(call.participants.values()).map(p => p.socketId)
			this.send(allSocketIds, "call:user-left", { callId, userId })
		}
	}

	private endCall(callId: string) {
		const allSocketIds = this.participantSocketIds(callId)
		if (allSocketIds.length) this.send(allSocketIds, "call:ended", { callId })
		ActiveCallStore.deleteCall(callId)
	}
}
