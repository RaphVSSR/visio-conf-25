"use client"
import { useState } from "react"
import styles from "./TeamsList.module.css"
import { Users, Search, Plus, Settings, Lock } from "lucide-react"
import type { Team } from "@/types/Team"
import { useAppContext } from "@/context/AppContext"
import { getTeamPictureUrl } from "@/utils/fileHelpers"

interface TeamsListProps {
  teams: Team[]
  selectedTeam: Team | null
  onSelectTeam: (team: Team) => void
  onCreateTeam: () => void
  onEditTeam: (team: Team) => void
  onManageMembers: (team: Team) => void
  isLoading: boolean
}

export default function TeamsList({
  teams,
  selectedTeam,
  onSelectTeam,
  onCreateTeam,
  onEditTeam,
  onManageMembers,
  isLoading,
}: TeamsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { currentUser } = useAppContext()

  // Filtrer les équipes en fonction du terme de recherche uniquement
  const filteredTeams = teams.filter((team) => team.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Mes équipes</h2>
        <button className={styles.createButton} onClick={onCreateTeam}>
          <Plus size={16} />
        </button>
      </div>

      <div className={styles.searchContainer}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Rechercher une équipe..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.teamsList}>
        {isLoading ? (
          <div className={styles.loading}>Chargement des équipes...</div>
        ) : filteredTeams.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucune équipe trouvée</p>
            <button className={styles.createTeamButton} onClick={onCreateTeam}>
              Créer une équipe
            </button>
          </div>
        ) : (
          filteredTeams.map((team) => {
            const isCreator = team.createdBy === currentUser?._id
            const isAdmin = team.role === "admin" || isCreator

            return (
              <div
                key={team.id}
                className={`${styles.teamItem} ${selectedTeam?.id === team.id ? styles.selected : ""}`}
              >                <div className={styles.teamContent} onClick={() => onSelectTeam(team)}>
                  <div className={styles.teamIcon}>
                    {team.role ? (
                      team.picture && getTeamPictureUrl(team.picture) ? (
                        <img 
                          src={getTeamPictureUrl(team.picture)} 
                          alt={team.name}
                          className={styles.teamImage}
                        />
                      ) : (
                        <Users size={18} />
                      )
                    ) : (
                      <Lock size={18} />
                    )}
                  </div>
                  <div className={styles.teamInfo}>
                    <span className={styles.teamName}>{team.name}</span>
                    {isAdmin && <span className={styles.adminBadge}>Admin</span>}
                    {!team.role && <span className={styles.lockedBadge}>Non membre</span>}
                  </div>
                </div>
                {isAdmin && team.role && (
                  <div className={styles.teamActions}>
                    <button
                      className={styles.teamActionButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditTeam(team)
                      }}
                      title="Modifier l'équipe"
                    >
                      <Settings size={16} />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
