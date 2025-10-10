"use client"
import { motion } from "framer-motion"
import styles from "./Modal.module.css"
import { X, AlertTriangle } from "lucide-react"
import type { FileItem } from "../../../types/File"
import { DeleteModalProps } from "./ModalTypes"

export default function DeleteModal({
    file,
    onCloseModal,
    onDeleteFile,
}: DeleteModalProps) {
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
                        Supprimer{" "}
                        {file.type === "folder" ? "Dossier" : "Fichier"}
                    </h3>
                    <button
                        className={styles.closeButton}
                        onClick={onCloseModal}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.warningMessage}>
                        <AlertTriangle className={styles.warningIcon} />
                        <p>
                            Êtes-vous sûr de vouloir supprimer{" "}
                            <strong>{file.name}</strong> ?
                            {file.type === "folder" &&
                                " Tout le contenu sera supprimé."}
                            <br />
                            Cette action est irréversible.
                        </p>
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
                        type="button"
                        className={`${styles.confirmButton} ${styles.deleteButton}`}
                        onClick={() => onDeleteFile(file.id)}
                    >
                        Supprimer
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
