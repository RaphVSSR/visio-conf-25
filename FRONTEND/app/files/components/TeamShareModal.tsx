"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { motion } from "framer-motion"
import styles from "./Modal.module.css"
import { X, Users, Check } from "lucide-react"
import type { FileItem } from "../../../types/File"
import type { Team } from "../../../types/Team"

interface TeamShareModalProps {
    isOpen: boolean
    file: FileItem | null
    userTeams: Team[]
    onShareToTeam: (fileId: string, teamId: string) => void
    onCloseModal: () => void
}

export default function TeamShareModal({
    isOpen,
    file,
    userTeams,
    onShareToTeam,
    onCloseModal,
}: TeamShareModalProps) {
    const [selectedTeams, setSelectedTeams] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    useEffect(() => {
        if (!isOpen) {
            setSelectedTeams([])
            setIsSubmitting(false)
        } else if (file && file.sharedWithTeams) {
            // Initialize with already shared teams
            setSelectedTeams(file.sharedWithTeams)
        }
    }, [isOpen, file])

    if (!file) return null

    const handleTeamToggle = (teamId: string) => {
        setSelectedTeams((prev) =>
            prev.includes(teamId)
                ? prev.filter((id) => id !== teamId)
                : [...prev, teamId]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedTeams.length === 0) return

        setIsSubmitting(true)
        try {
            // Partager avec chaque équipe sélectionnée
            for (const teamId of selectedTeams) {
                await onShareToTeam(file.id, teamId)
            }
            onCloseModal()
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={onCloseModal}>
            <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h3>Partager "{file.name}" avec des équipes</h3>
                    <button
                        className={styles.closeButton}
                        onClick={onCloseModal}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        <div className={styles.shareInfo}>
                            <p>
                                Sélectionnez les équipes avec lesquelles vous
                                souhaitez partager ce{" "}
                                {file.type === "folder" ? "dossier" : "fichier"}
                                .
                            </p>
                        </div>

                        <div className={styles.formGroup}>
                            {userTeams.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <Users size={24} />
                                    <p>Vous n'êtes membre d'aucune équipe</p>
                                    <span>
                                        Rejoignez une équipe pour partager des
                                        fichiers
                                    </span>
                                </div>
                            ) : (
                                <div className={styles.teamsList}>
                                    {userTeams.map((team) => (
                                        <label
                                            key={team.id}
                                            className={`${styles.teamOption} ${
                                                selectedTeams.includes(team.id)
                                                    ? styles.selected
                                                    : ""
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTeams.includes(
                                                    team.id
                                                )}
                                                onChange={() =>
                                                    handleTeamToggle(team.id)
                                                }
                                                className={styles.checkboxInput}
                                            />
                                            <div className={styles.teamContent}>
                                                <div
                                                    className={styles.teamIcon}
                                                >
                                                    <Users size={16} />
                                                </div>
                                                <div
                                                    className={styles.teamInfo}
                                                >
                                                    <span
                                                        className={
                                                            styles.teamName
                                                        }
                                                    >
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
                                                {selectedTeams.includes(
                                                    team.id
                                                ) && (
                                                    <div
                                                        className={
                                                            styles.checkIcon
                                                        }
                                                    >
                                                        <Check size={16} />
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedTeams.length > 0 && (
                            <div className={styles.selectedCount}>
                                {selectedTeams.length} équipe(s) sélectionnée(s)
                            </div>
                        )}
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onCloseModal}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className={styles.confirmButton}
                            disabled={
                                selectedTeams.length === 0 ||
                                isSubmitting ||
                                userTeams.length === 0
                            }
                        >
                            {isSubmitting
                                ? "Partage..."
                                : `Partager avec ${selectedTeams.length} équipe(s)`}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
