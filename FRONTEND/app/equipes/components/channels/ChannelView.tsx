"use client"
import { useState, useEffect, useRef } from "react"
import styles from "./ChannelView.module.css"
import {
    Users,
    Send,
    HashIcon,
    Lock,
    MessageSquare,
    Settings,
} from "lucide-react"
import PostItem from "./PostItem"
import type { Channel } from "@/types/Channel"
import { useAppContext } from "@/context/AppContext"
import { getProfilePictureUrl } from "@/utils/fileHelpers"

interface ChannelViewProps {
    channel: Channel
    userId: string
    onEditChannel: () => void
    onChannelDeleted?: () => void
}

export default function ChannelView({
    channel,
    userId,
    onEditChannel,
    onChannelDeleted,
}: ChannelViewProps) {
    const { controleur, canal } = useAppContext()
    const [posts, setPosts] = useState<any[]>([])
    const [members, setMembers] = useState<any[]>([])
    const [newPostContent, setNewPostContent] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [showMembers, setShowMembers] = useState(false)
    const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>(
        {}
    )
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const nomDInstance = "ChannelView"
    const verbose = false

    const listeMessageEmis = [
        "channel_posts_request",
        "channel_members_request",
        "channel_post_create_request",
        "channel_post_response_create_request",
        "channel_delete_request",
    ]
    const listeMessageRecus = [
        "channel_posts_response",
        "channel_members_response",
        "channel_post_create_response",
        "channel_post_response_create_response",
        "channel_delete_response",
    ]

    // Assurons-nous que nous utilisons l'ID correct
    const channelId = channel.id

    // Ajout de la fonction utilitaire pour trier par createdAt (ordre décroissant)
    function sortByCreatedAtAsc<T extends { createdAt: string | Date }>(
        arr: T[]
    ): T[] {
        return [...arr].sort(
            (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
        )
    }

    const handler = {
        nomDInstance,
        traitementMessage: (msg: any) => {
            if (verbose || controleur?.verboseall)
                console.log(
                    `INFO: (${nomDInstance}) - traitementMessage - `,
                    msg
                )

            if (msg.channel_posts_response) {
                if (msg.channel_posts_response.etat) {
                    setPosts(
                        sortByCreatedAtAsc(
                            msg.channel_posts_response.posts || []
                        )
                    )
                } else {
                    console.error(
                        "Erreur lors de la récupération des posts:",
                        msg.channel_posts_response.error
                    )
                }
                setIsLoading(false)
            }

            if (msg.channel_members_response) {
                if (msg.channel_members_response.etat) {
                    setMembers(msg.channel_members_response.members || [])
                } else {
                    console.error(
                        "Erreur lors de la récupération des membres:",
                        msg.channel_members_response.error
                    )
                }
            }

            if (msg.channel_post_create_response) {
                if (msg.channel_post_create_response.etat) {
                    const { post } = msg.channel_post_create_response
                    setPosts((prevPosts) =>
                        sortByCreatedAtAsc([post, ...prevPosts])
                    )
                    setNewPostContent("")
                    if (messagesEndRef.current) {
                        messagesEndRef.current.scrollIntoView({
                            behavior: "smooth",
                        })
                    }
                }
            }

            if (msg.channel_post_response_create_response) {
                if (msg.channel_post_response_create_response.etat) {
                    const { postId, response } =
                        msg.channel_post_response_create_response
                    setPosts((prevPosts) =>
                        prevPosts.map((post) => {
                            if (post.id === postId) {
                                return {
                                    ...post,
                                    responses: sortByCreatedAtAsc([
                                        ...(post.responses || []),
                                        response,
                                    ]),
                                }
                            }
                            return post
                        })
                    )
                }
            }

            if (msg.channel_delete_response) {
                if (msg.channel_delete_response.etat) {
                    console.log("Canal supprimé avec succès.")
                    // Call the callback to notify parent component
                    if (onChannelDeleted) {
                        onChannelDeleted()
                    }
                } else {
                    console.error(
                        "Erreur lors de la suppression du canal:",
                        msg.channel_delete_response.error
                    )
                }
            }
        },
    }

    useEffect(() => {
        if (controleur && canal && channelId) {
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)

            // Récupérer les membres du canal
            const membersRequest = { channel_members_request: { channelId } }
            controleur.envoie(handler, membersRequest)

            // Récupérer les posts du canal
            const postsRequest = { channel_posts_request: { channelId } }
            controleur.envoie(handler, postsRequest)
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
    }, [channelId, controleur, canal, onChannelDeleted])

    // Focus sur l'input quand le composant est monté
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [])

    // Scroll automatiquement vers le bas quand les posts changent
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [posts])

    const handleSubmitPost = () => {
        if (!newPostContent.trim() || !userId) return

        const postRequest = {
            channel_post_create_request: {
                channelId,
                content: newPostContent,
            },
        }
        controleur?.envoie(handler, postRequest)
    }

    const handleAddResponse = (postId: string, content: string) => {
        if (!content.trim() || !userId) return

        const responseRequest = {
            channel_post_response_create_request: {
                postId,
                content,
            },
        }
        controleur?.envoie(handler, responseRequest)
    }

    const handleToggleResponses = (postId: string) => {
        setExpandedPosts((prev) => ({
            ...prev,
            [postId]: !prev[postId],
        }))
    }

    const isChannelCreator = channel.createdBy === userId

    const canPostMessage = isChannelCreator // Seul le créateur peut créer des posts

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.channelInfo}>
                    <div className={styles.channelIcon}>
                        {channel.isPublic ? (
                            <HashIcon size={20} />
                        ) : (
                            <Lock size={20} />
                        )}
                    </div>
                    <h2 className={styles.channelName}>{channel.name}</h2>
                    <div className={styles.channelStatus}>
                        <span
                            className={
                                channel.isPublic
                                    ? styles.publicBadge
                                    : styles.privateBadge
                            }
                        >
                            {channel.isPublic ? "Public" : "Privé"}
                        </span>
                    </div>
                    <button
                        className={styles.membersButton}
                        onClick={() => setShowMembers(!showMembers)}
                    >
                        <Users size={18} />
                        <span>
                            {members.length} membre
                            {members.length !== 1 ? "s" : ""}
                        </span>
                    </button>
                </div>

                <div>
                    {isChannelCreator && onEditChannel && (
                        <button
                            className={styles.settingsButton}
                            onClick={onEditChannel}
                        >
                            <Settings size={14} />
                        </button>
                    )}
                </div>
            </div>

            {showMembers && (
                <div className={styles.membersPanel}>
                    <h3 className={styles.membersPanelTitle}>
                        Membres du canal
                    </h3>

                    <div className={styles.membersList}>
                        {members.map((member) => (
                            <div
                                key={member.id || `member-${member.userId}`}
                                className={styles.memberItem}
                            >
                                {" "}
                                <div className={styles.memberAvatar}>
                                    {member.picture ? (
                                        <img
                                            src={getProfilePictureUrl(
                                                member.picture
                                            )}
                                            alt={`${member.firstname} ${member.lastname}`}
                                        />
                                    ) : (
                                        <>
                                            {member.firstname?.charAt(0) || "?"}
                                            {member.lastname?.charAt(0) || "?"}
                                        </>
                                    )}
                                </div>
                                <div className={styles.memberInfo}>
                                    <span className={styles.memberName}>
                                        {member.firstname} {member.lastname}
                                        {member.userId === userId && (
                                            <span className={styles.youBadge}>
                                                Vous
                                            </span>
                                        )}
                                    </span>
                                    <span className={styles.memberRole}>
                                        {member.role === "admin"
                                            ? "Administrateur"
                                            : "Membre"}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {members.length === 0 && (
                            <div className={styles.noResults}>
                                Aucun membre trouvé
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={styles.postsContainer}>
                {isLoading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Chargement des messages...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <MessageSquare size={48} />
                        <p>Aucun message dans ce canal</p>
                        {canPostMessage && (
                            <p>Soyez le premier à écrire quelque chose !</p>
                        )}
                    </div>
                ) : (
                    <>
                        {posts.map((post) => (
                            <div key={post.id} className={styles.postWrapper}>
                                <PostItem
                                    post={post}
                                    currentUserId={userId || ""}
                                    onToggleResponses={() =>
                                        handleToggleResponses(post.id)
                                    }
                                    isExpanded={!!expandedPosts[post.id]}
                                    onAddResponse={(content) =>
                                        handleAddResponse(post.id, content)
                                    }
                                    isAdmin={isChannelCreator}
                                />
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {canPostMessage && (
                <div className={styles.inputContainer}>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.messageInput}
                        placeholder="Écrivez un message..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmitPost()
                            }
                        }}
                    />
                    <button
                        className={styles.sendButton}
                        onClick={handleSubmitPost}
                        disabled={!newPostContent.trim()}
                        aria-label="Envoyer le message"
                    >
                        <Send size={18} />
                    </button>
                </div>
            )}
        </div>
    )
}
