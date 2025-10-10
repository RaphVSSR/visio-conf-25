"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useAppContext } from "@/context/AppContext"
import { motion } from "framer-motion"
import styles from "./Modal.module.css"
import { X, Folder, ChevronRight, FolderOpen } from "lucide-react"
import type { FileItem } from "../../../types/File"
import type { MoveModalProps } from "./ModalTypes"

export default function MoveFileModal({
    isOpen,
    file,
    onMoveFile,
    onCloseModal,
}: MoveModalProps) {
    const { controleur } = useAppContext()
    const [folders, setFolders] = useState<FileItem[]>([])
    const [selectedFolderId, setSelectedFolderId] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const nomDInstance = "MoveFileModal"
    const verbose = false

    const listeMessageEmis = ["folders_list_request"]
    const listeMessageRecus = ["folders_list_response"]

    const handler = {
        nomDInstance,
        traitementMessage: (msg: any) => {
            if (verbose || controleur?.verboseall) {
                console.log(
                    `INFO: (${nomDInstance}) - traitementMessage - `,
                    msg
                )
            }

            // Handle folders list response
            if (msg.folders_list_response) {
                setIsLoading(false)
                if (!msg.folders_list_response.etat) {
                    setError(
                        `Fetching folders failed: ${msg.folders_list_response.error}`
                    )
                } else {
                    setFolders(msg.folders_list_response.folders || [])
                }
            }
        },
    }

    useEffect(() => {
        if (controleur && isOpen && file) {
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
            fetchFolders()
        }
        return () => {
            if (controleur) {
                controleur.desincription(
                    handler,
                    listeMessageEmis,
                    listeMessageRecus
                )
            }
        }
    }, [controleur, isOpen, file])

    const fetchFolders = () => {
        setIsLoading(true)
        setError(null)
        try {
            const T = {
                folders_list_request: {
                    excludeFolderId:
                        file?.type === "folder" ? file.id : undefined,
                },
            }
            controleur?.envoie(handler, T)
        } catch (err) {
            setError(
                "Échec de la récupération des dossiers. Veuillez réessayer."
            )
            setIsLoading(false)
        }
    }

    const handleFolderClick = (folderId: string) => {
        setSelectedFolderId(folderId)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (file) {
            onMoveFile(file.id, selectedFolderId)
        }
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
                        Déplacer{" "}
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
                        <p>Sélectionnez le dossier de destination :</p>

                        {error && (
                            <div className={styles.errorMessage}>{error}</div>
                        )}

                        <div className={styles.folderList}>
                            <div
                                className={`${styles.folderItem} ${
                                    selectedFolderId === ""
                                        ? styles.selected
                                        : ""
                                }`}
                                onClick={() => handleFolderClick("")}
                            >
                                <FolderOpen size={18} />
                                <span>Accueil (Racine)</span>
                            </div>

                            {isLoading ? (
                                <div className={styles.loading}>
                                    Chargement des dossiers...
                                </div>
                            ) : (
                                folders.map((folder) => (
                                    <div
                                        key={folder.id}
                                        className={`${styles.folderItem} ${
                                            selectedFolderId === folder.id
                                                ? styles.selected
                                                : ""
                                        }`}
                                        onClick={() =>
                                            handleFolderClick(folder.id)
                                        }
                                    >
                                        <Folder size={18} />
                                        <span>{folder.name}</span>
                                        <ChevronRight
                                            size={16}
                                            className={styles.folderItemIcon}
                                        />
                                    </div>
                                ))
                            )}

                            {!isLoading && folders.length === 0 && (
                                <div className={styles.emptyMessage}>
                                    Aucun autre dossier disponible
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
                        <button type="submit" className={styles.confirmButton}>
                            Déplacer
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
