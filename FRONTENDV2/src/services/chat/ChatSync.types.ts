
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

export type Contact = {
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
}

export type ChatActions = {
	getChats: () => void
	getChat: (uuid: string) => void
	createChat: (data: Partial<DiscuType>) => void
	sendMessage: (chatUuid: string, content: string) => void
	deleteChat: (uuid: string) => void
	hideChat: (uuid: string) => void
	setActiveChat: (chat: DiscuType | null) => void
}

export type ChatContextType = ChatState & ChatActions
