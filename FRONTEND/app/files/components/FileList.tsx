"use client"
import { motion, AnimatePresence } from "framer-motion"
import type { FileItem as FileItemType, ViewMode } from "../../../types/File"
import type { Team } from "../../../types/Team"
import FileItem from "./FileItem"
import { FileListSkeleton } from "./FileSkeleton"
import styles from "./FileList.module.css"

interface FileListProps {
    files: FileItemType[]
    viewMode: ViewMode
    isLoading: boolean
    onOpenFile: (file: FileItemType) => void
    onDeleteFile: (file: FileItemType) => void
    onRenameFile: (file: FileItemType) => void
    onMoveFile: (file: FileItemType) => void
    onShareFile: (file: FileItemType) => void
    userTeams?: Team[]
    onShareToTeam?: (file: FileItemType) => void
    isSharedView?: boolean
}

export default function FileList({
    files,
    viewMode,
    isLoading,
    onOpenFile,
    onDeleteFile,
    onRenameFile,
    onMoveFile,
    onShareFile,
    userTeams = [],
    onShareToTeam,
    isSharedView = false,
}: FileListProps) {
    if (isLoading) {
        return <FileListSkeleton viewMode={viewMode} />
    }

    if (files.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>Aucun fichier.</p>
            </div>
        )
    }

    return (
        <div className={`${styles.fileList} ${styles[viewMode]}`}>
            <AnimatePresence>
                {files.map((file, index) => (
                    <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                        <FileItem
                            file={file}
                            viewMode={viewMode}
                            onOpen={onOpenFile}
                            onDelete={onDeleteFile}
                            onRename={onRenameFile}
                            onMove={onMoveFile}
                            onShare={onShareFile}
                            userTeams={userTeams}
                            onShareToTeam={onShareToTeam}
                            isSharedView={isSharedView}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
