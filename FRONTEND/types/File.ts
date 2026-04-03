import type { Team } from "./Team"

export interface FileItem {
    id: string
    name: string
    type: "file" | "folder"
    size?: number
    mimeType?: string
    extension?: string
    createdAt: string
    updatedAt: string
    parentId?: string | null
    ownerId: string
    shared?: boolean
    sharedWith?: string[]
    sharedWithTeams?: string[] // Array of team IDs the file is shared with
    thumbnail?: string
    owner?: {
        firstname: string
        lastname: string
        picture?: string
    }
}

export interface FileListResponse {
    etat: boolean
    files?: FileItem[]
    error?: string
}

export interface FileUploadResponse {
    etat: boolean
    fileId?: string
    fileName?: string
    signedUrl?: string
    error?: string
}

export interface FileDeleteResponse {
    etat: boolean
    fileId?: string
    error?: string
}

export interface FileMoveResponse {
    etat: boolean
    fileId?: string
    newParentId?: string
    error?: string
}

export interface FileRenameResponse {
    etat: boolean
    fileId?: string
    newName?: string
    error?: string
}

export interface FolderCreateResponse {
    etat: boolean
    folderId?: string
    folderName?: string
    error?: string
}

export interface SharedFilesListResponse {
    etat: boolean
    files?: FileItem[]
    teamId?: string | null
    error?: string
}

export interface FileShareToTeamResponse {
    etat: boolean
    fileId?: string
    teamId?: string
    error?: string
}

export interface ShareToTeamModalProps {
    isOpen: boolean
    file: FileItem | null
    userTeams: Team[]
    onShareToTeam: (fileId: string, teamId: string) => void
    onCloseModal: () => void
}

export type ViewMode = "grid" | "list"
export type SortBy = "name" | "date" | "size" | "type"
export type SortOrder = "asc" | "desc"
