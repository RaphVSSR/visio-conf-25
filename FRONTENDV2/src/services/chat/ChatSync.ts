import Controleur from "Controller/controleur.js"
import CanalSocketio from "Controller/canalsocketio.js"
import type { ChatState, DiscuType, MessageType, DirectoryUser } from "./ChatSync.types"

type StateUpdater = (updater: (prev: ChatState) => ChatState) => void

export class ChatSync {

	readonly nomDInstance = "ChatSync"

	private static readonly listMessageEmission = ["chat_operation", "message_operation", "user_get"]
	private static readonly listMessageReception = ["chat_operation_result", "message_operation_result", "user_get_response"]

	private controleur: Controleur
	private canal: CanalSocketio
	private setState: StateUpdater

	constructor(setState: StateUpdater) {
		this.setState = setState
		this.controleur = new Controleur()
		this.canal = new CanalSocketio(this.controleur, "canalsocketio")
		this.controleur.inscription(this, ChatSync.listMessageEmission, ChatSync.listMessageReception)
		this.canal.socket.on("donne_liste", () => this.loadChats())
	}

	traitementMessage(mesg: Record<string, any>): void {
		for (const key of Object.keys(mesg)) {
			switch (key) {
				case "chat_operation_result":    this.handleChatOperationResult(mesg[key]); break
				case "message_operation_result": this.handleMessageOperationResult(mesg[key]); break
				case "user_get_response":        this.handleUserResponse(mesg[key]); break
			}
		}
	}

	// --- Public methods ---

	loadChats = (): void => {
		this.setState(prev => ({ ...prev, isLoading: true }))
		this.send("chat_operation", { action: "READ_ALL", data: {} })
	}

	getChat = (uuid: string): void => {
		this.setState(prev => ({ ...prev, isLoading: true }))
		this.send("chat_operation", { action: "READ", data: { uuid } })
	}

	createChat = (data: Partial<DiscuType>): void => {
		this.setState(prev => ({ ...prev, creatingStatus: "pending" }))
		this.send("chat_operation", { action: "CREATE", data })
	}

	deleteChat = (uuid: string): void => {
		this.setState(prev => ({ ...prev, deletingStatus: "pending" }))
		this.send("chat_operation", { action: "DELETE", data: { uuid } })
	}

	sendMessageToChat = (chatUuid: string, content: string): void => {
		this.send("message_operation", { action: "SEND", data: { chatUuid, content } })
	}

	loadUsers = (): void => {
		this.setState(prev => ({ ...prev, isLoadingUsers: true }))
		this.send("user_get", { type: "list" })
	}

	destroy(): void {
		this.canal.socket.disconnect()
	}

	// --- Private helpers ---

	private send(name: string, payload: unknown): void {
		this.controleur.envoie(this, { [name]: payload })
	}

	// --- Response handlers ---

	private handleChatOperationResult = (data: { action: string, status: string, message?: string, data?: any }) => {
		if (data.status === "error") {
			console.error("ChatSync: chat_operation error:", data.message)
			return
		}

		switch (data.action) {
			case "READ_ALL":
				this.setState(prev => ({
					...prev,
					chats: (data.data || []) as DiscuType[],
					isLoading: false,
				}))
				break

			case "READ":
				this.setState(prev => ({
					...prev,
					activeChat: data.data as DiscuType,
					isLoading: false,
				}))
				break

			case "CREATE":
				this.setState(prev => ({
					...prev,
					chats: [...prev.chats, data.data as DiscuType],
					creatingStatus: "created",
				}))
				break

			case "DELETE": {
				const deletedUuid = data.data.uuid as string
				this.setState(prev => ({
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

				this.setState(prev => {
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

					// Unhide the chat if a new message arrives
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
			case "DELETE":
				// Future: handle message deletion
				break
		}
	}

	private handleUserResponse = (data: any) => {
		if (data?.type !== "list") return
		this.setState(prev => ({
			...prev,
			availableUsers: data.etat ? (data.users || []) as DirectoryUser[] : prev.availableUsers,
			isLoadingUsers: false,
		}))
	}
}
