"use client"

import React, { useState, useEffect } from "react"
import { useAppContext } from "@/context/AppContext"
import { X, CirclePlus, Send, Search, Users } from "lucide-react"
import { User } from "@/types/User"
import { getProfilePictureUrl } from "@/utils/fileHelpers"
import { generateUUID } from "@/utils/uuid"
import "./CreateDiscuss.css"

interface CreateDiscussionProps {
    onDiscussionCreated: (discussionUuid?: string) => void
    searchResults: User[]
    controleur: any
    handler: any
}

export const CreateDiscussion: React.FC<CreateDiscussionProps> = ({
    onDiscussionCreated,
    searchResults,
    controleur,
    handler,
}) => {
    const [isCreating, setIsCreating] = useState(false)
    const { currentUser } = useAppContext()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedUsers, setSelectedUsers] = useState<User[]>([])
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    const filteredSearchResults = searchResults.filter((user) => {
        // Compatibilité avec les deux types d'ID
        const currentUserId = currentUser?.id
        const userId = user.id

        const isCurrentUser = userId === currentUserId
        const isAlreadySelected = selectedUsers.some(
            (selectedUser) => selectedUser.id && selectedUser.id === userId
        )

        return !isCurrentUser && !isAlreadySelected
    })
    const searchUsers = (query: string) => {
        if (!query.trim() || !controleur) return
        const message = {
            users_search_request: query,
        }
        controleur.envoie(handler, message)
    }

    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            if (searchQuery.length >= 1) {
                searchUsers(searchQuery)
            }
        }, 300)
        return () => clearTimeout(debounceTimeout)
    }, [searchQuery])

    const handleUserSelect = (user: User) => {
        setSelectedUsers([...selectedUsers, user])
        setSearchQuery("")
    }

    const removeSelectedUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter((user) => user.id !== userId))
    }
    const handleCreateDiscussion = async () => {
        if (!currentUser || selectedUsers.length === 0 || !message.trim()) {
            setError(
                "Veuillez sélectionner au moins un utilisateur et écrire un message"
            )
            return
        }

        try {
            setIsCreating(true)
            setError("") // Effacer les erreurs précédentes

            // Compatibilité avec les deux types d'ID
            const currentUserId = currentUser.email
            const otherUserIds = selectedUsers.map((user) => user.email)

            // Vérification pour les conversations privées (exactement 1 autre utilisateur)
            if (selectedUsers.length === 1) {
                // Demander la liste des discussions existantes pour vérifier s'il existe déjà une conversation
                const userId =
                    currentUser.id || currentUser.uuid || currentUser._id
                const discussListMessage = {
                    discuss_list_request: userId,
                }

                // Créer une promesse pour attendre la réponse de la liste des discussions
                const checkExistingDiscussion = new Promise<boolean>(
                    (resolve) => {
                        const tempHandler = {
                            nomDInstance: "TempCreateDiscussionHandler",
                            traitementMessage: (msg: any) => {
                                if (
                                    msg.discuss_list_response &&
                                    msg.discuss_list_response.etat
                                ) {
                                    const discussions =
                                        msg.discuss_list_response.messages || []

                                    // Vérifier s'il existe déjà une conversation privée avec cet utilisateur
                                    const targetUserEmail =
                                        selectedUsers[0].email
                                    const existingPrivateDiscussion =
                                        discussions.find((discussion: any) => {
                                            // Vérifier que c'est une discussion privée (2 membres exactement)
                                            if (
                                                !discussion.discussion_members ||
                                                discussion.discussion_members
                                                    .length !== 2
                                            ) {
                                                return false
                                            }

                                            // Vérifier que l'utilisateur cible est dans cette discussion
                                            const hasTargetUser =
                                                discussion.discussion_members.some(
                                                    (member: any) =>
                                                        member.email ===
                                                        targetUserEmail
                                                )

                                            // Vérifier que l'utilisateur actuel est aussi dans cette discussion
                                            const hasCurrentUser =
                                                discussion.discussion_members.some(
                                                    (member: any) =>
                                                        member.email ===
                                                        currentUser.email
                                                )

                                            return (
                                                hasTargetUser && hasCurrentUser
                                            )
                                        })

                                    if (existingPrivateDiscussion) {
                                        // Une conversation privée existe déjà
                                        setError(
                                            `Une conversation privée avec ${selectedUsers[0].firstname} ${selectedUsers[0].lastname} existe déjà.`
                                        )
                                        resolve(true) // Conversation existe
                                    } else {
                                        resolve(false) // Pas de conversation existante
                                    }
                                } else {
                                    resolve(false) // Erreur ou pas de réponse, on continue
                                }

                                // Désinscrire le handler temporaire
                                controleur.desincription(
                                    tempHandler,
                                    ["discuss_list_request"],
                                    ["discuss_list_response"]
                                )
                            },
                        }

                        // Inscrire le handler temporaire
                        controleur.inscription(
                            tempHandler,
                            ["discuss_list_request"],
                            ["discuss_list_response"]
                        )
                        controleur.envoie(tempHandler, discussListMessage)
                    }
                )

                // Attendre la vérification
                const conversationExists = await checkExistingDiscussion

                if (conversationExists) {
                    return // Arrêter la création si une conversation existe déjà
                }
            }

            // Si on arrive ici, on peut créer la discussion
            const discussionUuid = generateUUID()

            const message_request = {
                message_send_request: {
                    userEmail: currentUserId,
                    otherUserEmail: otherUserIds,
                    text: message,
                    discussion_creator: currentUserId,
                    discussion_uuid: discussionUuid,
                    message_content: message,
                    message_uuid: generateUUID(),
                    message_date_create: new Date().toISOString(),
                },
            }

            controleur.envoie(handler, message_request)

            onDiscussionCreated(discussionUuid)
            setMessage("")
            setSelectedUsers([])
        } catch (error) {
            console.error("Erreur lors de la création de la discussion:", error)
            setError("Erreur lors de la création de la discussion")
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="create-discussion">
            <div className="create-discussion-header">
                <h2>Nouvelle discussion</h2>
            </div>

            <div className="create-discussion-content">
                <div className="search-users">
                    <h3>Sélectionner les destinataires</h3>

                    {selectedUsers.length > 0 && (
                        <div className="selected-users">
                            {selectedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="selected-user-chip"
                                >
                                    <span>{`${user.firstname} ${user.lastname}`}</span>
                                    <X
                                        size={16}
                                        onClick={() =>
                                            removeSelectedUser(user.id || "")
                                        }
                                        className="remove-user"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher des utilisateurs par nom..."
                            className="search-input"
                        />
                    </div>
                </div>

                {searchQuery && (
                    <div className="search-results">
                        {filteredSearchResults.length > 0 ? (
                            <>
                                <h4>Utilisateurs trouvés</h4>
                                {filteredSearchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserSelect(user)}
                                        className="search-result-item"
                                    >
                                        <div className="user-info">
                                            <img
                                                src={getProfilePictureUrl(
                                                    user.picture
                                                )}
                                                alt=""
                                                className="user-avatar"
                                            />
                                            <div>
                                                <div className="user-name">
                                                    {`${user.firstname} ${user.lastname}`}
                                                </div>
                                                <div className="user-email">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                        <CirclePlus
                                            size={20}
                                            className="add-user"
                                        />
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="empty-state">
                                <Search size={48} />
                                <h3>Aucun utilisateur trouvé</h3>
                                <p>Essayez avec un autre nom ou prénom</p>
                            </div>
                        )}
                    </div>
                )}

                {!searchQuery && selectedUsers.length === 0 && (
                    <div className="search-results">
                        <div className="empty-state">
                            <Users size={48} />
                            <h3>Commencez par rechercher des utilisateurs</h3>
                            <p>
                                Tapez un nom dans le champ de recherche
                                ci-dessus
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="message-input-container">
                <h3>Message initial</h3>
                <div className="message-input">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Écrivez votre premier message..."
                    />
                    {error && <div className="error-message">{error}</div>}{" "}
                    <button
                        onClick={handleCreateDiscussion}
                        disabled={
                            isCreating ||
                            selectedUsers.length === 0 ||
                            !message.trim()
                        }
                        className="create-button"
                    >
                        {isCreating ? (
                            "Création en cours..."
                        ) : (
                            <>
                                <Send size={16} />
                                <span>
                                    {selectedUsers.length === 1
                                        ? "Créer la conversation privée"
                                        : "Créer la discussion de groupe"}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
