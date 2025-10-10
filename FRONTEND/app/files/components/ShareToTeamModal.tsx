"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { motion } from "framer-motion"
import styles from "./Modal.module.css"
import { X, Users, Check } from "lucide-react"
import type { FileItem } from "../../../types/File"
import type { Team } from "../../../types/Team"

interface ShareToTeamModalProps {
    isOpen: boolean
    file: FileItem | null
    userTeams: Team[]
    onShareToTeam: (fileId: string, teamId: string) => void
    onCloseModal: () => void
}

export default function ShareToTeamModal({
    isOpen,
    file,
    userTeams,
    onShareToTeam,
    onCloseModal,
}: ShareToTeamModalProps) {
    const [selectedTeam, setSelectedTeam] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            setSelectedTeam("")
            setIsSubmitting(false)
        }
    }, [isOpen])

    if (!file) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTeam) return

        setIsSubmitting(true)
        try {
            await onShareToTeam(file.id, selectedTeam)
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
                    <h3>Partager avec une équipe</h3>
                    <button
                        className={styles.closeButton}
                        onClick={onCloseModal}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        <div className={styles.fileInfo}>
                            <p>Partager "{file.name}" avec une équipe</p>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Sélectionnez une équipe
                            </label>

                            {userTeams.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>Vous n'êtes membre d'aucune équipe</p>
                                </div>
                            ) : (
                                <div className={styles.teamsList}>
                                    {userTeams.map((team) => (
                                        <label
                                            key={team.id}
                                            className={`${styles.teamOption} ${
                                                selectedTeam === team.id
                                                    ? styles.selected
                                                    : ""
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="team"
                                                value={team.id}
                                                checked={
                                                    selectedTeam === team.id
                                                }
                                                onChange={(e) =>
                                                    setSelectedTeam(
                                                        e.target.value
                                                    )
                                                }
                                                className={styles.radioInput}
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
                                                {selectedTeam === team.id && (
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
                                !selectedTeam ||
                                isSubmitting ||
                                userTeams.length === 0
                            }
                        >
                            {isSubmitting ? "Partage..." : "Partager"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
