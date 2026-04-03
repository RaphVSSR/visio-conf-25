"use client"
import { useState } from "react"
import styles from "./TeamSelector.module.css"
import { Users, ChevronDown, Check } from "lucide-react"
import type { Team } from "../../../types/Team"

interface TeamSelectorProps {
    teams: Team[]
    selectedTeam: Team | null
    onTeamSelect: (team: Team | null) => void
    isLoading: boolean
}

export default function TeamSelector({
    teams,
    selectedTeam,
    onTeamSelect,
    isLoading,
}: TeamSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleTeamSelect = (team: Team | null) => {
        onTeamSelect(team)
        setIsOpen(false)
    }

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Chargement des équipes...</div>
            </div>
        )
    }

    if (teams.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <Users size={24} />
                    <p>Vous n'êtes membre d'aucune équipe</p>
                    <span>
                        Rejoignez une équipe pour voir les fichiers partagés
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.selectorWrapper}>
                <button
                    className={styles.selector}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                >
                    <div className={styles.selectedTeam}>
                        <Users size={18} />
                        <span>
                            {selectedTeam
                                ? selectedTeam.name
                                : "Toutes les équipes"}
                        </span>
                    </div>
                    <ChevronDown
                        size={16}
                        className={`${styles.chevron} ${
                            isOpen ? styles.rotated : ""
                        }`}
                    />
                </button>

                {isOpen && (
                    <div className={styles.dropdown}>
                        <button
                            className={`${styles.dropdownItem} ${
                                !selectedTeam ? styles.active : ""
                            }`}
                            onClick={() => handleTeamSelect(null)}
                        >
                            <div className={styles.teamContent}>
                                <Users size={16} />
                                <span>Toutes les équipes</span>
                            </div>
                            {!selectedTeam && (
                                <Check size={16} className={styles.checkIcon} />
                            )}
                        </button>

                        <div className={styles.divider}></div>

                        {teams.map((team) => (
                            <button
                                key={team.id}
                                className={`${styles.dropdownItem} ${
                                    selectedTeam?.id === team.id
                                        ? styles.active
                                        : ""
                                }`}
                                onClick={() => handleTeamSelect(team)}
                            >
                                <div className={styles.teamContent}>
                                    <Users size={16} />
                                    <div className={styles.teamInfo}>
                                        <span className={styles.teamName}>
                                            {team.name}
                                        </span>
                                        {team.description && (
                                            <span
                                                className={
                                                    styles.teamDescription
                                                }
                                            >
                                                {team.description}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {selectedTeam?.id === team.id && (
                                    <Check
                                        size={16}
                                        className={styles.checkIcon}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
