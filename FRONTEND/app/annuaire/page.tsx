"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import styles from "./page.module.css"
import UsersList from "../../components/UsersList"
import type { User } from "../../types/User"
import { useAppContext } from "@/context/AppContext"
import { motion } from "framer-motion"
import { Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

export default function AnnuairePage() {
    const { controleur, canal, currentUser } = useAppContext()
    const router = useRouter()

    const nomDInstance = "AnnuairePage"
    const verbose = true

    const listeMessageEmis = [
        "users_list_request",
        "discuss_list_request",
        "message_send_request",
    ]
    const listeMessageRecus = [
        "users_list_response",
        "discuss_list_response",
        "message_send_response",
    ]

    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Utiliser useRef pour persister targetUser entre les re-renders
    const targetUserRef = useRef<User | null>(null)
    const createdDiscussionUuidRef = useRef<string | null>(null)

    const handleMessageUser = useCallback(
        (user: User) => {
            if (!currentUser) {
                console.log("❌ Pas d'utilisateur connecté")
                return
            }

            console.log(
                "🚀 Démarrage d'une conversation avec:",
                user.firstname,
                user.lastname
            )

            // Stocker l'utilisateur cible dans la ref
            targetUserRef.current = user

            // Utiliser l'UUID de l'utilisateur actuel
            const userIdentifier =
                currentUser.uuid || currentUser.id || currentUser._id
            const discussListRequest = { discuss_list_request: userIdentifier }

            console.log(
                "📋 Requête discuss_list avec identifiant:",
                userIdentifier
            )
            controleur?.envoie(handler, discussListRequest)
        },
        [currentUser, controleur]
    )

    const createNewDiscussion = useCallback(
        (user: User) => {
            if (!currentUser) return

            const discussionUuid = uuidv4()
            const messageUuid = uuidv4()

            console.log(
                "✨ Création d'une nouvelle discussion avec:",
                user.firstname,
                user.lastname
            )
            console.log("🆔 UUID de discussion généré:", discussionUuid)

            // Stocker l'UUID généré pour pouvoir l'utiliser plus tard
            createdDiscussionUuidRef.current = discussionUuid

            const message = {
                message_send_request: {
                    userEmail: currentUser.email,
                    otherUserEmail: [user.email],
                    discussion_uuid: discussionUuid,
                    message_uuid: messageUuid,
                    message_content: "Bonjour !",
                    message_date_create: new Date().toISOString(),
                },
            }

            console.log("📤 Message de création envoyé")
            controleur?.envoie(handler, message)

            // Forcer la redirection après un court délai, sans attendre la réponse
            setTimeout(() => {
                console.log("⏱️ Redirection forcée après délai")
                console.log(
                    "🚀 Redirection vers:",
                    `/discussion?id=${discussionUuid}`
                )
                router.push(`/discussion?id=${discussionUuid}`)
            }, 1000)
        },
        [currentUser, controleur, router]
    ) // Créer le handler avec useMemo pour éviter les re-créations
    const handler = useMemo(
        () => ({
            nomDInstance,
            traitementMessage: (msg: any) => {
                console.log(`🔔 Message reçu dans ${nomDInstance}:`, msg)

                if (msg.users_list_response) {
                    setIsLoading(false)
                    if (!msg.users_list_response.etat) {
                        console.log(
                            `❌ Fetching users failed: ${msg.users_list_response.error}`
                        )
                    } else {
                        setUsers(msg.users_list_response.users || [])
                    }
                    return
                }

                if (msg.discuss_list_response) {
                    console.log("📋 Réponse discuss_list reçue")
                    const targetUser = targetUserRef.current
                    console.log(
                        "🎯 TargetUser au moment du traitement:",
                        targetUser
                    )

                    if (!targetUser) {
                        console.log(
                            "⚠️ Pas de targetUser défini, abandon du traitement"
                        )
                        return
                    }

                    if (msg.discuss_list_response.etat) {
                        const discussions =
                            msg.discuss_list_response.messages || []
                        console.log(
                            "💬 Nombre de discussions trouvées:",
                            discussions.length
                        )

                        // Chercher si une discussion existe déjà EXACTEMENT avec l'utilisateur cible
                        let existingDiscussion = null

                        for (let i = 0; i < discussions.length; i++) {
                            const disc = discussions[i]

                            // Vérifier si c'est une discussion à deux personnes
                            if (disc.discussion_members.length !== 2) {
                                continue
                            }

                            // Vérifier si l'utilisateur actuel est dans cette discussion
                            const currentUserInDiscussion =
                                disc.discussion_members.some(
                                    (member: any) =>
                                        member.email === currentUser?.email ||
                                        member._id === currentUser?._id ||
                                        member.id === currentUser?.id
                                )

                            if (!currentUserInDiscussion) {
                                continue
                            }

                            // Vérifier si l'utilisateur cible est dans cette discussion
                            const targetUserInDiscussion =
                                disc.discussion_members.some((member: any) => {
                                    const matchByEmail =
                                        member.email === targetUser.email
                                    const matchById =
                                        (targetUser.id &&
                                            member.id === targetUser.id) ||
                                        (targetUser._id &&
                                            member._id === targetUser._id)

                                    return matchByEmail || matchById
                                })

                            if (targetUserInDiscussion) {
                                existingDiscussion = disc
                                console.log(
                                    `🎯 Discussion privée existante trouvée: ${disc.discussion_uuid}`
                                )
                                break
                            }
                        }

                        if (existingDiscussion) {
                            console.log(
                                "🎉 Discussion privée existante trouvée! Redirection vers la conversation existante."
                            )
                            console.log(
                                "🚀 Redirection vers /discussion?id=" +
                                    existingDiscussion.discussion_uuid
                            )
                            router.push(
                                `/discussion?id=${existingDiscussion.discussion_uuid}`
                            )

                            // Nettoyer les refs
                            targetUserRef.current = null
                            createdDiscussionUuidRef.current = null
                        } else {
                            console.log(
                                "🆕 Aucune conversation privée existante trouvée, création d'une nouvelle..."
                            )
                            createNewDiscussion(targetUser)
                        }
                    } else {
                        console.log(
                            `❌ Fetching discussions failed: ${msg.discuss_list_response.error}`
                        )
                        console.log(
                            "🆕 Création d'une nouvelle discussion par défaut..."
                        )
                        createNewDiscussion(targetUser)
                    }

                    return
                }

                if (msg.message_send_response) {
                    console.log(
                        "📤 Réponse message_send reçue:",
                        msg.message_send_response
                    )
                    console.log(
                        "⚠️ Cette réponse est traitée mais la redirection a déjà été forcée"
                    )
                    return
                }
            },
        }),
        [currentUser, router, createNewDiscussion]
    )

    const fetchUsersList = useCallback(() => {
        setIsLoading(true)
        const T = { users_list_request: {} }
        controleur?.envoie(handler, T)
    }, [controleur, handler])

    useEffect(() => {
        if (controleur && canal) {
            console.log("🔗 Inscription du handler")
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
            fetchUsersList()
        }
        return () => {
            if (controleur) {
                console.log("🔌 Désinscription du handler")
                controleur.desincription(
                    handler,
                    listeMessageEmis,
                    listeMessageRecus
                )
            }
        }
    }, [controleur, canal, handler, fetchUsersList])

    return (
        <div className={styles.page}>
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className={styles.titleContainer}>
                    <Users className={styles.icon} />
                    <h1 className={styles.title}>Annuaire - Visioconf</h1>
                </div>
                <p className={styles.subtitle}>
                    Retrouvez tous les utilisateurs de la plateforme
                </p>
            </motion.div>

            <motion.main
                className={styles.main}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <UsersList
                    users={users}
                    currentUserEmail={currentUser?.email || ""}
                    isLoading={isLoading}
                    onMessageUser={handleMessageUser}
                />
            </motion.main>

            <motion.div
                className={styles.refreshButton}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchUsersList}
            >
                Actualiser
            </motion.div>
        </div>
    )
}
