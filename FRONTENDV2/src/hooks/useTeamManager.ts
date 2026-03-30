import { useState, useCallback } from "react"
import type { Team } from "pages/Teams/Teams.types"

type TeamFormMode = "create" | "edit" | null

interface UseTeamManagerReturn {
	teams: Team[]
	selectedTeam: Team | null
	teamFormMode: TeamFormMode
	managingMembersTeamId: string | null
	handleTeamSelect: (team: Team) => void
	handleCreateTeam: () => void
	handleEditTeam: (team: Team) => void
	handleManageMembers: (teamId: string) => void
	handleTeamCreated: (team: Team) => void
	handleTeamUpdated: (team: Team) => void
	handleTeamDeleted: (teamId: string) => void
	handleCancelTeamForm: () => void
	handleCancelManageMembers: () => void
	updateTeamsFromResponse: (teams: Team[]) => void
	selectFirstAvailableTeam: () => void
}

export function useTeamManager(): UseTeamManagerReturn {

	const [teams, setTeams] = useState<Team[]>([])
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
	const [teamFormMode, setTeamFormMode] = useState<TeamFormMode>(null)
	const [managingMembersTeamId, setManagingMembersTeamId] = useState<string | null>(null)

	const handleTeamSelect = useCallback((team: Team) => {
		setSelectedTeam(team)
		setTeamFormMode(null)
		setManagingMembersTeamId(null)
	}, [])

	const handleCreateTeam = useCallback(() => {
		setTeamFormMode("create")
		setManagingMembersTeamId(null)
	}, [])

	const handleEditTeam = useCallback((team: Team) => {
		setSelectedTeam(team)
		setTeamFormMode("edit")
		setManagingMembersTeamId(null)
	}, [])

	const handleManageMembers = useCallback((teamId: string) => {
		setManagingMembersTeamId(teamId)
		setTeamFormMode(null)
	}, [])

	const handleTeamCreated = useCallback((team: Team) => {
		setTeams(previous => [...previous, team])
		setSelectedTeam(team)
		setTeamFormMode(null)
	}, [])

	const handleTeamUpdated = useCallback((team: Team) => {
		setTeams(previous =>
			previous.map(existing =>
				existing.id === team.id ? team : existing
			)
		)
		setSelectedTeam(current =>
			current?.id === team.id ? team : current
		)
		setTeamFormMode(null)
	}, [])

	const handleTeamDeleted = useCallback((teamId: string) => {
		setTeams(previous => previous.filter(team => team.id !== teamId))
		setSelectedTeam(current => {
			if (current?.id === teamId) return null
			return current
		})
		setTeamFormMode(null)
		setManagingMembersTeamId(null)
	}, [])

	const handleCancelTeamForm = useCallback(() => {
		setTeamFormMode(null)
	}, [])

	const handleCancelManageMembers = useCallback(() => {
		setManagingMembersTeamId(null)
	}, [])

	const updateTeamsFromResponse = useCallback((receivedTeams: Team[]) => {
		setTeams(receivedTeams)
		setSelectedTeam(current => {
			if (!current) return null
			return receivedTeams.find(team => team.id === current.id) ?? null
		})
	}, [])

	const selectFirstAvailableTeam = useCallback(() => {
		setTeams(current => {
			setSelectedTeam(current.length > 0 ? current[0]! : null)
			return current
		})
	}, [])

	return {
		teams,
		selectedTeam,
		teamFormMode,
		managingMembersTeamId,
		handleTeamSelect,
		handleCreateTeam,
		handleEditTeam,
		handleManageMembers,
		handleTeamCreated,
		handleTeamUpdated,
		handleTeamDeleted,
		handleCancelTeamForm,
		handleCancelManageMembers,
		updateTeamsFromResponse,
		selectFirstAvailableTeam,
	}
}
