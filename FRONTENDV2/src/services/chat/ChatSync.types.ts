
export type MessageType = {
	uuid: string
	content: string
	sender: string
	date_created: Date
	status?: string
}

export type DiscuType = {
	uuid: string
	name: string
	description?: string
	creator: string
	type?: string
	members: string[]
	date_created?: Date
	messages?: MessageType[]
}

export type DirectoryUser = {
	id: string
	firstname: string
	lastname: string
	picture?: string
	is_online: boolean
}

export type ChatState = {
	chats: DiscuType[]
	hiddenChats: string[]
	activeChat: DiscuType | null
	isLoading: boolean
	creatingStatus: string | null
	deletingStatus: string | null
	availableUsers: DirectoryUser[]
	isLoadingUsers: boolean
}

export const initialChatState: ChatState = {
	chats: [],
	hiddenChats: [],
	activeChat: null,
	isLoading: false,
	creatingStatus: null,
	deletingStatus: null,
	availableUsers: [],
	isLoadingUsers: false,
}

export type ChatActions = {
	loadChats: () => void
	getChat: (uuid: string) => void
	createChat: (data: Partial<DiscuType>) => void
	sendMessageToChat: (chatUuid: string, content: string) => void
	deleteChat: (uuid: string) => void
	hideChat: (uuid: string) => void
	setActiveChat: (chat: DiscuType | null) => void
	loadUsers: () => void
}

export type ChatContextType = ChatState & ChatActions
