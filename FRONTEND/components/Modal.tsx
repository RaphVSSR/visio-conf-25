import React from "react"
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import styles from "./Modal.module.css"

interface ModalProps {
    title: string
    message: string
    type: "success" | "error" | "warning" | "info"
    onClose: () => void
    onConfirm?: () => void
    confirmText?: string
    cancelText?: string
}

export default function Modal({
    title,
    message,
    type,
    onClose,
    onConfirm,
    confirmText = "Confirmer",
    cancelText = "Annuler",
}: ModalProps) {
    const getIcon = () => {
        switch (type) {
            case "success":
                return <CheckCircle className={styles.iconSuccess} size={24} />
            case "error":
                return <AlertCircle className={styles.iconError} size={24} />
            case "warning":
                return (
                    <AlertTriangle className={styles.iconWarning} size={24} />
                )
            case "info":
            default:
                return <Info className={styles.iconInfo} size={24} />
        }
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div
                className={styles.modalContainer}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`${styles.modalHeader} ${styles[type]}`}>
                    <div className={styles.titleContainer}>
                        {getIcon()}
                        <h3 className={styles.modalTitle}>{title}</h3>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>
                <div className={styles.modalContent}>
                    <p>{message}</p>
                </div>
                <div className={styles.modalActions}>
                    {onConfirm && (
                        <>
                            <button
                                className={styles.cancelButton}
                                onClick={onClose}
                            >
                                {cancelText}
                            </button>
                            <button
                                className={`${styles.confirmButton} ${
                                    styles[
                                        `confirm${
                                            type.charAt(0).toUpperCase() +
                                            type.slice(1)
                                        }`
                                    ]
                                }`}
                                onClick={() => {
                                    onConfirm()
                                    onClose()
                                }}
                            >
                                {confirmText}
                            </button>
                        </>
                    )}
                    {!onConfirm && (
                        <button
                            className={`${styles.confirmButton} ${
                                styles[
                                    `confirm${
                                        type.charAt(0).toUpperCase() +
                                        type.slice(1)
                                    }`
                                ]
                            }`}
                            onClick={onClose}
                        >
                            Fermer
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
