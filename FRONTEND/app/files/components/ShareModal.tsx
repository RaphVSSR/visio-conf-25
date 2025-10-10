"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { motion } from "framer-motion"
import styles from "./Modal.module.css"
import { X, Copy, Check } from "lucide-react"
import type { ShareModalProps } from "./ModalTypes"

export default function ShareModal({
    isOpen,
    file,
    onShareFile,
    onCloseModal,
}: ShareModalProps) {
    const [isPublic, setIsPublic] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (file) {
            setIsPublic(file.shared || false)
        }
    }, [file])

    if (!file) return null

    const shareUrl = `https://example.com/shared/${file.id}`

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onShareFile(file.id, isPublic)
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
                    <h3>Partager {file.name}</h3>
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
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) =>
                                        setIsPublic(e.target.checked)
                                    }
                                    className={styles.checkbox}
                                />
                                <span>
                                    Rendre{" "}
                                    {file.type === "folder"
                                        ? "le dossier"
                                        : "le fichier"}{" "}
                                    public
                                </span>
                            </label>
                        </div>

                        {isPublic && (
                            <div className={styles.shareLink}>
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className={styles.input}
                                />
                                <button
                                    type="button"
                                    className={styles.copyButton}
                                    onClick={handleCopyLink}
                                >
                                    {copied ? (
                                        <Check size={16} />
                                    ) : (
                                        <Copy size={16} />
                                    )}
                                </button>
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
                        <button type="submit" className={styles.confirmButton}>
                            Enregistrer
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
