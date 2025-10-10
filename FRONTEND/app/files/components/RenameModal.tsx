"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { motion } from "framer-motion"
import styles from "./Modal.module.css"
import { X } from "lucide-react"
import type { RenameModalProps } from "./ModalTypes"

export default function RenameModal({
    isOpen,
    file,
    onRenameFile,
    onCloseModal,
}: RenameModalProps) {
    const [newName, setNewName] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        if (file) {
            // If it's a file, select just the name part without extension
            if (file.type === "file" && file.extension) {
                const nameWithoutExt = file.name.slice(
                    0,
                    -(file.extension.length + 1)
                )
                setNewName(nameWithoutExt)
            } else {
                setNewName(file.name)
            }
        }
    }, [file])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!newName.trim()) {
            setError("Le nom ne peut pas être vide")
            return
        }

        if (!file) return

        // For files, append the extension back
        let finalName = newName.trim()
        if (file.type === "file" && file.extension) {
            finalName = `${finalName}.${file.extension}`
        }

        onRenameFile(file.id, finalName)
    }

    if (!file) return null

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
                    <h3>
                        Renommer{" "}
                        {file.type === "folder" ? "Dossier" : "Fichier"}
                    </h3>
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
                            <label htmlFor="newName">Nouveau Nom</label>
                            <div className={styles.inputGroup}>
                                <input
                                    type="text"
                                    id="newName"
                                    value={newName}
                                    onChange={(e) => {
                                        setNewName(e.target.value)
                                        setError("")
                                    }}
                                    className={styles.input}
                                    autoFocus
                                />
                                {file.type === "file" && file.extension && (
                                    <span className={styles.inputSuffix}>
                                        .{file.extension}
                                    </span>
                                )}
                            </div>
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
                            Renommer
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
