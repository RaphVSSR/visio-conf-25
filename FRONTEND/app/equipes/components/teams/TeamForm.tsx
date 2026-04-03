"use client"
import { useState, useEffect } from "react"
import type React from "react"
import styles from "./TeamForm.module.css"
import { useAppContext } from "@/context/AppContext"
import { getProfilePictureUrl, getTeamPictureUrl } from "@/utils/fileHelpers"
import { TeamPictureUploadService } from "@/services/TeamPictureUploadService"
import { Users, X, AlertCircle, Upload, Trash2 } from "lucide-react"
import type { Team, TeamMember } from "@/types/Team"
import type { User } from "@/types/User"
import MemberSelector, { type Member } from "../common/MemberSelector"

interface TeamFormProps {
    onTeamCreated: (team: Team) => void
    onCancel: () => void
    teamToEdit?: Team | null
}

export default function TeamForm({
    onTeamCreated,
    onCancel,
    teamToEdit,
}: TeamFormProps) {
    const { controleur, canal, currentUser } = useAppContext()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [members, setMembers] = useState<Member[]>([])
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [isLoadingUsers, setIsLoadingUsers] = useState(false)
    const [isLoadingMembers, setIsLoadingMembers] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)
    const [teamPicture, setTeamPicture] = useState<string>("")
    const [isUploadingPicture, setIsUploadingPicture] = useState(false)
    const [picturePreview, setPicturePreview] = useState<string>("")

    const nomDInstance = "TeamForm"
    const verbose = false
    const listeMessageEmis = [
        "team_create_request",
        "team_update_request",
        "team_delete_request",
        "users_list_request",
        "team_members_request",
        "team_add_member_request",
        "team_remove_member_request",
    ]
    const listeMessageRecus = [
        "team_create_response",
        "team_update_response",
        "team_delete_response",
        "users_list_response",
        "team_members_response",
        "team_add_member_response",
        "team_remove_member_response",
    ]
    useEffect(() => {
        // Charger tous les utilisateurs pour la sélection des membres
        loadUsers()

        if (teamToEdit) {
            setName(teamToEdit.name || "")
            setDescription(teamToEdit.description || "")
            setTeamPicture(teamToEdit.picture || "")
            setIsEditing(true)
            // Charger les membres de l'équipe après avoir chargé les utilisateurs
            loadTeamMembers(teamToEdit.id)
        } else {
            // Réinitialiser en mode création
            setName("")
            setDescription("")
            setTeamPicture("")
            setIsEditing(false)
        }

        return () => {
            controleur?.desincription(
                handler,
                listeMessageEmis,
                listeMessageRecus
            )
        }
    }, [teamToEdit?.id]) // Utiliser l'ID pour éviter les re-renders inutiles

    const handler = {
        nomDInstance,
        traitementMessage: (msg: any) => {
            if (verbose || controleur?.verboseall)
                console.log(
                    `INFO: (${nomDInstance}) - traitementMessage - `,
                    msg
                )

            if (msg.team_create_response) {
                setIsLoading(false)

                if (msg.team_create_response.etat) {
                    // Passer l'équipe créée et fermer le formulaire
                    onTeamCreated(msg.team_create_response.team)
                } else {
                    setError(
                        msg.team_create_response.error ||
                            "Erreur lors de la création de l'équipe"
                    )
                }
            }

            if (msg.team_update_response) {
                setIsLoading(false)

                if (msg.team_update_response.etat) {
                    // Passer l'équipe mise à jour et fermer le formulaire
                    onTeamCreated(msg.team_update_response.team)
                } else {
                    setError(
                        msg.team_update_response.error ||
                            "Erreur lors de la mise à jour de l'équipe"
                    )
                }
            }

            if (msg.team_delete_response) {
                setIsDeleting(false)

                if (msg.team_delete_response.etat) {
                    // Passer l'équipe supprimée et fermer le formulaire
                    onTeamCreated({
                        ...teamToEdit,
                        deleted: true,
                        id: teamToEdit?.id,
                    } as Team)
                } else {
                    setError(
                        msg.team_delete_response.error ||
                            "Erreur lors de la suppression de l'équipe"
                    )
                }
            }
            if (msg.users_list_response) {
                setIsLoadingUsers(false)

                if (msg.users_list_response.etat) {
                    const users = msg.users_list_response.users || []
                    console.log("TeamForm - Users loaded:", users) // Convertir en format Member avec isSelected = false par défaut
                    const membersConverted: Member[] = users
                        .filter((user: any) => user.id !== currentUser?.id)
                        .map((user: any) => ({
                            id: user.id,
                            firstname: user.firstname,
                            lastname: user.lastname,
                            picture: user.picture,
                            isSelected: false,
                        }))
                    setMembers(membersConverted)
                }
            }
            if (msg.team_members_response) {
                setIsLoadingMembers(false)

                if (msg.team_members_response.etat) {
                    const teamMembersData =
                        msg.team_members_response.members || []
                    setTeamMembers(teamMembersData)

                    // Mettre à jour les membres en marquant ceux de l'équipe comme sélectionnés
                    setMembers((prevMembers) =>
                        prevMembers.map((member) => {
                            return {
                                ...member,
                                isSelected: teamMembersData.some(
                                    (teamMember: any) =>
                                        teamMember.userId === member.id
                                ),
                            }
                        })
                    )
                } else {
                    console.error(
                        "TeamForm - Error loading members:",
                        msg.team_members_response.error
                    )
                }
            }
            if (msg.team_add_member_response) {
                setIsLoading(false)

                if (msg.team_add_member_response.etat) {
                    // Recharger les membres de l'équipe pour mettre à jour teamMembers
                    if (teamToEdit) {
                        loadTeamMembers(teamToEdit.id)
                        setSuccessMessage("Membre ajouté avec succès")
                        setTimeout(() => setSuccessMessage(""), 3000)
                    }
                } else {
                    // En cas d'erreur, remettre l'état précédent
                    const addedUserId = msg.team_add_member_response.userId
                    if (addedUserId) {
                        setMembers((prevMembers) =>
                            prevMembers.map((member) =>
                                member.id === addedUserId
                                    ? { ...member, isSelected: false }
                                    : member
                            )
                        )
                    }
                    setError(
                        msg.team_add_member_response.error ||
                            "Erreur lors de l'ajout du membre"
                    )
                }
            }

            if (msg.team_remove_member_response) {
                setIsLoading(false)

                if (msg.team_remove_member_response.etat) {
                    // Recharger les membres de l'équipe pour mettre à jour teamMembers
                    if (teamToEdit) {
                        loadTeamMembers(teamToEdit.id)
                        setSuccessMessage("Membre retiré avec succès")
                        setTimeout(() => setSuccessMessage(""), 3000)
                    }
                } else {
                    // En cas d'erreur, remettre l'état précédent
                    const removedUserId = msg.team_remove_member_response.userId
                    if (removedUserId) {
                        setMembers((prevMembers) =>
                            prevMembers.map((member) =>
                                member.id === removedUserId
                                    ? { ...member, isSelected: true }
                                    : member
                            )
                        )
                    }
                    setError(
                        msg.team_remove_member_response.error ||
                            "Erreur lors de la suppression du membre"
                    )
                }
            }
        },
    }

    const loadUsers = () => {
        if (controleur && canal) {
            setIsLoadingUsers(true)
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)

            const request = {
                users_list_request: {},
            }
            controleur.envoie(handler, request)
        }
    }

    const loadTeamMembers = (teamId: string) => {
        if (controleur && canal) {
            setIsLoadingMembers(true)
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)

            const request = {
                team_members_request: { teamId },
            }
            controleur.envoie(handler, request)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            setError("Le nom de l'équipe est requis")
            return
        }

        const selectedMemberIds = members
            .filter((member) => member.isSelected)
            .map((member) => member.id)

        if (!isEditing && selectedMemberIds.length === 0) {
            setError(
                "Vous devez sélectionner au moins un membre pour créer une équipe"
            )
            return
        }
        setIsLoading(true)
        setError("")

        controleur?.inscription(handler, listeMessageEmis, listeMessageRecus)

        if (isEditing && teamToEdit) {
            // Mise à jour d'une équipe existante
            const updateRequest = {
                team_update_request: {
                    id: teamToEdit.id,
                    name,
                    description,
                    picture: teamPicture,
                },
            }
            controleur?.envoie(handler, updateRequest)
        } else {
            // Création d'une nouvelle équipe
            const createRequest = {
                team_create_request: {
                    name,
                    description,
                    picture: teamPicture,
                    members: selectedMemberIds,
                },
            }
            controleur?.envoie(handler, createRequest)
        }
    }

    const handleDeleteTeam = () => {
        if (!controleur || !canal || !teamToEdit) return

        setIsDeleting(true)
        setError("")

        const request = {
            team_delete_request: {
                teamId: teamToEdit.id,
            },
        }
        controleur.envoie(handler, request)
    }

    const handleCancel = () => {
        controleur?.desincription(handler, listeMessageEmis, listeMessageRecus)
        onCancel()
    }

    const handleAddMember = (userId: string) => {
        if (!controleur || !canal || !teamToEdit) return

        setIsLoading(true)
        setError("")

        const request = {
            team_add_member_request: {
                teamId: teamToEdit.id,
                userId,
            },
        }
        controleur.envoie(handler, request)
    }

    const handleRemoveMember = (userId: string) => {
        if (!controleur || !canal || !teamToEdit) return // Ne pas permettre de supprimer le dernier admin
        const isLastAdmin =
            userId === currentUser?.id &&
            teamMembers.filter((member) => member.role === "admin").length ===
                1 &&
            teamMembers.find((member) => member.userId === userId)?.role ===
                "admin"

        if (isLastAdmin) {
            setError(
                "Vous ne pouvez pas quitter l'équipe car vous êtes le seul administrateur"
            )
            return
        }
        setIsLoading(true)
        setError("")

        const request = {
            team_remove_member_request: {
                teamId: teamToEdit.id,
                userId,
            },
        }
        controleur.envoie(handler, request)
    } // Nouvelles fonctions simplifiées pour MemberSelector
    const handleMemberToggle = (member: Member) => {
        if (isEditing && teamToEdit) {
            // En mode édition, ajouter/retirer directement du serveur
            if (member.isSelected) {
                // Membre actuellement dans l'équipe, le retirer
                handleRemoveMember(member.id)
                // Mettre à jour immédiatement l'état local pour un feedback visuel
                setMembers((prevMembers) =>
                    prevMembers.map((m) =>
                        m.id === member.id ? { ...m, isSelected: false } : m
                    )
                )
            } else {
                // Membre pas dans l'équipe, l'ajouter
                handleAddMember(member.id)
                // Mettre à jour immédiatement l'état local pour un feedback visuel
                setMembers((prevMembers) =>
                    prevMembers.map((m) =>
                        m.id === member.id ? { ...m, isSelected: true } : m
                    )
                )
            }
        } else {
            // En mode création, simplement toggle l'état
            setMembers((prevMembers) =>
                prevMembers.map((m) =>
                    m.id === member.id ? { ...m, isSelected: !m.isSelected } : m
                )
            )
        }
    }

    const handleSelectAll = () => {
        if (isEditing) {
            // En mode édition, ajouter tous les membres non sélectionnés
            const membersToAdd = members.filter((member) => !member.isSelected)
            membersToAdd.forEach((member) => handleAddMember(member.id))
        } else {
            // En mode création, toggle tous les membres
            const hasUnselected = members.some((member) => !member.isSelected)

            setMembers((prevMembers) =>
                prevMembers.map((member) => ({
                    ...member,
                    isSelected: hasUnselected,
                }))
            )
        }
    } // Calculer les permissions
    const isUserAdmin = teamMembers.some(
        (member) => member.userId === currentUser?.id && member.role === "admin"
    )

    const isCreator = teamToEdit?.createdBy === currentUser?.id

    const canManageMembers = isUserAdmin || isCreator || !isEditing

    const handleTeamPictureUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Veuillez sélectionner un fichier image")
            return
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError("L'image ne doit pas dépasser 5MB")
            return
        }

        setIsUploadingPicture(true)
        setError("")

        try {
            // Create preview
            const reader = new FileReader()
            reader.onload = (e) => {
                setPicturePreview(e.target?.result as string)
            }
            reader.readAsDataURL(file) // Upload the file
            const result = await TeamPictureUploadService.uploadTeamPicture(
                file
            )

            if (result.success && result.filename) {
                setTeamPicture(result.filename)
                setSuccessMessage(
                    "Image uploadée avec succès. Cliquez sur 'Mettre à jour' pour sauvegarder."
                )
                setTimeout(() => setSuccessMessage(""), 5000)
            } else {
                setError(result.error || "Erreur lors de l'upload de l'image")
                setPicturePreview("")
            }
        } catch (error) {
            setError("Erreur lors de l'upload de l'image")
            setPicturePreview("")
            console.error("Team picture upload error:", error)
        } finally {
            setIsUploadingPicture(false)
        }
    }

    const handleRemoveTeamPicture = () => {
        setTeamPicture("")
        setPicturePreview("")

        // Reset file input
        const fileInput = document.getElementById(
            "team-picture-input"
        ) as HTMLInputElement
        if (fileInput) {
            fileInput.value = ""
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <Users size={24} className={styles.icon} />
                    <h2 className={styles.title}>
                        {isEditing
                            ? "Modifier l'équipe"
                            : "Créer une nouvelle équipe"}
                    </h2>
                </div>
                <button
                    className={styles.closeButton}
                    onClick={handleCancel}
                    aria-label="Fermer"
                >
                    <X size={20} />
                </button>
            </div>

            {error && (
                <div className={styles.error}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {successMessage && (
                <div className={styles.success}>{successMessage}</div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="team-name" className={styles.label}>
                        Nom de l'équipe
                    </label>
                    <input
                        id="team-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Marketing, Développement, RH..."
                        className={styles.input}
                        autoFocus
                    />
                </div>{" "}
                <div className={styles.formGroup}>
                    <div className={styles.descriptionAndImageRow}>
                        <div className={styles.descriptionSection}>
                            <label
                                htmlFor="team-description"
                                className={styles.label}
                            >
                                Description (optionnelle)
                            </label>
                            <textarea
                                id="team-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Décrivez brièvement cette équipe..."
                                className={styles.textarea}
                                rows={4}
                            />
                        </div>

                        <div className={styles.imageSection}>
                            <label
                                htmlFor="team-picture"
                                className={styles.label}
                            >
                                Photo de l'équipe
                            </label>
                            <div className={styles.pictureUploadContainer}>
                                {teamPicture || picturePreview ? (
                                    <div className={styles.picturePreview}>
                                        <img
                                            src={
                                                picturePreview ||
                                                getTeamPictureUrl(teamPicture)
                                            }
                                            alt="Aperçu de la photo de l'équipe"
                                            className={styles.pictureImage}
                                        />
                                        <button
                                            type="button"
                                            className={
                                                styles.removePictureButton
                                            }
                                            onClick={handleRemoveTeamPicture}
                                            aria-label="Retirer la photo de l'équipe"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className={styles.picturePlaceholder}>
                                        <Users
                                            size={48}
                                            className={styles.placeholderIcon}
                                        />
                                        <span>Aucune photo</span>
                                    </div>
                                )}
                                <input
                                    id="team-picture-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleTeamPictureUpload}
                                    className={styles.fileInput}
                                    disabled={isUploadingPicture}
                                />
                                <label
                                    htmlFor="team-picture-input"
                                    className={styles.uploadButton}
                                >
                                    {isUploadingPicture ? (
                                        <>
                                            <div
                                                className={styles.buttonSpinner}
                                            ></div>
                                            Chargement...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            {teamPicture
                                                ? "Changer"
                                                : "Ajouter"}{" "}
                                            la photo
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>{" "}
                <div className={styles.formGroup}>
                    <MemberSelector
                        members={members}
                        onMemberToggle={handleMemberToggle}
                        onSelectAll={handleSelectAll}
                        isLoading={isLoadingUsers}
                        searchPlaceholder="Rechercher des utilisateurs..."
                        canManageMembers={canManageMembers}
                        currentUserId={currentUser?.id}
                        selectedMembersTitle={
                            isEditing
                                ? `Membres actuels de l'équipe (${
                                      members.filter((m) => m.isSelected).length
                                  })`
                                : `Membres sélectionnés (${
                                      members.filter((m) => m.isSelected).length
                                  })`
                        }
                        availableMembersTitle={
                            isEditing
                                ? "Ajouter des membres"
                                : "Utilisateurs disponibles"
                        }
                        showSelectedSection={true}
                    />
                </div>
                <div className={styles.formActions}>
                    {isEditing && canManageMembers && (
                        <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => handleDeleteTeam()}
                        >
                            Supprimer l'équipe
                        </button>
                    )}
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={handleCancel}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className={styles.buttonSpinner}></div>
                                {isEditing ? "Mise à jour..." : "Création..."}
                            </>
                        ) : (
                            <>
                                <Users size={18} />
                                {isEditing
                                    ? "Mettre à jour l'équipe"
                                    : "Créer l'équipe"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
