import { useState, useCallback, useMemo, useRef } from "react"
import type { Team } from "@/types/Team"

interface UseTeamManagerProps {
    initialTeams: Team[]
    onTeamsChange?: (teams: Team[]) => void
    onTeamSelected?: (team: Team | null) => void
    onTeamDeleted?: () => void
}

interface TeamOperations {
    handleTeamSelect: (team: Team) => void
    handleCreateTeam: () => void
    handleEditTeam: (team: Team) => void
    handleManageMembers: (team: Team) => void
    handleTeamCreated: (team: any) => void
    handleTeamDeleted: (deletedTeamId: string) => void
    handleCancelTeamForm: () => void
    updateTeamsFromResponse: (teamsFromResponse: Team[]) => void
    selectFirstAvailableTeam: () => void
}

interface TeamState {
    teams: Team[]
    selectedTeam: Team | null
    showTeamForm: boolean
    teamToEdit: Team | null
}

export const useTeamManager = ({
    initialTeams,
    onTeamsChange,
    onTeamSelected,
    onTeamDeleted,
}: UseTeamManagerProps): TeamState & TeamOperations => {
    const [teams, setTeams] = useState<Team[]>(initialTeams)
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    const [showTeamForm, setShowTeamForm] = useState(false)
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null)

    // Référence pour empêcher la sélection automatique après création/modification
    const preserveSelectionRef = useRef<string | null>(null)

    // Update teams and notify parent component
    const updateTeams = useCallback(
        (newTeams: Team[]) => {
            setTeams(newTeams)
            onTeamsChange?.(newTeams)
        },
        [onTeamsChange]
    )

    // Update selected team and notify parent
    const updateSelectedTeam = useCallback(
        (team: Team | null) => {
            setSelectedTeam(team)
            onTeamSelected?.(team)
        },
        [onTeamSelected]
    )

    // Memoized operations to avoid unnecessary re-renders
    const operations = useMemo(
        (): TeamOperations => ({
            handleTeamSelect: (team: Team) => {
                // Check if user is member of the team
                if (!team.role) {
                    alert(
                        "Vous n'êtes pas membre de cette équipe. Contactez un administrateur pour y être ajouté."
                    )
                    return
                }

                updateSelectedTeam(team)
                setShowTeamForm(false)
            },

            handleCreateTeam: () => {
                setTeamToEdit(null)
                setShowTeamForm(true)
            },

            handleEditTeam: (team: Team) => {
                setTeamToEdit(team)
                setShowTeamForm(true)
            },

            handleManageMembers: (team: Team) => {
                setTeamToEdit(team)
                setShowTeamForm(true)
            },

            handleTeamCreated: (team: any) => {
                if (team.deleted) {
                    operations.handleTeamDeleted(team.id)
                    return
                }

                // Marquer cette équipe pour préserver sa sélection
                preserveSelectionRef.current = team.id

                setTeams((prevTeams) => {
                    const existingIndex = prevTeams.findIndex(
                        (t) => t.id === team.id
                    )
                    const newTeams =
                        existingIndex >= 0
                            ? prevTeams.map((t, i) =>
                                  i === existingIndex ? team : t
                              )
                            : [...prevTeams, team]

                    onTeamsChange?.(newTeams)
                    return newTeams
                })

                // Toujours sélectionner l'équipe créée/modifiée
                updateSelectedTeam(team)
                setShowTeamForm(false)
                setTeamToEdit(null)
            },

            handleTeamDeleted: (deletedTeamId: string) => {
                // Réinitialiser la préservation de sélection
                preserveSelectionRef.current = null

                setTeams((prevTeams) => {
                    const updatedTeams = prevTeams.filter(
                        (t) => t.id !== deletedTeamId
                    )

                    // Auto-select another team if deleted one was selected
                    if (selectedTeam?.id === deletedTeamId) {
                        // Find first team where user is a member
                        const memberTeams = updatedTeams.filter(
                            (team) => team.role
                        )
                        const newSelectedTeam =
                            memberTeams.length > 0 ? memberTeams[0] : null
                        updateSelectedTeam(newSelectedTeam)
                    }

                    onTeamsChange?.(updatedTeams)
                    return updatedTeams
                })

                // Toujours fermer le formulaire après suppression
                setShowTeamForm(false)
                setTeamToEdit(null)

                // Notify parent that team was deleted to close any forms
                onTeamDeleted?.()
            },

            handleCancelTeamForm: () => {
                // Toujours fermer le formulaire lors de l'annulation
                setShowTeamForm(false)
                setTeamToEdit(null)
            },

            updateTeamsFromResponse: (teamsFromResponse: Team[]) => {
                updateTeams(teamsFromResponse)

                // Vérifier si on doit préserver une équipe spécifique
                if (preserveSelectionRef.current) {
                    const teamToPreserve = teamsFromResponse.find(
                        (team) => team.id === preserveSelectionRef.current
                    )
                    if (teamToPreserve) {
                        updateSelectedTeam(teamToPreserve)
                        // Réinitialiser après avoir trouvé et sélectionné l'équipe
                        preserveSelectionRef.current = null
                        return
                    }
                    // Si l'équipe à préserver n'existe plus, réinitialiser
                    preserveSelectionRef.current = null
                }

                // Ne pas auto-sélectionner si une équipe est déjà sélectionnée
                // Seulement auto-sélectionner si aucune équipe n'est sélectionnée
                if (!selectedTeam && teamsFromResponse.length > 0) {
                    const memberTeams = teamsFromResponse.filter(
                        (team) => team.role
                    )
                    if (memberTeams.length > 0) {
                        updateSelectedTeam(memberTeams[0])
                    }
                } else if (selectedTeam) {
                    // Si une équipe était déjà sélectionnée, vérifier qu'elle existe toujours
                    const stillExists = teamsFromResponse.find(
                        (team) => team.id === selectedTeam.id
                    )
                    if (stillExists) {
                        // Mettre à jour avec les nouvelles données de l'équipe
                        updateSelectedTeam(stillExists)
                    } else {
                        // Si l'équipe sélectionnée n'existe plus, en sélectionner une autre
                        const memberTeams = teamsFromResponse.filter(
                            (team) => team.role
                        )
                        const newSelectedTeam =
                            memberTeams.length > 0 ? memberTeams[0] : null
                        updateSelectedTeam(newSelectedTeam)
                    }
                }
            },

            selectFirstAvailableTeam: () => {
                const memberTeams = teams.filter((team) => team.role)
                if (memberTeams.length > 0 && !selectedTeam) {
                    updateSelectedTeam(memberTeams[0])
                }
            },
        }),
        [
            teams,
            selectedTeam,
            onTeamsChange,
            onTeamSelected,
            updateSelectedTeam,
            onTeamDeleted,
        ]
    )

    return {
        teams,
        selectedTeam,
        showTeamForm,
        teamToEdit,
        ...operations,
    }
}

export default useTeamManager
