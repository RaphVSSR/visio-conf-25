import type { FileItem } from "../../../types/File"

// Serializable props for modals
export type CreateFolderModalProps = {
    isOpen: boolean
    onCreateFolder: (name: string) => void
    onCloseModal: () => void
}

export type RenameModalProps = {
    isOpen: boolean
    file: FileItem | null
    onRenameFile: (fileId: string, newName: string) => void
    onCloseModal: () => void
}

export type DeleteModalProps = {
    isOpen: boolean
    file: FileItem
    onDeleteFile: (fileId: string) => void
    onCloseModal: () => void
}

export type MoveModalProps = {
    isOpen: boolean
    file: FileItem | null
    onMoveFile: (fileId: string, newParentId: string) => void
    onCloseModal: () => void
}

export type ShareModalProps = {
    isOpen: boolean
    file: FileItem | null
    onShareFile: (fileId: string, isPublic: boolean) => void
    onCloseModal: () => void
}
