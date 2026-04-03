"use client"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import styles from "./PostItem.module.css"
import { MessageCircle, ChevronDown, ChevronUp, Send } from "lucide-react"
import PostResponseItem from "./PostResponseItem"
import { getProfilePictureUrl } from "@/utils/fileHelpers"

interface PostItemProps {
    post: any
    currentUserId: string
    onToggleResponses: () => void
    isExpanded: boolean
    onAddResponse: (content: string) => void
    isAdmin: boolean
}

export default function PostItem({
    post,
    currentUserId,
    onToggleResponses,
    isExpanded,
    onAddResponse,
    isAdmin,
}: PostItemProps) {
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [replyContent, setReplyContent] = useState("")
    const replyInputRef = useRef<HTMLTextAreaElement>(null)

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMins / 60)
            const diffDays = Math.floor(diffHours / 24)

            if (diffMins < 1) return "À l'instant"
            if (diffMins < 60)
                return `Il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`
            if (diffHours < 24)
                return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`
            if (diffDays < 7)
                return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`

            return date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
            })
        } catch (e) {
            return dateString
        }
    }

    // Focus sur le champ de réponse quand il est affiché
    useEffect(() => {
        if (showReplyForm && replyInputRef.current) {
            replyInputRef.current.focus()
        }
    }, [showReplyForm])

    const handleSubmitReply = () => {
        if (!replyContent.trim()) return

        onAddResponse(replyContent)
        setReplyContent("")
        setShowReplyForm(false)
    }

    const handleReplyClick = () => {
        // Tous les membres peuvent répondre aux posts, sauf le créateur du canal
        setShowReplyForm(!showReplyForm)
    }

    const isAuthor = post.authorId === currentUserId

    // Ajout d'un état local pour les réponses, synchronisé avec post.responses
    const [responses, setResponses] = useState<any[]>(post.responses || [])
    // Ajout d'un état local pour le nombre de réponses, synchronisé avec post.responseCount
    const [responseCount, setResponseCount] = useState<number>(
        post.responseCount || 0
    ) // Synchronise les réponses locales et le count avec les props à chaque changement
    useEffect(() => {
        setResponses(post.responses || [])
        setResponseCount(post.responses?.length || 0)
    }, [post.responses])

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.postItem}
        >
            <div className={styles.postHeader}>
                <div className={styles.userInfo}>
                    {" "}
                    <div className={styles.avatar}>
                        {post.authorAvatar ? (
                            <img
                                src={getProfilePictureUrl(post.authorAvatar)}
                                alt={post.authorName}
                            />
                        ) : (
                            post.authorName
                                ?.split(" ")
                                .map((n: string) => n.charAt(0))
                                .join("")
                        )}
                    </div>
                    <div>
                        <span className={styles.userName}>
                            {post.authorName}
                            {isAuthor && (
                                <span className={styles.authorBadge}>Vous</span>
                            )}
                        </span>
                        <span className={styles.timestamp}>
                            {formatDate(post.createdAt)}
                        </span>
                    </div>
                </div>
            </div>

            <p className={styles.postText}>{post.content}</p>

            <div className={styles.postFooter}>
                {!isAdmin && (
                    <button
                        className={styles.replyButton}
                        onClick={handleReplyClick}
                    >
                        <MessageCircle size={16} />
                        <span>Répondre</span>
                    </button>
                )}

                {responseCount > 0 && (
                    <button
                        className={styles.responsesToggle}
                        onClick={onToggleResponses}
                    >
                        <div className={styles.responsesInfo}>
                            <MessageCircle size={16} />
                            <span>
                                {responseCount} réponse
                                {responseCount > 1 ? "s" : ""}
                            </span>
                        </div>
                        {isExpanded ? (
                            <ChevronUp size={16} />
                        ) : (
                            <ChevronDown size={16} />
                        )}
                    </button>
                )}
            </div>

            {showReplyForm && (
                <div className={styles.replyForm}>
                    <textarea
                        ref={replyInputRef}
                        className={styles.replyInput}
                        placeholder="Écrivez votre réponse..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={2}
                        onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmitReply()
                            }
                        }}
                    />
                    <button
                        className={styles.replySubmitButton}
                        onClick={handleSubmitReply}
                        disabled={!replyContent.trim()}
                        aria-label="Envoyer la réponse"
                    >
                        <Send size={16} />
                    </button>
                </div>
            )}

            {isExpanded && responses && responses.length > 0 && (
                <div className={styles.responsesContainer}>
                    {responses.map((response: any) => (
                        <PostResponseItem
                            key={
                                response.id ||
                                response._id ||
                                `response-${response.authorId}-${Date.parse(
                                    response.createdAt
                                )}`
                            }
                            response={response}
                            currentUserId={currentUserId}
                            id={`response-${response.id || response._id}`}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    )
}
