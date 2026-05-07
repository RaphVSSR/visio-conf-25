export type AdminTeam = {
	id: string
	name: string
	description?: string
	picture?: string
	createdBy: string
	createdAt: string | Date
	updatedAt?: string | Date
	memberCount: number
}

export type TeamGetAllResponse = {
	type: "all"
	etat: boolean
	teams?: AdminTeam[]
	error?: string
}

export type TeamActionResponse = {
	type: "create" | "update" | "delete" | "leave"
	etat: boolean
	team?: AdminTeam
	teamId?: string
	error?: string
}

export type ToastState = { message: string, kind: "success" | "error" } | null
