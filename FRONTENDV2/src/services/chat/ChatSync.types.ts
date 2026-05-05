
export type DiscuType = {
	uuid: string;
	name: string;
	description?: string;
	creator: string;
	type?: string;
	members: string[];
	date_created?: Date;
	messages?: {
		uuid: string;
		content: string;
		sender: string;
		date_created: Date;
		status?: string;
	}[];
}

export type ChatState = {
	chats: any[]
	hiddenChats: string[]
	users: any[]
	activeChat: any | null
	isLoading: boolean
	creatingStatus: string | null
	deletingStatus: string | null
}

export type ChatActions = {
	getChats: (userId: string) => void
	getChat: (uuid: string) => void
	createChat: (data: any) => void
	sendMessage: (chatUuid: string, content: string) => void
	deleteChat: (uuid: string) => void
	hideChat: (uuid: string) => void
	setActiveChat: (chat: any) => void
}

export type ChatContextType = ChatState & ChatActions
