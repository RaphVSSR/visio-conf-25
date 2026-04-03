export interface Channel {
    _id: string
    id?: string
    name: string
    description?: string
    teamId?: string
    isPublic: boolean
    createdAt: string
    updatedAt: string
    createdBy: string
    members?: ChannelMember[]
    isMember?: boolean // Indique si l'utilisateur courant est membre du canal
}

export interface ChannelMember {
    _id: string
    id?: string
    channelId: string
    userId: string
    role: string
    joinedAt: string
    firstname?: string
    lastname?: string
    picture?: string
}

export interface ChannelPost {
    _id: string
    id?: string
    channelId: string
    content: string
    authorId: string
    authorName: string
    authorAvatar?: string
    createdAt: string
    updatedAt: string
    responseCount: number
    responses?: ChannelPostResponse[]
}

export interface ChannelPostResponse {
    _id: string
    id?: string
    postId: string
    content: string
    authorId: string
    authorName: string
    authorAvatar?: string
    createdAt: string
    updatedAt: string
}
