"use client"
import { useState, useEffect, useRef } from "react"
import FileExplorer from "./FileExplorer"
import TeamSelector from "./TeamSelector"
import { useAppContext } from "../../../context/AppContext"
import type { FileItem } from "../../../types/File"
import type { Team } from "../../../types/Team"
import styles from "./TabbedFileExplorer.module.css"

export default function TabbedFileExplorer() {
    const { controleur, canal, currentUser } = useAppContext()
    const [activeTab, setActiveTab] = useState<"personal" | "shared">(
        "personal"
    )
    const [selectedTeamId, setSelectedTeamId] = useState<string>("")

    // State for files and UI
    const [files, setFiles] = useState<FileItem[]>([])
    const [sharedFiles, setSharedFiles] = useState<FileItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSharedLoading, setIsSharedLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentPath, setCurrentPath] = useState<
        { id?: string; name: string }[]
    >([{ name: "Mes fichiers" }])
    const [userTeams, setUserTeams] = useState<Team[]>([])
    const [isTeamsLoading, setIsTeamsLoading] = useState(false) // Refs
    const isInitialMount = useRef(true)

    // Message handlers
    const listeMessageEmis = [
        "files_list_request",
        "shared_files_list_request",
        "teams_list_request",
        "file_delete_request",
        "file_rename_request",
        "file_move_request",
        "file_share_to_team_request",
        "folder_create_request",
        "folders_list_request",
    ]

    const listeMessageRecus = [
        "files_list_response",
        "shared_files_list_response",
        "teams_list_response",
        "file_delete_response",
        "file_rename_response",
        "file_move_response",
        "file_share_to_team_response",
        "folder_create_response",
        "folders_list_response",
    ]

    const handler = {
        nomDInstance: "TabbedFileExplorer",
        traitementMessage: (msg: any) => {
            console.log("TabbedFileExplorer received message:", msg)

            // Handle files list response
            if (msg.files_list_response) {
                setIsLoading(false)
                if (msg.files_list_response.etat) {
                    setFiles(msg.files_list_response.files || [])
                    setError(null)
                } else {
                    setError(
                        `Échec de la récupération des fichiers: ${msg.files_list_response.error}`
                    )
                }
            }

            // Handle shared files list response
            if (msg.shared_files_list_response) {
                setIsSharedLoading(false)
                if (msg.shared_files_list_response.etat) {
                    setSharedFiles(msg.shared_files_list_response.files || [])
                    setError(null)
                } else {
                    setError(
                        `Échec de la récupération des fichiers partagés: ${msg.shared_files_list_response.error}`
                    )
                }
            }

            // Handle teams list response
            if (msg.teams_list_response) {
                setIsTeamsLoading(false)
                if (msg.teams_list_response.etat) {
                    setUserTeams(msg.teams_list_response.teams || [])
                } else {
                    setError(
                        `Échec de la récupération des équipes: ${msg.teams_list_response.error}`
                    )
                }
            }

            // Handle other responses
            if (msg.file_delete_response && msg.file_delete_response.etat) {
                fetchFiles(currentPath[currentPath.length - 1]?.id)
            }
            if (msg.file_rename_response && msg.file_rename_response.etat) {
                fetchFiles(currentPath[currentPath.length - 1]?.id)
            }
            if (msg.file_move_response && msg.file_move_response.etat) {
                fetchFiles(currentPath[currentPath.length - 1]?.id)
            }
            if (
                msg.file_share_to_team_response &&
                msg.file_share_to_team_response.etat
            ) {
                fetchFiles(currentPath[currentPath.length - 1]?.id)
            }
            if (msg.folder_create_response && msg.folder_create_response.etat) {
                fetchFiles(currentPath[currentPath.length - 1]?.id)
            }
        },
    } // Initialize handler and fetch initial data
    useEffect(() => {
        if (controleur && canal && currentUser) {
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)

            // Fetch initial data only when user is authenticated
            if (isInitialMount.current) {
                setTimeout(() => {
                    fetchFiles()
                    fetchTeams()
                }, 200) // Slightly longer delay to ensure authentication is complete
                isInitialMount.current = false
            }
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
    }, [controleur, canal, currentUser]) // Add currentUser as dependency    // File management functions
    const fetchFiles = (folderId?: string) => {
        if (!controleur || !currentUser) return

        setIsLoading(true)
        setError(null)

        try {
            const message = { files_list_request: { folderId } }
            controleur.envoie(handler, message)
        } catch (err) {
            setError(
                "Échec de la récupération des fichiers. Veuillez réessayer."
            )
            setIsLoading(false)
        }
    }

    const fetchSharedFiles = (teamId?: string) => {
        if (!controleur || !currentUser) return

        setIsSharedLoading(true)
        setError(null)

        try {
            const message = { shared_files_list_request: { teamId } }
            controleur.envoie(handler, message)
        } catch (err) {
            setError(
                "Échec de la récupération des fichiers partagés. Veuillez réessayer."
            )
            setIsSharedLoading(false)
        }
    }

    const fetchTeams = () => {
        if (!controleur || !currentUser) return

        setIsTeamsLoading(true)
        try {
            const message = { teams_list_request: {} }
            controleur.envoie(handler, message)
        } catch (err) {
            setError("Échec de la récupération des équipes.")
            setIsTeamsLoading(false)
        }
    }

    const navigateToFolder = (folderId?: string, folderName?: string) => {
        if (folderId && folderName) {
            setCurrentPath((prev) => [
                ...prev,
                { id: folderId, name: folderName },
            ])
        }
        fetchFiles(folderId)
    }

    const navigateBack = () => {
        if (currentPath.length > 1) {
            const newPath = currentPath.slice(0, -1)
            setCurrentPath(newPath)
            fetchFiles(newPath[newPath.length - 1]?.id)
        }
    }

    const navigateToPath = (index: number) => {
        if (index === -1) {
            // Navigate to root
            setCurrentPath([{ name: "Mes fichiers" }])
            fetchFiles()
        } else {
            // Navigate to specific path index
            const newPath = currentPath.slice(0, index + 1)
            setCurrentPath(newPath)
            fetchFiles(newPath[newPath.length - 1]?.id)
        }
    }

    const createFolder = (name: string) => {
        if (!controleur) return

        try {
            const message = {
                folder_create_request: {
                    name,
                    parentId:
                        currentPath.length > 1
                            ? currentPath[currentPath.length - 1].id
                            : undefined,
                },
            }
            controleur.envoie(handler, message)
        } catch (err) {
            setError("Échec de la création du dossier. Veuillez réessayer.")
        }
    }

    const uploadFile = async (file: File) => {
        if (!currentUser) {
            setError("Utilisateur non connecté")
            return
        }

        try {
            const formData = new FormData()
            formData.append("file", file)

            // Add parent folder ID if we're inside a folder
            const parentId =
                currentPath.length > 1
                    ? currentPath[currentPath.length - 1].id
                    : undefined

            if (parentId) {
                formData.append("parentId", parentId)
            }
            const response = await fetch(
                `${
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3220"
                }/api/files/upload`,
                {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                }
            )

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                // Refresh the file list
                fetchFiles(currentPath[currentPath.length - 1]?.id)
            } else {
                setError(result.error || "Erreur lors de l'upload")
            }
        } catch (err) {
            console.error("Upload error:", err)
            setError("Échec du téléversement du fichier. Veuillez réessayer.")
        }
    }

    const deleteFile = (fileId: string) => {
        if (!controleur) return // Check if user is owner of the file
        const file =
            files.find((f) => f.id === fileId) ||
            sharedFiles.find((f) => f.id === fileId)
        if (file && currentUser && file.ownerId !== currentUser.uuid) {
            setError("Vous n'avez pas l'autorisation de supprimer ce fichier.")
            return
        }

        try {
            const message = { file_delete_request: { fileId } }
            controleur.envoie(handler, message)
        } catch (err) {
            setError("Échec de la suppression du fichier. Veuillez réessayer.")
        }
    }

    const renameFile = (fileId: string, newName: string) => {
        if (!controleur) return // Check if user is owner of the file
        const file =
            files.find((f) => f.id === fileId) ||
            sharedFiles.find((f) => f.id === fileId)
        if (file && currentUser && file.ownerId !== currentUser.uuid) {
            setError("Vous n'avez pas l'autorisation de renommer ce fichier.")
            return
        }

        try {
            const message = { file_rename_request: { fileId, newName } }
            controleur.envoie(handler, message)
        } catch (err) {
            setError("Échec du renommage du fichier. Veuillez réessayer.")
        }
    }

    const moveFile = (fileId: string, newParentId: string) => {
        if (!controleur) return // Check if user is owner of the file
        const file =
            files.find((f) => f.id === fileId) ||
            sharedFiles.find((f) => f.id === fileId)
        if (file && currentUser && file.ownerId !== currentUser.uuid) {
            setError("Vous n'avez pas l'autorisation de déplacer ce fichier.")
            return
        }

        try {
            const message = { file_move_request: { fileId, newParentId } }
            controleur.envoie(handler, message)
        } catch (err) {
            setError("Échec du déplacement du fichier. Veuillez réessayer.")
        }
    }

    const shareToTeam = (fileId: string, teamId: string) => {
        if (!controleur) return // Check if user is owner of the file
        const file =
            files.find((f) => f.id === fileId) ||
            sharedFiles.find((f) => f.id === fileId)
        console.log("file:", file, "currentUser:", currentUser)
        if (file && currentUser && file.ownerId !== currentUser.uuid) {
            setError("Vous n'avez pas l'autorisation de partager ce fichier.")
            return
        }

        try {
            const message = { file_share_to_team_request: { fileId, teamId } }
            controleur.envoie(handler, message)
        } catch (err) {
            setError(
                "Échec du partage du fichier à l'équipe. Veuillez réessayer."
            )
        }
    }

    const clearError = () => {
        setError(null)
    }

    const handleTabChange = (tab: "personal" | "shared") => {
        setActiveTab(tab)
        if (tab === "shared") {
            fetchSharedFiles(selectedTeamId || undefined)
        } else if (tab === "personal") {
            fetchFiles()
        }
    }

    const handleTeamFilter = (teamId: string) => {
        setSelectedTeamId(teamId)
        fetchSharedFiles(teamId || undefined)
    }

    const handleOpenFile = (file: any) => {
        if (file.type === "folder") {
            navigateToFolder(file.id, file.name)
        }
    }

    const handleNavigate = (folderId?: string) => {
        if (folderId) {
            // Find folder name from files
            const folder = files.find((f) => f.id === folderId)
            if (folder) {
                navigateToFolder(folderId, folder.name)
            }
        } else {
            // Navigate to root
            setCurrentPath([{ name: "Mes fichiers" }])
            fetchFiles()
        }
        // Refresh files after navigation
        setTimeout(() => fetchFiles(folderId), 100)
    }

    return (
        <div className={styles.container}>
            {error && (
                <div className={styles.errorBanner}>
                    <span>{error}</span>
                    <button onClick={clearError} className={styles.closeButton}>
                        ×
                    </button>
                </div>
            )}

            <div className={styles.tabContainer}>
                {" "}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${
                            activeTab === "personal" ? styles.active : ""
                        }`}
                        onClick={() => handleTabChange("personal")}
                    >
                        Mes fichiers
                    </button>{" "}
                    <button
                        className={`${styles.tab} ${
                            activeTab === "shared" ? styles.active : ""
                        }`}
                        onClick={() => handleTabChange("shared")}
                    >
                        Fichiers partagés
                    </button>
                </div>
                {activeTab === "shared" && (
                    <div className={styles.teamFilterContainer}>
                        <TeamSelector
                            teams={userTeams}
                            selectedTeam={
                                userTeams.find(
                                    (t) => t.id === selectedTeamId
                                ) || null
                            }
                            onTeamSelect={(team) =>
                                handleTeamFilter(team?.id || "")
                            }
                            isLoading={isTeamsLoading}
                        />
                    </div>
                )}
            </div>

            <div className={styles.content}>
                {activeTab === "personal" ? (
                    <FileExplorer
                        files={files}
                        currentPath={currentPath}
                        isLoading={isLoading}
                        onFetchFiles={fetchFiles}
                        onCreateFolder={createFolder}
                        onUploadFile={uploadFile}
                        onDeleteFile={deleteFile}
                        onRenameFile={renameFile}
                        onMoveFile={moveFile}
                        onNavigate={handleNavigate}
                        onNavigateToPath={navigateToPath}
                        userTeams={userTeams}
                        onShareToTeam={shareToTeam}
                        showUploadActions={true}
                        isSharedView={false}
                    />
                ) : (
                    <FileExplorer
                        files={sharedFiles}
                        currentPath={[]}
                        isLoading={isSharedLoading}
                        onFetchFiles={() =>
                            fetchSharedFiles(selectedTeamId || undefined)
                        }
                        onCreateFolder={() => {}} // Disabled for shared view
                        onUploadFile={() => {}} // Disabled for shared view
                        onDeleteFile={(fileId: string) => {
                            // Only allow if user is owner
                            const file = sharedFiles.find(
                                (f) => f.id === fileId
                            )
                            if (
                                file &&
                                currentUser &&
                                file.ownerId === currentUser._id
                            ) {
                                deleteFile(fileId)
                            }
                        }}
                        onRenameFile={(fileId: string, newName: string) => {
                            // Only allow if user is owner
                            const file = sharedFiles.find(
                                (f) => f.id === fileId
                            )
                            if (
                                file &&
                                currentUser &&
                                file.ownerId === currentUser._id
                            ) {
                                renameFile(fileId, newName)
                            }
                        }}
                        onMoveFile={(fileId: string, newParentId: string) => {
                            // Only allow if user is owner
                            const file = sharedFiles.find(
                                (f) => f.id === fileId
                            )
                            if (
                                file &&
                                currentUser &&
                                file.ownerId === currentUser._id
                            ) {
                                moveFile(fileId, newParentId)
                            }
                        }}
                        onNavigate={handleOpenFile}
                        userTeams={userTeams}
                        onShareToTeam={(fileId: string, teamId: string) => {
                            // Only allow if user is owner
                            const file = sharedFiles.find(
                                (f) => f.id === fileId
                            )
                            if (
                                file &&
                                currentUser &&
                                file.ownerId === currentUser._id
                            ) {
                                shareToTeam(fileId, teamId)
                            }
                        }}
                        showUploadActions={false}
                        isSharedView={true}
                    />
                )}
            </div>
        </div>
    )
}
