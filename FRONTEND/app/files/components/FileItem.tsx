import { useState, useEffect, useRef } from "react"
import type React from "react"

import { motion } from "framer-motion"
import type { FileItem as FileItemType } from "../../../types/File"
import type { Team } from "../../../types/Team"
import styles from "./FileItem.module.css"
import {
    File,
    Folder,
    ImageIcon,
    FileText,
    FileCode,
    FileSpreadsheet,
    FileArchive,
    Video,
    Music,
    MoreVertical,
    Download,
    Trash2,
    Edit,
    Share2,
    Move,
} from "lucide-react"
import { formatFileSize, formatDate } from "../../../utils/fileHelpers"
import { useAppContext } from "@/context/AppContext"

interface FileItemProps {
    file: FileItemType
    viewMode: "grid" | "list"
    onOpen: (file: FileItemType) => void
    onDelete: (file: FileItemType) => void
    onRename: (file: FileItemType) => void
    onMove: (file: FileItemType) => void
    onShare: (file: FileItemType) => void
    userTeams?: Team[]
    onShareToTeam?: (file: FileItemType) => void
    isSharedView?: boolean
}

export default function FileItem({
    file,
    viewMode,
    onOpen,
    onDelete,
    onRename,
    onMove,
    onShare,
    isSharedView = false,
}: FileItemProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    const { currentUser } = useAppContext()

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setShowMenu(false)
            }
        }

        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside)
        } else {
            document.removeEventListener("mousedown", handleClickOutside)
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showMenu])
    const downloadFile = async (file: FileItemType) => {
        if (!currentUser) {
            console.error("No current user available to download the file.")
            return
        }
        try {
            // Use cookie for authentication
            const response = await fetch(
                `${
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3220"
                }/api/files/download/${file.id}`,
                {
                    credentials: "include", // Include cookies
                }
            )

            if (!response.ok) {
                throw new Error("Failed to fetch the file")
            }

            const blob = await response.blob()
            const link = document.createElement("a")
            link.href = URL.createObjectURL(blob)
            link.download = file.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
        } catch (error) {
            console.error("Error downloading the file:", error)
        }
    }

    const getFileIcon = () => {
        if (file.type === "folder")
            return <Folder size={viewMode === "grid" ? 40 : 24} />

        const mimeType = file.mimeType || ""
        const extension = file.extension?.toLowerCase() || ""

        if (mimeType.startsWith("image/"))
            return <ImageIcon size={viewMode === "grid" ? 40 : 24} />
        if (mimeType.startsWith("video/"))
            return <Video size={viewMode === "grid" ? 40 : 24} />
        if (mimeType.startsWith("audio/"))
            return <Music size={viewMode === "grid" ? 40 : 24} />

        if (["pdf"].includes(extension))
            return <FileText size={viewMode === "grid" ? 40 : 24} />
        if (["doc", "docx", "txt", "rtf"].includes(extension))
            return <FileText size={viewMode === "grid" ? 40 : 24} />
        if (["xls", "xlsx", "csv"].includes(extension))
            return <FileSpreadsheet size={viewMode === "grid" ? 40 : 24} />
        if (["zip", "rar", "tar", "gz"].includes(extension))
            return <FileArchive size={viewMode === "grid" ? 40 : 24} />
        if (
            ["js", "ts", "html", "css", "py", "java", "php"].includes(extension)
        )
            return <FileCode size={viewMode === "grid" ? 40 : 24} />

        return <File size={viewMode === "grid" ? 40 : 24} />
    }

    const getIconColor = () => {
        if (file.type === "folder") return "#1E3664"

        const extension = file.extension?.toLowerCase() || ""
        const mimeType = file.mimeType || ""

        if (mimeType.startsWith("image/")) return "#EC4899"
        if (mimeType.startsWith("video/")) return "#F59E0B"
        if (mimeType.startsWith("audio/")) return "#8B5CF6"

        if (["pdf"].includes(extension)) return "#EF4444"
        if (["doc", "docx", "txt", "rtf"].includes(extension)) return "#3B82F6"
        if (["xls", "xlsx", "csv"].includes(extension)) return "#10B981"
        if (["zip", "rar", "tar", "gz"].includes(extension)) return "#6B7280"
        if (
            ["js", "ts", "html", "css", "py", "java", "php"].includes(extension)
        )
            return "#F59E0B"

        return "#6B7280"
    }

    // Card animation variants
    const cardVariants = {
        initial: {
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
            backgroundColor: "rgba(249, 250, 251, 1)",
        },
        hover: {
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            backgroundColor: "rgba(249, 250, 251, 1)",
        },
    }

    // Icon animation variants
    const iconVariants = {
        initial: { scale: 1 },
        hover: { scale: 1.05, transition: { type: "spring", stiffness: 300 } },
    }

    const handleClick = () => {
        // Prevent file item click if the menu is open
        if (showMenu) return

        // Ne déclenche onOpen que si c'est un dossier ou une image avec une miniature
        if (
            file.type === "folder" ||
            (file.type === "file" && file.mimeType?.startsWith("image/"))
        ) {
            onOpen(file)
        } else if (file.type === "file") {
            downloadFile(file)
        }
    }

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent triggering the file item's onClick
        setShowMenu(!showMenu)
    }
    const handleActionClick = (e: React.MouseEvent, action: string) => {
        e.stopPropagation() // Prevent triggering the file item's onClick
        setShowMenu(false)

        switch (action) {
            case "delete":
                onDelete(file)
                break
            case "rename":
                onRename(file)
                break
            case "move":
                onMove(file)
                break
            case "share":
                onShare(file)
                break
            case "download":
                if (file.type === "file") downloadFile(file)
                break
        }
    }

    const shouldShowThumbnail =
        file.type === "file" && file.mimeType?.startsWith("image/")
    // Check if current user is the owner of the file
    const isOwner = currentUser && file.ownerId === currentUser.uuid
    // In shared view, disable all modify actions (rename/move) even for owner
    const canModify = !isSharedView && isOwner
    // Allow delete only for owner, regardless of view
    const canDelete = isOwner

    return (
        <motion.div
            className={`${styles.fileItem} ${styles[viewMode]}`}
            variants={cardVariants}
            initial="initial"
            animate={isHovered && !showMenu ? "hover" : "initial"} // Disable hover animation if menu is open
            onClick={!showMenu ? handleClick : undefined} // Disable click if menu is open
            onHoverStart={() => !showMenu && setIsHovered(true)} // Disable hover start if menu is open
            onHoverEnd={() => {
                setIsHovered(false)
                if (!showMenu) setShowMenu(false)
            }}
            whileTap={!showMenu ? { scale: 0.98 } : undefined} // Disable tap animation if menu is open
        >
            <motion.div
                className={styles.iconContainer}
                variants={iconVariants}
                style={{ color: getIconColor() }}
            >
                {" "}
                {shouldShowThumbnail ? (
                    <img
                        src={`${
                            process.env.NEXT_PUBLIC_API_URL ||
                            "http://localhost:3220"
                        }/api/files/view/${file.id}`}
                        alt={file.name}
                        className={styles.thumbnail}
                        onError={(e) => {
                            // Si l'image ne charge pas, remplacer par l'icône de fichier
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            target.parentElement!.innerHTML = `
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                </svg>
                            `
                        }}
                    />
                ) : (
                    getFileIcon()
                )}
            </motion.div>{" "}
            <div className={styles.fileDetails}>
                <motion.div
                    className={styles.fileName}
                    animate={{
                        color: isHovered ? "#1E3664" : "#1f2937",
                    }}
                >
                    <div className={styles.fileNameContainer}>
                        <span className={styles.fileNameText}>{file.name}</span>
                        {/* Sharing indicators next to filename */}
                        {file.shared && (
                            <div className={styles.fileIndicators}>
                                {file.sharedWithTeams &&
                                    file.sharedWithTeams.length > 0 && (
                                        <span
                                            className={
                                                styles.teamSharedIndicator
                                            }
                                            title="Partagé avec équipe(s)"
                                        >
                                            <Share2 size={12} />
                                        </span>
                                    )}
                                {file.sharedWith &&
                                    file.sharedWith.length > 0 && (
                                        <span
                                            className={
                                                styles.publicSharedIndicator
                                            }
                                            title="Partagé publiquement"
                                        >
                                            <Share2 size={12} />
                                        </span>
                                    )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {viewMode === "list" && (
                    <>
                        <div className={styles.fileDate}>
                            {formatDate(file.updatedAt)}
                        </div>
                        {file.type === "file" && file.size && (
                            <div className={styles.fileSize}>
                                {formatFileSize(file.size)}
                            </div>
                        )}
                        {isSharedView && file.owner && (
                            <div className={styles.fileOwner}>
                                Partagé par {file.owner.firstname}{" "}
                                {file.owner.lastname}
                            </div>
                        )}
                    </>
                )}
            </div>
            <motion.div
                className={styles.fileActions}
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered || showMenu ? 1 : 0 }}
                transition={{ duration: 0.2 }}
            >
                <button
                    className={styles.menuButton}
                    onClick={handleMenuClick}
                    aria-label="Plus d'options"
                >
                    <MoreVertical size={18} />
                </button>

                {showMenu && (
                    <motion.div
                        ref={menuRef}
                        className={styles.menuDropdown}
                        style={{ zIndex: 1000 }} // Ensure higher z-index
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {canModify && (
                            <button
                                className={styles.menuItem}
                                onClick={(e) => handleActionClick(e, "rename")}
                            >
                                <Edit size={16} />
                                <span>Renommer</span>
                            </button>
                        )}
                        {file.type === "file" && (
                            <button
                                className={styles.menuItem}
                                onClick={(e) =>
                                    handleActionClick(e, "download")
                                }
                            >
                                <Download size={16} />
                                <span>Télécharger</span>
                            </button>
                        )}
                        {canModify && (
                            <button
                                className={styles.menuItem}
                                onClick={(e) => handleActionClick(e, "move")}
                            >
                                <Move size={16} />
                                <span>Déplacer</span>
                            </button>
                        )}{" "}
                        {canModify && (
                            <button
                                className={styles.menuItem}
                                onClick={(e) => handleActionClick(e, "share")}
                            >
                                <Share2 size={16} />
                                <span>Partager</span>
                            </button>
                        )}
                        {canDelete && (
                            <button
                                className={`${styles.menuItem} ${styles.deleteItem}`}
                                onClick={(e) => handleActionClick(e, "delete")}
                            >
                                <Trash2 size={16} />
                                <span>Supprimer</span>
                            </button>
                        )}
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    )
}
