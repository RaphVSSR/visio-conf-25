import type MessageClientAdapter from "services/MessageClientAdapter"
import type { ChatState } from "./ChatSync.types"

type StateUpdater = (updater: (prev: ChatState) => ChatState) => void

export class ChatSync {

	private socket: MessageClientAdapter
	private onStateChange: StateUpdater

	// --- Bound handlers (needed for off()) ---

	private handleChatOperationResult = (data: any) => {
		if (data.status === "error") {
			console.error("ChatSync: chat_operation error:", data.message)
			return
		}

		switch (data.action) {
			case "READ_ALL":
				this.onStateChange(prev => ({
					...prev,
					chats: data.data || [],
					isLoading: false,
				}))
				break

			case "READ":
				this.onStateChange(prev => ({
					...prev,
					activeChat: data.data,
					isLoading: false,
				}))
				break

			case "CREATE":
				this.onStateChange(prev => ({
					...prev,
					chats: [...(prev.chats || []), data.data],
					creatingStatus: "created",
				}))
				break

			case "DELETE":
				this.onStateChange(prev => ({
					...prev,
					chats: prev.chats.filter(c => c.uuid !== data.data.uuid),
					deletingStatus: "deleted",
				}))
				break
		}
	}

	private handleMessageOperationResult = (data: any) => {
		if (data.status === "error") {
			console.error("ChatSync: message_operation error:", data.message)
			return
		}

		switch (data.action) {
			case "SEND": {
				const { chatUuid, message } = data.data

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

	constructor(socket: MessageClientAdapter, onStateChange: StateUpdater) {
		this.socket = socket
		this.onStateChange = onStateChange

		this.socket.on("chat_operation_result", this.handleChatOperationResult)
		this.socket.on("message_operation_result", this.handleMessageOperationResult)
	}

	// --- Emit methods ---

	getChats(userId: string): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true }))
		this.socket.send("chat_operation", { action: "READ_ALL", data: { userId } })
	}

	getChat(uuid: string): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true }))
		this.socket.send("chat_operation", { action: "READ", data: { uuid } })
	}

	createChat(data: any): void {
		this.onStateChange(prev => ({ ...prev, creatingStatus: "pending" }))
		this.socket.send("chat_operation", { action: "CREATE", data })
	}

	deleteChat(uuid: string): void {
		this.onStateChange(prev => ({ ...prev, deletingStatus: "pending" }))
		this.socket.send("chat_operation", { action: "DELETE", data: { uuid } })
	}

	sendMessageToChat(chatUuid: string, content: string, sender: string): void {
		this.socket.send("message_operation", { action: "SEND", data: { chatUuid, content, sender } })
	}

	destroy(): void {
		this.socket.off("chat_operation_result", this.handleChatOperationResult)
		this.socket.off("message_operation_result", this.handleMessageOperationResult)
	}
}
