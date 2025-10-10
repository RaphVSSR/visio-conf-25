"use client"
import { useState, useEffect } from "react"
import type React from "react"

import styles from "./ChannelForm.module.css"
import { useAppContext } from "@/context/AppContext"
import { getProfilePictureUrl } from "@/utils/fileHelpers"
import {
    HashIcon,
    Lock,
    Users,
    X,
    Check,
    MessageSquare,
    AlertCircle,
} from "lucide-react"
import type { Team } from "@/types/Team"
import MemberSelector, { type Member } from "../common/MemberSelector"

interface User {
    id: string
    firstname: string
    lastname: string
    picture?: string
}

interface ChannelFormProps {
    onChannelCreated: (channel: any) => void
    onCancel: () => void
    channelToEdit?: any
    team: Team
}

export default function ChannelForm({
    onChannelCreated,
    onCancel,
    channelToEdit,
    team,
}: ChannelFormProps) {
    const { controleur, canal, currentUser } = useAppContext()
    const [name, setName] = useState("")
    const [isPublic, setIsPublic] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [members, setMembers] = useState<Member[]>([])
    const [isEditing, setIsEditing] = useState(false)
    const [isLoadingMembers, setIsLoadingMembers] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const nomDInstance = "ChannelForm"
    const verbose = false

    const listeMessageEmis = [
        "channel_create_request",
        "channel_update_request",
        "channel_delete_request",
        "team_members_request",
        "channel_members_request",
    ]
    const listeMessageRecus = [
        "channel_create_response",
        "channel_update_response",
        "channel_delete_response",
        "team_members_response",
        "channel_members_response",
    ]

    useEffect(() => {
        // Charger tous les membres de l'équipe
        loadTeamMembers()

        if (channelToEdit) {
            setName(channelToEdit.name)
            setIsPublic(channelToEdit.isPublic)
            setIsEditing(true)

            // Récupérer les membres du canal existant si c'est un canal privé
            if (!channelToEdit.isPublic) {
                loadChannelMembers(channelToEdit.id)
            }
        } else {
            // Réinitialiser les valeurs si on crée un nouveau canal
            setName("")
            setIsPublic(true)
            setIsEditing(false)
        }

        return () => {
            controleur?.desincription(
                handler,
                listeMessageEmis,
                listeMessageRecus
            )
        }
    }, [channelToEdit?.id, team.id]) // Dépendances spécifiques pour éviter la récursion

    const handler = {
        nomDInstance,
        traitementMessage: (msg: any) => {
            if (verbose || controleur?.verboseall)
                console.log(
                    `INFO: (${nomDInstance}) - traitementMessage - `,
                    msg
                )

            if (msg.channel_create_response) {
                setIsLoading(false)

                if (msg.channel_create_response.etat) {
                    // Passer le canal créé et fermer le formulaire
                    onChannelCreated(msg.channel_create_response.channel)
                } else {
                    setError(
                        msg.channel_create_response.error ||
                            "Erreur lors de la création du canal"
                    )
                }
            }

            if (msg.channel_update_response) {
                setIsLoading(false)

                if (msg.channel_update_response.etat) {
                    // Passer le canal mis à jour et fermer le formulaire
                    onChannelCreated(msg.channel_update_response.channel)
                } else {
                    setError(
                        msg.channel_update_response.error ||
                            "Erreur lors de la mise à jour du canal"
                    )
                }
            }

            if (msg.channel_delete_response) {
                setIsDeleting(false)

                if (msg.channel_delete_response.etat) {
                    // Passer le canal supprimé et fermer le formulaire
                    onChannelCreated({
                        ...channelToEdit,
                        deleted: true,
                        id: channelToEdit.id,
                    })
                } else {
                    setError(
                        msg.channel_delete_response.error ||
                            "Erreur lors de la suppression du canal"
                    )
                }
            }
            if (msg.team_members_response) {
                setIsLoadingMembers(false)

                if (msg.team_members_response.etat) {
                    const teamMembersData =
                        msg.team_members_response.members || []
                    // Convertir en format Member avec isSelected = false par défaut
                    const membersConverted: Member[] = teamMembersData
                        .filter(
                            (member: any) => member.userId !== currentUser?.id
                        )
                        .map((member: any) => ({
                            id: member.userId,
                            firstname: member.firstname,
                            lastname: member.lastname,
                            picture: member.picture,
                            isSelected: false,
                        }))
                    setMembers(membersConverted)
                }
            }

            if (msg.channel_members_response) {
                if (msg.channel_members_response.etat) {
                    const channelMembersData =
                        msg.channel_members_response.members || []

                    // Mettre à jour les membres en marquant ceux du canal comme sélectionnés
                    setMembers((prevMembers) =>
                        prevMembers.map((member) => ({
                            ...member,
                            isSelected: channelMembersData.some(
                                (channelMember: any) =>
                                    channelMember.userId === member.id
                            ),
                        }))
                    )
                }
            }
        },
    }

    const loadTeamMembers = () => {
        if (controleur && canal) {
            setIsLoadingMembers(true)
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)

            const request = {
                team_members_request: { teamId: team.id },
            }
            controleur.envoie(handler, request)
        }
    }

    const loadChannelMembers = (channelId: string) => {
        if (controleur && canal) {
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)

            const request = {
                channel_members_request: { channelId },
            }
            controleur.envoie(handler, request)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            setError("Le nom du canal est requis")
            return
        }

        const selectedMemberIds = members
            .filter((member) => member.isSelected)
            .map((member) => member.id)

        if (!isPublic && selectedMemberIds.length === 0) {
            setError(
                "Vous devez sélectionner au moins un membre pour un canal privé"
            )
            return
        }

        setIsLoading(true)
        setError("")

        controleur?.inscription(handler, listeMessageEmis, listeMessageRecus)

        if (isEditing) {
            // Mise à jour d'un canal existant
            const updateRequest = {
                channel_update_request: {
                    id: channelToEdit.id,
                    name,
                    isPublic,
                    teamId: team.id,
                    members: !isPublic ? selectedMemberIds : [],
                },
            }
            controleur?.envoie(handler, updateRequest)
        } else {
            // Création d'un nouveau canal
            const createRequest = {
                channel_create_request: {
                    name,
                    isPublic,
                    teamId: team.id,
                    members: !isPublic ? selectedMemberIds : [],
                },
            }
            controleur?.envoie(handler, createRequest)
        }
    }

    const handleDeleteChannel = () => {
        if (!controleur || !canal || !channelToEdit) return

        setIsDeleting(true)
        setError("")

        const request = {
            channel_delete_request: {
                channelId: channelToEdit.id,
            },
        }
        controleur.envoie(handler, request)
    }

    const handleCancel = () => {
        controleur?.desincription(handler, listeMessageEmis, listeMessageRecus)
        onCancel()
    }

    const handleMemberToggle = (member: Member) => {
        setMembers((prevMembers) =>
            prevMembers.map((m) =>
                m.id === member.id ? { ...m, isSelected: !m.isSelected } : m
            )
        )
    }

    const handleSelectAll = () => {
        const hasUnselected = members.some((member) => !member.isSelected)

        setMembers((prevMembers) =>
            prevMembers.map((member) => ({
                ...member,
                isSelected: hasUnselected,
            }))
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <MessageSquare size={24} className={styles.icon} />
                    <h2 className={styles.title}>
                        {isEditing
                            ? "Modifier le canal"
                            : "Créer un nouveau canal"}
                        <span className={styles.teamName}>
                            Équipe: {team.name}
                        </span>
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

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="channel-name" className={styles.label}>
                        Nom du canal
                    </label>
                    <div className={styles.inputWrapper}>
                        <MessageSquare size={18} className={styles.inputIcon} />
                        <input
                            id="channel-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Marketing, Support, Général..."
                            className={styles.input}
                            autoFocus
                        />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Visibilité</label>
                    <div className={styles.visibilityOptions}>
                        <button
                            type="button"
                            className={`${styles.visibilityOption} ${
                                isPublic ? styles.selected : ""
                            }`}
                            onClick={() => setIsPublic(true)}
                        >
                            <HashIcon
                                size={18}
                                className={styles.visibilityIcon}
                            />
                            <div className={styles.optionContent}>
                                <span className={styles.optionTitle}>
                                    Public
                                </span>
                                <span className={styles.optionDescription}>
                                    Tous les membres de l'équipe peuvent voir et
                                    rejoindre ce canal
                                </span>
                            </div>
                            {isPublic && (
                                <Check size={18} className={styles.checkIcon} />
                            )}
                        </button>

                        <button
                            type="button"
                            className={`${styles.visibilityOption} ${
                                !isPublic ? styles.selected : ""
                            }`}
                            onClick={() => setIsPublic(false)}
                        >
                            <Lock size={18} className={styles.visibilityIcon} />
                            <div className={styles.optionContent}>
                                <span className={styles.optionTitle}>
                                    Privé
                                </span>
                                <span className={styles.optionDescription}>
                                    Seuls les membres invités peuvent accéder à
                                    ce canal
                                </span>
                            </div>
                            {!isPublic && (
                                <Check size={18} className={styles.checkIcon} />
                            )}
                        </button>
                    </div>
                </div>{" "}
                {!isPublic && (
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Membres</label>
                        <MemberSelector
                            members={members}
                            onMemberToggle={handleMemberToggle}
                            onSelectAll={handleSelectAll}
                            isLoading={isLoadingMembers}
                            searchPlaceholder="Rechercher des membres..."
                            currentUserId={currentUser?.id}
                            selectedMembersTitle={`Membres sélectionnés (${
                                members.filter((m) => m.isSelected).length
                            })`}
                            availableMembersTitle="Ajouter des membres"
                        />
                    </div>
                )}
                <div className={styles.formActions}>
                    {isEditing && (
                        <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => handleDeleteChannel()}
                        >
                            Supprimer le canal
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
                                    ? "Mettre à jour le canal"
                                    : "Créer le canal"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
