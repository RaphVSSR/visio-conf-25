
export interface Team {
	id: string;
	name: string;
	description?: string;
	picture?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	role?: "admin" | "member";
	deleted?: boolean;
}

export interface Channel {
	id: string;
	name: string;
	teamId: string;
	createdBy: string;
	isPublic: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ChannelMember {
	id: string;
	userId: string;
	role: "admin" | "member";
	firstname?: string;
	lastname?: string;
	picture?: string;
}

export interface ChannelPost {
	id: string;
	channelId: string;
	content: string;
	authorId: string;
	authorName: string;
	authorAvatar?: string;
	createdAt: string;
	responseCount: number;
	responses?: ChannelPostResponse[];
}

export interface ChannelPostResponse {
	id: string;
	postId: string;
	content: string;
	authorId: string;
	authorName: string;
	authorAvatar?: string;
	createdAt: string;
}
