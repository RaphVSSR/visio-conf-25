"use client"
import { useState } from "react"
import type React from "react"

import { motion } from "framer-motion"
import styles from "./Modal.module.css"
import { X } from "lucide-react"
import type { CreateFolderModalProps } from "./ModalTypes"

export default function CreateFolderModal({
    isOpen,
    onCreateFolder,
    onCloseModal,
}: CreateFolderModalProps) {
    const [folderName, setFolderName] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!folderName.trim()) {
            setError("Le nom du dossier ne peut pas être vide")
            return
        }

        onCreateFolder(folderName.trim())
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
                    <h3>Créer un Nouveau Dossier</h3>
                    <button
                        className={styles.closeButton}
                        onClick={onCloseModal}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        <div className={styles.formGroup}>
                            <label htmlFor="folderName">Nom du Dossier</label>
                            <input
                                type="text"
                                id="folderName"
                                value={folderName}
                                onChange={(e) => {
                                    setFolderName(e.target.value)
                                    setError("")
                                }}
                                className={styles.input}
                                autoFocus
                            />
                            {error && (
                                <p className={styles.errorText}>{error}</p>
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
                        <button type="submit" className={styles.confirmButton}>
                            Créer
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
