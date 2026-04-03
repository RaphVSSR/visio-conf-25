"use client"

import styles from "./UserListAmis.module.css"
import type { User } from "@/types/User"
import { motion } from "framer-motion"
import { MessageSquare, PhoneCall, Video } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserListAmisProps {
    users: User[] & { status?: string }[]
    currentUserEmail: string
}

export default function UserListAmis({
    users,
    currentUserEmail,
}: UserListAmisProps) {
    const router = useRouter()

    // Fonction pour rediriger vers la page de discussion
    const handleMessageUser = (userEmail: string) => {
        // Naviguer vers la page de discussion avec l'email du contact
        router.push(`/discussion?contact=${encodeURIComponent(userEmail)}`)
    }

    const handleCallUser = () => {
        router.push("/discussion")
    }

    const handleVideoCall = () => {
        router.push("/discussion")
    }
    // Fonction pour obtenir la classe de statut
    const getStatusClass = (status?: string) => {
        switch (status) {
            case "online":
                return styles.status_online
            case "away":
                return styles.status_away
            default:
                return styles.status_offline
        }
    }

    // Fonction pour obtenir le texte de statut
    const getStatusText = (status?: string) => {
        switch (status) {
            case "online":
                return "En ligne"
            case "away":
                return "Absent"
            default:
                return "Hors ligne"
        }
    }

    return (
        <div className={styles.amis_list_scroll}>
            {users
                .filter((user) => user.email !== currentUserEmail)
                .map((user, index) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <div className={styles.userCard}>
                            <div className={styles.userAvatar}>
                                <img
                                    src={
                                        user.picture
                                            ? `https://visioconfbucket.s3.eu-north-1.amazonaws.com/${user.picture}`
                                            : "/images/default_profile_picture.png"
                                    }
                                    alt={`${user.firstname} ${user.lastname}`}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                    }}
                                />
                            </div>{" "}
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>
                                    <span className={styles.userNameText}>
                                        {`${user.firstname} ${user.lastname}`}
                                    </span>
                                    <div
                                        className={`${
                                            styles.status_indicator
                                        } ${getStatusClass(user.status)}`}
                                        title={getStatusText(user.status)}
                                    ></div>
                                </div>
                                <div className={styles.userDetails}>
                                    <span className={styles.userStatus}>
                                        {getStatusText(user.status)}
                                    </span>
                                </div>
                            </div>{" "}
                            <div className={styles.userActions}>
                                {" "}
                                <button
                                    onClick={() =>
                                        handleMessageUser(user.email)
                                    }
                                    title="Envoyer un message"
                                    className={styles.actionButton}
                                >
                                    <MessageSquare size={18} />
                                </button>
                                <button
                                    onClick={handleCallUser}
                                    title="Appel audio"
                                    className={styles.actionButton}
                                >
                                    <PhoneCall size={18} />
                                </button>
                                <button
                                    onClick={handleVideoCall}
                                    title="Appel vidéo"
                                    className={styles.actionButton}
                                >
                                    <Video size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
        </div>
    )
}
