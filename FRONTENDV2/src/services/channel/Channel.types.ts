import type { Channel as ChannelModel } from "pages/Teams/Teams.types"

export type ChannelFormMode = "create" | "edit" | null

export type ChannelMember = {
	id?: string,
	userId: string,
	role: "admin" | "member",
	firstname?: string,
	lastname?: string,
	picture?: string,
}

export type ChannelPost = {
	id: string,
	channelId: string,
	content: string,
	authorId: string,
	authorName: string,
	authorAvatar?: string,
	createdAt: string,
	updatedAt?: string,
	responseCount?: number,
	responses?: any[],
}

export type ChannelState = {
	channels: ChannelModel[],
	selectedChannel: ChannelModel | null,
	channelFormMode: ChannelFormMode,
	channelMembers: ChannelMember[],
	posts: ChannelPost[],
	isLoadingChannels: boolean,
	isLoadingMembers: boolean,
	isLoadingPosts: boolean,
	isSubmittingChannel: boolean,
	isDeletingChannel: boolean,
	channelError: string,
}

export type CreateChannelInput = {
	name: string,
	isPublic: boolean,
	teamId: string,
	members: string[],
}

export type UpdateChannelInput = {
	channelId: string,
	name: string,
	isPublic: boolean,
	teamId: string,
	members: string[],
}

export type ChannelActions = {
	loadChannels: (teamId: string) => void,
	clearChannels: () => void,
	selectChannel: (channel: ChannelModel | null) => void,
	openCreateForm: () => void,
	openEditForm: (channel: ChannelModel) => void,
	closeForm: () => void,
	loadMembers: (channelId: string) => void,
	loadPosts: (channelId: string) => void,
	createChannel: (data: CreateChannelInput) => void,
	updateChannel: (data: UpdateChannelInput) => void,
	deleteChannel: (channelId: string) => void,
	publishPost: (channelId: string, content: string) => void,
	answerPost: (postId: string, content: string) => void,
	clearChannelError: () => void,
}

export type ChannelContextType = ChannelState & ChannelActions
