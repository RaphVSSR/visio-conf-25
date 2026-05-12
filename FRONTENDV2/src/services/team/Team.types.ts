import type { Team as TeamModel } from "pages/Teams/Teams.types"

export type TeamFormMode = "create" | "edit" | null

export type TeamMember = {
	id?: string,
	userId: string,
	role: "admin" | "member",
	firstname?: string,
	lastname?: string,
	picture?: string,
}

export type DirectoryUser = {
	id: string,
	firstname: string,
	lastname: string,
	picture?: string,
}

export type TeamState = {
	teams: TeamModel[],
	selectedTeam: TeamModel | null,
	teamFormMode: TeamFormMode,
	teamMembers: TeamMember[],
	availableUsers: DirectoryUser[],
	isLoadingTeams: boolean,
	isLoadingMembers: boolean,
	isLoadingUsers: boolean,
	isSubmittingTeam: boolean,
	isDeletingTeam: boolean,
	teamError: string,
	teamSuccess: string,
}

export type CreateTeamInput = {
	name: string,
	description: string,
	picture: string,
	members: string[],
}

export type UpdateTeamInput = {
	teamId: string,
	name: string,
	description: string,
	picture: string,
}

export type TeamActions = {
	loadTeams: () => void,
	selectTeam: (team: TeamModel | null) => void,
	openCreateForm: () => void,
	openEditForm: (team: TeamModel) => void,
	closeForm: () => void,
	loadUsers: () => void,
	loadMembers: (teamId: string) => void,
	createTeam: (data: CreateTeamInput) => void,
	updateTeam: (data: UpdateTeamInput) => void,
	deleteTeam: (teamId: string) => void,
	addMember: (teamId: string, userId: string) => void,
	removeMember: (teamId: string, userId: string) => void,
	clearTeamMessages: () => void,
}

export type TeamContextType = TeamState & TeamActions
