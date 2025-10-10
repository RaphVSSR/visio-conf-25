export interface Team {
    id: string
    name: string
    description?: string
    picture?: string // Nom du fichier de l'image de l'équipe
    createdBy: string
    createdAt: string
    updatedAt: string
    role?: string // Le rôle de l'utilisateur dans cette équipe
    deleted?: boolean // Indique si l'équipe a été supprimée
}

export interface TeamMember {
    id: string
    teamId: string
    userId: string
    role: string
    joinedAt: string
    firstname?: string
    lastname?: string
    picture?: string
}

export interface AllTeam{
    _id: string
    name: string
    numberOfParticipants: number
}
