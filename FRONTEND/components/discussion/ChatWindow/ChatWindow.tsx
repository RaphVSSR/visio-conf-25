"use client"

import React, { useState, useEffect, useRef } from "react"
import { Discussion } from "@/types/Discussion"
import { User } from "@/types/User"
import { Message } from "@/types/Message"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { useAppContext } from "@/context/AppContext"
import { v4 as uuidv4 } from "uuid"
import styles from "./ChatWindow.module.css"

interface ChatWindowProps {
    discussion?: Discussion
    messages: Message[]
    currentUser: User
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    discussion,
    messages,
    currentUser,
}) => {
    const [newMessage, setNewMessage] = useState("")
    const [localMessages, setLocalMessages] = useState<Message[]>([])
    const { controleur } = useAppContext()
    const nomDInstance = "ChatWindow"
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const listeMessageEmis = ["message_send_request", "messages_get_request"]
    const listeMessageRecus = ["message_send_response", "messages_get_response"]

    // Initialiser les messages locaux quand les messages props changent
    useEffect(() => {
        setLocalMessages(messages)
        scrollToBottom()
    }, [messages])

    // Scroll to bottom when localMessages changes
    useEffect(() => {
        scrollToBottom()
    }, [localMessages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    // Fonction utilitaire pour vérifier si un message provient de l'utilisateur actuel
    const isCurrentUserMessage = (message: Message): boolean => {
        const senderId = message.message_sender.uuid

        const currentUserId = currentUser.id

        // Si l'email est disponible, c'est la méthode la plus fiable pour comparer
        if (message.message_sender.email && currentUser.email) {
            return message.message_sender.email === currentUser.email
        } // Sinon, essayer les différents IDs
        return senderId === currentUserId
    }

    const handler = {
        nomDInstance,
        traitementMessage: (msg: any) => {
            if (msg.message_send_response) {
                if (!msg.message_send_response.etat) {
                    console.error(
                        "Erreur lors de l'envoi du message:",
                        msg.message_send_response.error
                    )
                } else {
                    // Rafraîchir les messages après un envoi réussi
                    fetchMessages()

                    // Déclencher l'événement pour mettre à jour la liste des discussions
                    if (discussion) {
                        const event = new CustomEvent("discussion-updated", {
                            detail: {
                                discussionId: discussion.discussion_uuid,
                                lastMessage: {
                                    message_content: newMessage.trim(),
                                    message_date_create:
                                        new Date().toISOString(),
                                },
                            },
                        })
                        document.dispatchEvent(event)
                    }
                }
            }
            if (msg.messages_get_response) {
                if (msg.messages_get_response.etat) {
                    setLocalMessages(msg.messages_get_response.messages || [])
                }
            }
        },
    }

    useEffect(() => {
        // Register handler when component mounts
        if (controleur) {
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
        }

        // Unregister handler when component unmounts
        return () => {
            if (controleur) {
                controleur.desincription(
                    handler,
                    listeMessageEmis,
                    listeMessageRecus
                )
            }
        }
    }, [controleur])

    const fetchMessages = () => {
        if (!discussion || !controleur) return

        const message = {
            messages_get_request: {
                convId: discussion.discussion_uuid,
            },
        }
        controleur.envoie(handler, message)
    }

    if (!discussion) {
        return null
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !controleur || !currentUser) return
        console.log("Message sender:", currentUser)

        const messageUuid = uuidv4()
        const currentDate = new Date()

        // Créer un message temporaire pour l'affichage immédiat
        const tempMessage: Message = {
            message_uuid: messageUuid,
            message_content: newMessage.trim(),
            message_sender: {
                _id: currentUser.id,
                id: currentUser.id,
                firstname: currentUser.firstname || "",
                lastname: currentUser.lastname || "",
                picture: currentUser.picture || "",
                email: currentUser.email,
                phone: currentUser.phone || "",
            },
            message_date_create: currentDate.toISOString(),
            message_status: "sent",
        } // Ajouter le message temporaire à l'état local
        setLocalMessages((prev) => [...prev, tempMessage])

        const message = {
            message_send_request: {
                userEmail: currentUser.email,
                discussion_uuid: discussion.discussion_uuid,
                message_uuid: messageUuid,
                message_content: newMessage.trim(),
                message_date_create: currentDate.toISOString(),
            },
        }

        try {
            controleur.envoie(handler, message)
            setNewMessage("")
        } catch (error) {
            console.error("Erreur lors de l'envoi du message:", error)
        }
    }
    return (
        <div className={styles["chat-window"]}>
            <div className={styles["chat-header"]}>
                <h2>{discussion.discussion_name || "Discussion"}</h2>
            </div>

            <div className={styles["messages-container"]}>
                {localMessages.map((message) => (
                    <div
                        key={message.message_uuid}
                        className={`${styles.message} ${
                            isCurrentUserMessage(message)
                                ? styles.sent
                                : styles.received
                        }`}
                    >
                        <div className={styles["message-content"]}>
                            {message.message_content}
                        </div>
                        <div className={styles["message-info"]}>
                            <span className={styles["sender-name"]}>
                                {isCurrentUserMessage(message)
                                    ? "Vous"
                                    : `${
                                          message.message_sender.firstname || ""
                                      } ${
                                          message.message_sender.lastname || ""
                                      }`}
                            </span>
                            <span className={styles["message-time"]}>
                                {formatDistanceToNow(
                                    new Date(message.message_date_create),
                                    {
                                        addSuffix: true,
                                        locale: fr,
                                    }
                                )}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form
                onSubmit={handleSendMessage}
                className={styles["message-input"]}
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                />
                <button type="submit">Envoyer</button>
            </form>
        </div>
    )
}

export default ChatWindow
