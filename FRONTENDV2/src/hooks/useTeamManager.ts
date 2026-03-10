import { useState, useCallback } from "react"
import type { Team } from "pages/Teams/Teams.types"

type TeamFormMode = "create" | "edit" | null

interface UseTeamManagerProps {
	initialTeams: Team[]
	onTeamsChange?: (teams: Team[]) => void
	onTeamSelected?: (team: Team | null) => void
	onTeamDeleted?: () => void
}

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

export function useTeamManager({
	initialTeams,
	onTeamsChange,
	onTeamSelected,
	onTeamDeleted,
}: UseTeamManagerProps): UseTeamManagerReturn {

	const [teams, setTeams] = useState<Team[]>(initialTeams)
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
	const [teamFormMode, setTeamFormMode] = useState<TeamFormMode>(null)
	const [managingMembersTeamId, setManagingMembersTeamId] = useState<string | null>(null)

	const handleTeamSelect = useCallback((team: Team) => {
		setSelectedTeam(team)
		setTeamFormMode(null)
		setManagingMembersTeamId(null)
		onTeamSelected?.(team)
	}, [onTeamSelected])

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
		setTeams(previous => {
			const updated = [...previous, team]
			onTeamsChange?.(updated)
			return updated
		})
		setSelectedTeam(team)
		setTeamFormMode(null)
		onTeamSelected?.(team)
	}, [onTeamsChange, onTeamSelected])

	const handleTeamUpdated = useCallback((team: Team) => {
		setTeams(previous => {
			const updated = previous.map(existing =>
				existing.id === team.id ? team : existing
			)
			onTeamsChange?.(updated)
			return updated
		})
		setSelectedTeam(current =>
			current?.id === team.id ? team : current
		)
		setTeamFormMode(null)
	}, [onTeamsChange])

	const handleTeamDeleted = useCallback((teamId: string) => {
		setTeams(previous => {
			const updated = previous.filter(team => team.id !== teamId)
			onTeamsChange?.(updated)
			return updated
		})
		setSelectedTeam(current => {
			if (current?.id === teamId) {
				onTeamSelected?.(null)
				return null
			}
			return current
		})
		setTeamFormMode(null)
		setManagingMembersTeamId(null)
		onTeamDeleted?.()
	}, [onTeamsChange, onTeamSelected, onTeamDeleted])

	const handleCancelTeamForm = useCallback(() => {
		setTeamFormMode(null)
	}, [])

	const handleCancelManageMembers = useCallback(() => {
		setManagingMembersTeamId(null)
	}, [])

	const updateTeamsFromResponse = useCallback((receivedTeams: Team[]) => {
		setTeams(receivedTeams)
		onTeamsChange?.(receivedTeams)

		setSelectedTeam(current => {
			if (!current) return null
			const stillExists = receivedTeams.find(team => team.id === current.id)
			if (!stillExists) {
				onTeamSelected?.(null)
				return null
			}
			return stillExists
		})
	}, [onTeamsChange, onTeamSelected])

	const selectFirstAvailableTeam = useCallback(() => {
		setTeams(current => {
			const firstTeam: Team | null = current.length > 0 ? current[0]! : null
			setSelectedTeam(firstTeam)
			onTeamSelected?.(firstTeam)
			return current
		})
	}, [onTeamSelected])

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
