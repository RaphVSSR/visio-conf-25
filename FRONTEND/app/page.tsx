"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import styles from "./page.module.css"
import { useAppContext } from "@/context/AppContext"
import type { User } from "@/types/User"
import type { Message } from "@/types/Message"
import type { Call } from "@/types/Call"
import {
    Bell,
    Clock,
    Users,
    MessageSquare,
    PhoneCall,
    Video,
    Search,
    UserPlus,
    FileUp,
    X,
    Calendar,
    FileText,
    Activity,
    Zap,
} from "lucide-react"
import { motion } from "framer-motion"
import UserListAmis from "@/components/home/UserListAmis"

// Type étendu pour inclure le statut
interface ExtendedUser extends User {
    status: "online" | "away" | "offline"
}

export default function Home() {
    const pathname = usePathname()
    const router = useRouter()
    const { controleur, canal, currentUser } = useAppContext()
    const [users, setUsers] = useState<User[]>([])
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [messages, setMessages] = useState<Message[]>([])
    const [calls, setCalls] = useState<Call[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([])
    const [discussions, setDiscussions] = useState<any[]>([])

    const nomDInstance = "HomePage"
    const verbose = false

    const listeMessageEmis = [
        "users_list_request",
        "messages_get_request",
        "calls_get_request",
        "discuss_list_request",
    ]

    const listeMessageRecus = [
        "users_list_response",
        "messages_get_response",
        "calls_get_response",
        "discuss_list_response",
    ] // Fonction pour obtenir le statut réel des utilisateurs
    const getActualStatus = (user: User): "online" | "away" | "offline" => {
        if (user.disturb_status === "available") return "online"
        if (user.disturb_status === "dnd") return "away"
        return "offline"
    } // Fonction pour extraire les contacts (utilisateurs avec qui on a des discussions)
    const getContactsFromDiscussions = (allUsers: User[]) => {
        if (!currentUser || !discussions.length || !allUsers.length) {
            return []
        }
        const contactIds = new Set<string>()

        // Parcourir toutes les discussions pour trouver les contacts
        discussions.forEach((discussion: any) => {
            if (
                discussion.discussion_members &&
                Array.isArray(discussion.discussion_members)
            ) {
                discussion.discussion_members.forEach((member: any) => {
                    const memberId = member.id || member.uuid // Utiliser d'abord id (uuid), puis uuid en fallback
                    if (memberId && memberId !== currentUser.id) {
                        contactIds.add(memberId)
                    }
                })
            }
        })

        // Filtrer les utilisateurs pour ne garder que les contacts en utilisant les IDs
        const contacts = allUsers
            .filter((user: User) => {
                // Vérifier avec id (uuid) pour compatibilité
                const isContact = contactIds.has(user.id)
                return isContact
            })
            .map((user: User) => ({
                ...user,
                status: getActualStatus(user),
            }))

        return contacts
    } // Gestionnaire de messages du contrôleur
    const handler = {
        nomDInstance,
        traitementMessage: (msg: any) => {
            try {
                if (verbose || controleur?.verboseall) {
                    console.log(
                        `INFO: (${nomDInstance}) - traitementMessage - `,
                        msg
                    )
                }

                if (msg.users_list_response) {
                    setIsLoading(false)
                    if (!msg.users_list_response.etat) {
                        setError(
                            `Erreur lors de la récupération des utilisateurs: ${msg.users_list_response.error}`
                        )
                    } else {
                        const usersList = msg.users_list_response.users || []
                        setUsers(usersList) // Mettre à jour les contacts si on a déjà les discussions
                        if (currentUser && discussions.length > 0) {
                            const contactsWithDiscussions =
                                getContactsFromDiscussions(usersList)
                            setFilteredUsers(contactsWithDiscussions)
                        }
                    }
                }
                if (msg.discuss_list_response) {
                    if (!msg.discuss_list_response.etat) {
                        setError(
                            `Erreur lors de la récupération des discussions: ${msg.discuss_list_response.error}`
                        )
                        setIsLoading(false)
                        return
                    }

                    setDiscussions(msg.discuss_list_response.messages || [])

                    // Mettre à jour les contacts après avoir reçu les discussions
                    if (users.length > 0) {
                        const contactsWithDiscussions =
                            getContactsFromDiscussions(users)
                        setFilteredUsers(contactsWithDiscussions)
                    }

                    // Pour chaque discussion, récupère les messages récents pour construire les contacts
                    ;(msg.discuss_list_response.messages || []).forEach(
                        (discussion: any) => {
                            if (
                                discussion.discussion_members &&
                                discussion.discussion_members.length === 2
                            ) {
                                controleur.envoie(handler, {
                                    messages_get_request: {
                                        convId: discussion.discussion_uuid,
                                    },
                                })
                            }
                        }
                    )
                }

                if (msg.messages_get_response) {
                    // Fusionne les messages de toutes les discussions privées, sans doublons
                    setMessages((prev) => {
                        const newMsgs = msg.messages_get_response.messages || []
                        const allMsgs = [...prev, ...newMsgs]
                        // Dédoublonnage par message_uuid si présent
                        const unique = allMsgs.filter(
                            (msg, idx, arr) =>
                                arr.findIndex(
                                    (m) => m.message_uuid === msg.message_uuid
                                ) === idx
                        )
                        return unique
                    })
                }

                if (msg.calls_get_response) {
                    if (!msg.calls_get_response.etat) {
                        console.error(
                            `Erreur lors de la récupération des appels: ${msg.calls_get_response.error}`
                        )
                    } else {
                        setCalls(msg.calls_get_response.calls || [])
                    }
                }
            } catch (error) {
                console.error("Erreur dans le traitement du message:", error)
                setIsLoading(false)
            }
        },
    } // Récupération des données - simplifié
    const fetchData = () => {
        if (!controleur || !currentUser) {
            return
        }

        if (canal?.socket?.connected) {
            controleur.envoie(handler, { users_list_request: {} })
            controleur.envoie(handler, { calls_get_request: {} })
            controleur.envoie(handler, { discuss_list_request: currentUser.id })
        } else {
            setTimeout(() => {
                if (canal?.socket?.connected) {
                    controleur.envoie(handler, { users_list_request: {} })
                    controleur.envoie(handler, { calls_get_request: {} })
                    controleur.envoie(handler, {
                        discuss_list_request: currentUser.id,
                    })
                } else {
                    setIsLoading(false)
                }
            }, 1000)
        }
    }
    // Fonction de recherche parmi les contacts
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase()
        setSearchQuery(query)

        if (!currentUser) return

        const allContacts = getContactsFromDiscussions(users)

        if (query.trim() === "") {
            // Si la recherche est vide, afficher tous les contacts
            setFilteredUsers(allContacts)
        } else {
            // Filtrer les contacts en fonction de la recherche
            const filtered = allContacts.filter(
                (user) =>
                    user.firstname.toLowerCase().includes(query) ||
                    user.lastname.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    (user.phone && user.phone.includes(query))
            )
            setFilteredUsers(filtered)
        }
    }
    // Effacer la recherche
    const clearSearch = () => {
        setSearchQuery("")
        if (currentUser) {
            const allContacts = getContactsFromDiscussions(users)
            setFilteredUsers(allContacts)
        }
    }
    // Statistiques basées sur les données réelles
    const getUnreadReceivedMessagesCount = () => {
        if (!currentUser) return 0
        const unread = messages.filter((msg) => {
            if (msg.message_status !== "sent") return false
            // Récupère l'id de l'expéditeur
            let senderId = undefined
            if (typeof msg.message_sender === "string") {
                senderId = msg.message_sender
            } else if (
                typeof msg.message_sender === "object" &&
                msg.message_sender
            ) {
                senderId = msg.message_sender.uuid
            } // On ne compte que les messages envoyés par quelqu'un d'autre
            return senderId && senderId !== currentUser.id
        })
        return unread.length
    }

    const getMissedCallsCount = () => {
        return calls.filter((call) => call.call_type === "missed").length
    }

    const getActiveContactsCount = () => {
        // Compter les contacts réellement actifs (online) en excluant l'utilisateur courant
        return filteredUsers.filter(
            (user) =>
                user.status === "online" && user.email !== currentUser?.email
        ).length
    } // Activités récentes basées sur les vraies discussions
    const getRecentActivities = () => {
        if (!discussions.length || !users.length || !currentUser) return []

        const activities = discussions
            .map((discussion: any) => {
                const lastMsg = discussion.last_message
                if (!lastMsg) return null

                // Ne pas afficher les messages envoyés par l'utilisateur courant
                // Comparer avec l'UUID (currentUser.id) et l'ObjectId (lastMsg.message_sender)
                if (
                    lastMsg.message_sender === currentUser.id ||
                    lastMsg.message_sender === currentUser._id
                )
                    return null

                // Trouver l'expéditeur dans les membres OU dans la liste users
                const sender = (discussion.discussion_members &&
                    discussion.discussion_members.find(
                        (m: any) =>
                            m._id === lastMsg.message_sender ||
                            m.id === lastMsg.message_sender ||
                            m.uuid === lastMsg.message_sender
                    )) ||
                    users.find(
                        (u) =>
                            u.id === lastMsg.message_sender ||
                            u._id === lastMsg.message_sender
                    ) || {
                        firstname: "Inconnu",
                        lastname: "",
                        picture: "",
                    }

                return {
                    type: "message",
                    user: sender,
                    time: new Date(lastMsg.message_date_create).toLocaleString(
                        "fr-FR",
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                        }
                    ),
                    content:
                        lastMsg.message_content ||
                        "A envoyé un nouveau message",
                }
            })
            .filter(Boolean)
            .sort(
                (a, b) =>
                    new Date(b!.time).getTime() - new Date(a!.time).getTime()
            )
            .slice(0, 10)

        return activities
    } // Fonctions de navigation pour les actions rapides
    const handleNewDiscussion = () => {
        router.push("/discussion")
    }

    const handleStartCall = () => {
        router.push("/discussion")
    } // Effet pour l'inscription/désinscription au contrôleur
    useEffect(() => {
        if (controleur && canal) {
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
            return () => {
                controleur.desincription(
                    handler,
                    listeMessageEmis,
                    listeMessageRecus
                )
            }
        }
    }, [controleur, canal]) // Effet principal - fetch des données dès que currentUser est disponible
    useEffect(() => {
        if (currentUser && controleur) {
            setIsLoading(true)
            fetchData()

            // Timeout de sécurité
            const timeout = setTimeout(() => {
                setIsLoading(false)
            }, 15000)

            return () => clearTimeout(timeout)
        } else if (!currentUser) {
            // Réinitialiser les données si pas d'utilisateur
            setUsers([])
            setDiscussions([])
            setMessages([])
            setCalls([])
            setFilteredUsers([])
            setIsLoading(true)
        }
    }, [currentUser?.id, controleur])

    // Effet pour mettre à jour les contacts quand les données arrivent
    useEffect(() => {
        if (currentUser && users.length > 0 && discussions.length > 0) {
            const contacts = getContactsFromDiscussions(users)
            setFilteredUsers(contacts)
        }
    }, [users, discussions, currentUser]) // Calcul des messages non lus - SUPPRIMÉ

    // Affichage du chargement
    if (isLoading)
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )

    // Affichage si non connecté
    if (!currentUser)
        return (
            <div className="flex items-center justify-center h-screen flex-col gap-4">
                <div className="text-xl font-semibold text-gray-700">
                    Veuillez vous connecter
                </div>
                <a
                    href="/login"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Se connecter
                </a>
            </div>
        )
    const recentActivities = getRecentActivities()

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                {/* Colonne principale */}
                <div className={styles.mainColumn}>
                    {/* Tableau de bord */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className={styles.dashboard_summary}
                    >
                        <h1 className={styles.sectionTitle}>
                            <Zap size={22} /> Tableau de bord
                        </h1>
                        <div className={styles.summary_cards}>
                            <motion.div
                                className={styles.summary_card}
                                whileHover={{ scale: 1.02 }}
                                style={{ borderColor: "#1E3664" }}
                            >
                                <div className={styles.summary_card_icon}>
                                    <MessageSquare size={20} />
                                </div>
                                <h3>Messages non lus</h3>
                                <p>{getUnreadReceivedMessagesCount()}</p>
                            </motion.div>

                            <motion.div
                                className={styles.summary_card}
                                whileHover={{ scale: 1.02 }}
                                style={{ borderColor: "#F59E0B" }}
                            >
                                <div className={styles.summary_card_icon}>
                                    <PhoneCall size={20} />
                                </div>
                                <h3>Appels manqués</h3>
                                <p>{getMissedCallsCount()}</p>
                            </motion.div>

                            <motion.div
                                className={styles.summary_card}
                                whileHover={{ scale: 1.02 }}
                                style={{ borderColor: "#10B981" }}
                            >
                                <div className={styles.summary_card_icon}>
                                    <Users size={20} />
                                </div>{" "}
                                <h3>Contacts actifs</h3>
                                <p>{getActiveContactsCount()}</p>
                            </motion.div>
                        </div>{" "}
                        <div className={styles.quick_actions}>
                            <button
                                onClick={handleNewDiscussion}
                                className={styles.quick_action}
                            >
                                <MessageSquare size={16} />
                                <span>Nouvelle discussion</span>
                            </button>
                            <button
                                onClick={handleStartCall}
                                className={styles.quick_action}
                            >
                                <Video size={16} />
                                <span>Démarrer un appel</span>
                            </button>
                            <a href="/files" className={styles.quick_action}>
                                <FileUp size={16} />
                                <span>Partager un fichier</span>
                            </a>
                            <a href="/equipes" className={styles.quick_action}>
                                <UserPlus size={16} />
                                <span>Créer une équipe</span>
                            </a>
                        </div>
                    </motion.div>

                    <div className={styles.contentColumns}>
                        {/* Activités récentes */}
                        <motion.section
                            className={styles.section}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <h2 className={styles.sectionTitle}>
                                <Activity size={20} /> Activités récentes
                            </h2>

                            <div className={styles.activitiesList}>
                                {recentActivities.length > 0 ? (
                                    recentActivities.map((activity, index) =>
                                        activity ? (
                                            <div
                                                key={index}
                                                className={styles.activityItem}
                                            >
                                                <div
                                                    className={
                                                        styles.activityAvatar
                                                    }
                                                >
                                                    <img
                                                        src={
                                                            activity.user
                                                                .picture
                                                                ? `https://visioconfbucket.s3.eu-north-1.amazonaws.com/${activity.user.picture}`
                                                                : "/images/default_profile_picture.png"
                                                        }
                                                        alt={`${activity.user.firstname} ${activity.user.lastname}`}
                                                    />
                                                </div>
                                                <div
                                                    className={
                                                        styles.activityContent
                                                    }
                                                >
                                                    <div
                                                        className={
                                                            styles.activityHeader
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.activityUser
                                                            }
                                                        >
                                                            {
                                                                activity.user
                                                                    .firstname
                                                            }{" "}
                                                            {
                                                                activity.user
                                                                    .lastname
                                                            }
                                                        </span>
                                                        <span
                                                            className={
                                                                styles.activityTime
                                                            }
                                                        >
                                                            {activity.time}
                                                        </span>
                                                    </div>
                                                    <p
                                                        className={
                                                            styles.activityText
                                                        }
                                                    >
                                                        {activity.content}
                                                    </p>
                                                </div>
                                                <div
                                                    className={
                                                        styles.activityIcon
                                                    }
                                                >
                                                    {activity.type ===
                                                        "message" && (
                                                        <MessageSquare
                                                            size={16}
                                                        />
                                                    )}
                                                    {activity.type ===
                                                        "call" && (
                                                        <PhoneCall size={16} />
                                                    )}
                                                    {activity.type ===
                                                        "file" && (
                                                        <FileText size={16} />
                                                    )}
                                                    {activity.type ===
                                                        "team" && (
                                                        <Users size={16} />
                                                    )}
                                                </div>
                                            </div>
                                        ) : null
                                    )
                                ) : (
                                    <div className={styles.emptyActivities}>
                                        <Activity size={40} />
                                        <p>Aucune activité récente</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </div>
                </div>

                {/* Colonne des contacts */}
                <motion.section
                    className={styles.contactsColumn}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <h2 className={styles.sectionTitle}>
                        <Users size={20} /> Contacts
                    </h2>
                    <div className={styles.searchContainer}>
                        <Search className={styles.searchIcon} size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher un contact..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className={styles.clearButton}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>{" "}
                    {filteredUsers.length > 0 ? (
                        <UserListAmis
                            users={filteredUsers}
                            currentUserEmail={currentUser.email}
                        />
                    ) : (
                        <div className={styles.empty_state}>
                            {searchQuery ? (
                                <>
                                    <Search size={40} />
                                    <h3>Aucun contact trouvé</h3>
                                    <p>
                                        Aucun contact ne correspond à votre
                                        recherche "{searchQuery}"
                                    </p>
                                    <button
                                        onClick={clearSearch}
                                        className={styles.resetButton}
                                    >
                                        Réinitialiser la recherche
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Users size={40} />
                                    <h3>Aucun contact</h3>
                                    <p>
                                        Vous n'avez pas encore de contacts.
                                        Créez une discussion pour commencer à
                                        voir vos contacts ici.
                                    </p>
                                    <button
                                        onClick={handleNewDiscussion}
                                        className={styles.resetButton}
                                    >
                                        Nouvelle discussion
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </motion.section>
            </main>
        </div>
    )
}
