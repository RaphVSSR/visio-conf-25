"use client"
import { useState } from "react"
import styles from "./PostResponseItem.module.css"
import { getProfilePictureUrl } from "@/utils/fileHelpers"

interface PostResponseItemProps {
    response: any
    currentUserId: string
    id?: string
}

export default function PostResponseItem({
    response,
    currentUserId,
    id,
}: PostResponseItemProps) {
    const [showOptions, setShowOptions] = useState(false)

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

    const isAuthor = response.authorId === currentUserId
    const responseId = response.id

    return (
        <div
            id={id}
            className={`${styles.responseItem} ${
                isAuthor ? styles.authorResponse : ""
            }`}
        >
            <div className={styles.responseHeader}>
                <div className={styles.userInfo}>
                    {" "}
                    <div className={styles.avatar}>
                        {response.authorAvatar ? (
                            <img
                                src={getProfilePictureUrl(
                                    response.authorAvatar
                                )}
                                alt={response.authorName}
                            />
                        ) : (
                            response.authorName
                                ?.split(" ")
                                .map((n: string) => n.charAt(0))
                                .join("")
                        )}
                    </div>
                    <div>
                        <span className={styles.userName}>
                            {response.authorName}
                            {isAuthor && (
                                <span className={styles.authorBadge}>Vous</span>
                            )}
                        </span>
                        <span className={styles.timestamp}>
                            {formatDate(response.createdAt)}
                        </span>
                    </div>
                </div>
            </div>
            <p className={styles.responseText}>{response.content}</p>
        </div>
    )
}
