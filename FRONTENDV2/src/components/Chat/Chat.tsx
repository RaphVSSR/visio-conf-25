import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "hooks/useAuth"
import { ChatSync } from "services/chat/ChatSync"
import type { ChatState } from "services/chat/ChatSync.types"
import "./Chat.scss"

const INITIAL_STATE: ChatState = {
	chats: [],
	hiddenChats: [],
	users: [],
	activeChat: null,
	isLoading: false,
	creatingStatus: null,
	deletingStatus: null,
}

export const Chat = () => {

	const { user, socket } = useAuth()

	const [state, setState] = useState<ChatState>(() => {
		const savedHidden = localStorage.getItem("hiddenChats")
		return {
			...INITIAL_STATE,
			hiddenChats: savedHidden ? JSON.parse(savedHidden) : [],
		}
	})

	const chatSyncRef = useRef<ChatSync | null>(null)

	// --- Modal state ---
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [newChatName, setNewChatName] = useState("")
	const [messageText, setMessageText] = useState("")
	const [selectedUsers, setSelectedUsers] = useState<string[]>([])
	const [contacts, setContacts] = useState<any[]>([])

	// --- Persist hiddenChats ---
	useEffect(() => {
		localStorage.setItem("hiddenChats", JSON.stringify(state.hiddenChats))
	}, [state.hiddenChats])

	// --- Fetch contacts via contacts:list (prod pattern) ---
	const handleContactsResponse = useCallback((data: any) => {
		setContacts(Array.isArray(data) ? data : [])
	}, [])

	useEffect(() => {
		if (!socket || !user) return

		socket.on("contacts:list:response", handleContactsResponse)
		socket.send("contacts:list", { excludeEmail: user.email })

		return () => {
			socket.off("contacts:list:response", handleContactsResponse)
		}
	}, [socket, user, handleContactsResponse])

	// --- ChatSync lifecycle ---
	useEffect(() => {
		if (!socket || !user) return

		const sync = new ChatSync(socket, setState)
		chatSyncRef.current = sync

		sync.getChats(user._id)

		return () => {
			sync.destroy()
			chatSyncRef.current = null
		}
	}, [socket, user])

	// --- Unhide chat on new message (sync localStorage) ---
	useEffect(() => {
		const savedHidden = localStorage.getItem("hiddenChats")
		const savedList: string[] = savedHidden ? JSON.parse(savedHidden) : []
		if (JSON.stringify(savedList) !== JSON.stringify(state.hiddenChats)) {
			localStorage.setItem("hiddenChats", JSON.stringify(state.hiddenChats))
		}
	}, [state.hiddenChats])

	// --- Handlers ---
	const handleCreateChat = () => {
		if (!chatSyncRef.current || !user) return

		let chatName = newChatName.trim()
		let chatType = "group"

		if (selectedUsers.length === 1 && !chatName) {
			const partner = contacts.find(u => u.id === selectedUsers[0])
			if (partner) {
				chatName = `${partner.firstname} ${partner.lastname}`
				chatType = "unique"
			}
		} else if (!chatName) {
			chatName = "Nouvelle discussion"
		}

		chatSyncRef.current.createChat({
			name: chatName,
			creator: user._id,
			members: [user._id, ...selectedUsers].filter(Boolean),
			type: chatType,
		})

		setNewChatName("")
		setSelectedUsers([])
		setIsModalOpen(false)
	}

	const handleHideChat = () => {
		if (!state.activeChat) return
		if (window.confirm("Voulez-vous vraiment cacher cette discussion de votre vue ? (Elle réapparaîtra au prochain message)")) {
			setState(prev => ({
				...prev,
				hiddenChats: [...prev.hiddenChats, prev.activeChat.uuid],
				activeChat: null,
			}))
		}
	}

	const handleSendMessage = () => {
		if (!messageText.trim() || !state.activeChat || !chatSyncRef.current || !user) return
		chatSyncRef.current.sendMessageToChat(state.activeChat.uuid, messageText, user._id)
		setMessageText("")
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") handleSendMessage()
	}

	const setActiveChat = (chat: any) => {
		setState(prev => ({ ...prev, activeChat: chat }))
	}

	// --- Sorted & filtered chats ---
	const visibleChats = [...state.chats]
		.filter(chat => !state.hiddenChats.includes(chat.uuid))
		.sort((a, b) => {
			const dateA = a.messages?.length > 0
				? new Date(a.messages[a.messages.length - 1].date_created).getTime()
				: new Date(a.createdAt || a.date_created || 0).getTime()
			const dateB = b.messages?.length > 0
				? new Date(b.messages[b.messages.length - 1].date_created).getTime()
				: new Date(b.createdAt || b.date_created || 0).getTime()
			return dateB - dateA
		})

	return (
		<div className="chat">

			{/* Sidebar */}
			<div className="chat__sidebar">
				<div className="chat__sidebar-header">
					<h2>Messages</h2>
					<button className="chat__add-btn" onClick={() => setIsModalOpen(true)}>+</button>
				</div>

				<div className="chat__list">
					{state.isLoading && <p className="chat__loading">Chargement...</p>}

					{visibleChats.map(chat => (
						<div
							key={chat.uuid}
							className={`chat__item ${state.activeChat?.uuid === chat.uuid ? "chat__item--active" : ""}`}
							onClick={() => setActiveChat(chat)}
						>
							<div className="chat__avatar">
								{chat.name?.charAt(0).toUpperCase()}
							</div>
							<div className="chat__item-info">
								<span className="chat__item-name">{chat.name}</span>
								<span className="chat__item-preview">
									{chat.messages?.length > 0
										? chat.messages[chat.messages.length - 1].content
										: "Pas de messages"}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Chat Window */}
			<div className="chat__window">
				{state.activeChat ? (
					<>
						<div className="chat__header">
							<div className="chat__header-user">
								<div className="chat__avatar">
									{state.activeChat.name?.charAt(0).toUpperCase()}
								</div>
								<div>
									<h3>{state.activeChat.name}</h3>
									<span className="chat__header-status">
										{state.activeChat.type === "group" ? "Groupe" : "Discussion privée"}
									</span>
								</div>
							</div>
							<div className="chat__header-actions">
								<button
									className="chat__action-btn"
									onClick={handleHideChat}
									title="Cacher de ma vue"
								>
									🗑️
								</button>
							</div>
						</div>

						<div className="chat__messages">
							{(!state.activeChat.messages || state.activeChat.messages.length === 0) && (
								<div className="chat__no-messages">Aucun message pour l'instant</div>
							)}
							{state.activeChat.messages?.map((msg: any) => {
								const senderId = typeof msg.sender === "object" ? msg.sender?._id : msg.sender
								const isSent = senderId === user?._id
								return (
									<div key={msg.uuid} className={`chat__message-row ${isSent ? "chat__message-row--sent" : ""}`}>
										<div className={`chat__bubble ${isSent ? "chat__bubble--sent" : "chat__bubble--received"}`}>
											<div className="chat__bubble-content">{msg.content}</div>
											<div className="chat__bubble-time">
												{new Date(msg.date_created).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
											</div>
										</div>
									</div>
								)
							})}
						</div>

						<div className="chat__input-area">
							<div className="chat__input-wrapper">
								<input
									type="text"
									placeholder="Écrire un message..."
									value={messageText}
									onChange={(e) => setMessageText(e.target.value)}
									onKeyDown={handleKeyPress}
								/>
								<button className="chat__send-btn" onClick={handleSendMessage}>➤</button>
							</div>
						</div>
					</>
				) : (
					<div className="chat__empty-state">
						<h3>Bienvenue dans vos messages</h3>
						<p>Sélectionnez une discussion pour commencer à discuter</p>
					</div>
				)}
			</div>

			{/* Create chat modal */}
			{isModalOpen && (
				<div className="chat__modal-overlay">
					<div className="chat__modal">
						<h2>Nouvelle Discussion</h2>
						<p className="chat__modal-subtitle">Créez un groupe ou démarrez une discussion privée</p>

						<div className="chat__form-group">
							<label>
								Nom de la discussion <span className="chat__label-hint">(optionnel si 1 destinataire)</span>
							</label>
							<input
								type="text"
								placeholder="Ex: Projet Alpha..."
								value={newChatName}
								onChange={(e) => setNewChatName(e.target.value)}
							/>
						</div>

						<div className="chat__users-selection">
							<div className="chat__users-list">
								{contacts.map(u => (
									<div key={u.id} className="chat__user-item">
										<label>
											<input
												type="checkbox"
												checked={selectedUsers.includes(u.id)}
												onChange={(e) => {
													if (e.target.checked) {
														setSelectedUsers([...selectedUsers, u.id])
													} else {
														setSelectedUsers(selectedUsers.filter(id => id !== u.id))
													}
												}}
											/>
											<span className="chat__user-name">{u.firstname} {u.lastname}</span>
											{u.is_online && <span className="chat__online-badge">● En ligne</span>}
										</label>
									</div>
								))}
								{contacts.length === 0 && (
									<p className="chat__no-users">Aucun autre utilisateur trouvé.</p>
								)}
							</div>
						</div>

						<div className="chat__modal-actions">
							<button
								className="chat__btn-cancel"
								onClick={() => { setIsModalOpen(false); setSelectedUsers([]); setNewChatName("") }}
							>
								Annuler
							</button>
							<button
								className="chat__btn-create"
								onClick={handleCreateChat}
								disabled={selectedUsers.length === 0}
							>
								Créer
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
