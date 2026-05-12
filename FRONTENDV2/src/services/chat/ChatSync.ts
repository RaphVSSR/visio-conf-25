import Controleur from "Controller/controleur.js"
import CanalSocketio from "Controller/canalsocketio.js"
import type { ChatState, DiscuType, MessageType, ChatContact } from "./ChatSync.types"

type StateUpdater = (updater: (prev: ChatState) => ChatState) => void

export class ChatSync {

	readonly nomDInstance = "ChatSync"

	private static readonly listMessageEmission = ["chat_operation", "message_operation", "contacts:list"]
	private static readonly listMessageReception = ["chat_operation_result", "message_operation_result", "contacts:list:response"]

	private controleur: Controleur
	private canal: CanalSocketio
	private onStateChange: StateUpdater

	constructor(onStateChange: StateUpdater) {
		this.onStateChange = onStateChange
		this.controleur = new Controleur()
		this.canal = new CanalSocketio(this.controleur, "canalsocketio")

		this.controleur.inscription(this, ChatSync.listMessageEmission, ChatSync.listMessageReception)
		
		// Initial load when socket is ready
		this.canal.socket.on("donne_liste", () => {
			// Note: userId will be resolved by server from session
			this.getChats("") 
		})
	}

	traitementMessage(mesg: Record<string, any>): void {
		for (const key of Object.keys(mesg)) {
			switch (key) {
				case "chat_operation_result":
					this.handleChatOperationResult(mesg[key])
					break
				case "message_operation_result":
					this.handleMessageOperationResult(mesg[key])
					break
				case "contacts:list:response":
					this.handleContactsResponse(mesg[key])
					break
			}
		}
	}

	private handleChatOperationResult = (data: { action: string, status: string, message?: string, data?: any }) => {
		if (data.status === "error") {
			console.error("ChatSync: chat_operation error:", data.message)
			return
		}

		switch (data.action) {
			case "READ_ALL":
				this.onStateChange(prev => ({
					...prev,
					chats: (data.data || []) as DiscuType[],
					isLoading: false,
				}))
				break

			case "READ":
				this.onStateChange(prev => ({
					...prev,
					activeChat: data.data as DiscuType,
					isLoading: false,
				}))
				break

			case "CREATE":
				this.onStateChange(prev => ({
					...prev,
					chats: [...prev.chats, data.data as DiscuType],
					creatingStatus: "created",
				}))
				break

			case "DELETE": {
				const deletedUuid = data.data.uuid as string
				this.onStateChange(prev => ({
					...prev,
					chats: prev.chats.filter(c => c.uuid !== deletedUuid),
					hiddenChats: prev.hiddenChats.filter(id => id !== deletedUuid),
					activeChat: prev.activeChat?.uuid === deletedUuid ? null : prev.activeChat,
					deletingStatus: "deleted",
				}))
				break
			}
		}
	}

	private handleMessageOperationResult = (data: { action: string, status: string, message?: string, data?: any }) => {
		if (data.status === "error") {
			console.error("ChatSync: message_operation error:", data.message)
			return
		}

		switch (data.action) {
			case "SEND": {
				const { chatUuid, message } = data.data as { chatUuid: string, message: MessageType }

				this.onStateChange(prev => {
					const updatedChats = prev.chats.map(c => {
						if (c.uuid === chatUuid) {
							return { ...c, messages: [...(c.messages || []), message] }
						}
						return c
					})

					let updatedActiveChat = prev.activeChat
					if (prev.activeChat?.uuid === chatUuid) {
						updatedActiveChat = {
							...prev.activeChat,
							messages: [...(prev.activeChat.messages || []), message],
						}
					}

					const updatedHidden = prev.hiddenChats.includes(chatUuid)
						? prev.hiddenChats.filter(id => id !== chatUuid)
						: prev.hiddenChats

					return {
						...prev,
						chats: updatedChats,
						activeChat: updatedActiveChat,
						hiddenChats: updatedHidden,
					}
				})
				break
			}
		}
	}

	private handleContactsResponse = (data: any) => {
		this.onStateChange(prev => ({
			...prev,
			contacts: (Array.isArray(data) ? data : []) as ChatContact[],
			isLoadingContacts: false
		}))
	}

	// --- Actions ---

	getChats(userId: string): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true }))
		this.send("chat_operation", { action: "READ_ALL", data: { userId } })
	}

	getChat(uuid: string): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true }))
		this.send("chat_operation", { action: "READ", data: { uuid } })
	}

	createChat(data: Partial<DiscuType>): void {
		this.onStateChange(prev => ({ ...prev, creatingStatus: "pending" }))
		this.send("chat_operation", { action: "CREATE", data })
	}

	deleteChat(uuid: string): void {
		this.onStateChange(prev => ({ ...prev, deletingStatus: "pending" }))
		this.send("chat_operation", { action: "DELETE", data: { uuid } })
	}

	sendMessageToChat(chatUuid: string, content: string): void {
		this.send("message_operation", { action: "SEND", data: { chatUuid, content } })
	}

	loadContacts(excludeEmail?: string): void {
		this.onStateChange(prev => ({ ...prev, isLoadingContacts: true }))
		this.send("contacts:list", { excludeEmail })
	}

	destroy(): void {
		this.canal.socket.disconnect()
	}

	private send(name: string, payload: unknown): void {
		this.controleur.envoie(this, { [name]: payload })
	}
}
