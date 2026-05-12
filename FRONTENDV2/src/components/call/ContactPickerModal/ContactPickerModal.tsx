import { FC, useEffect, useState } from "react"
import { Phone, Video, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useCall } from "contexts/call/CallContext"
import { useAuth } from "hooks/useAuth"
import "./ContactPickerModal.scss"

interface Contact {
    id: string
    firstname: string
    lastname: string
    picture: string
    is_online: boolean
}

interface ContactPickerModalProps {
    isOpen: boolean
    onClose: () => void
}

export const ContactPickerModal: FC<ContactPickerModalProps> = ({ isOpen, onClose }) => {
    const { initiateCall } = useCall()
    const { user } = useAuth()
    const socket: any = null
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isOpen || !socket) return

        setLoading(true)

        const handleResponse = (data: Contact[]) => {
            setContacts(data)
            setLoading(false)
        }

        socket.on("contacts:list:response", handleResponse)
        socket.send("contacts:list", { excludeEmail: user?.email })

        return () => {
            socket.off("contacts:list:response", handleResponse)
        }
    }, [isOpen, user, socket])

    const handleAudioCall = (contact: Contact) => {
        initiateCall([{
            userId: contact.id,
            firstname: contact.firstname,
            lastname: contact.lastname,
            picture: contact.picture
        }], "audio")
        onClose()
    }

    const handleVideoCall = (contact: Contact) => {
        initiateCall([{
            userId: contact.id,
            firstname: contact.firstname,
            lastname: contact.lastname,
            picture: contact.picture
        }], "video")
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="contactPickerOverlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="contactPickerModal"
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="contactPickerHeader">
                            <h3>Choisir un contact</h3>
                            <button className="closeBtn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="contactsList">
                            {loading ? (
                                <div className="contactsLoading">
                                    <p>Chargement des contacts...</p>
                                </div>
                            ) : contacts.length === 0 ? (
                                <div className="contactsEmpty">
                                    <p>Aucun contact disponible</p>
                                </div>
                            ) : (
                                contacts.map((contact) => (
                                    <div key={contact.id} className="contactItem">
                                        <div className="contactAvatar">
                                            <img
                                                src={
                                                    contact.picture
                                                        ? `https://visioconfbucket.s3.eu-north-1.amazonaws.com/${contact.picture}`
                                                        : "/images/default_profile_picture.png"
                                                }
                                                alt={`${contact.firstname} ${contact.lastname}`}
                                            />
                                            <span className={`onlineIndicator ${contact.is_online ? "online" : ""}`} />
                                        </div>
                                        <div className="contactInfo">
                                            <span className="contactName">
                                                {contact.firstname} {contact.lastname}
                                            </span>
                                            <span className="contactStatus">
                                                {contact.is_online ? "En ligne" : "Hors ligne"}
                                            </span>
                                        </div>
                                        <div className="callActions">
                                            <button
                                                className="callIconBtn"
                                                onClick={() => handleAudioCall(contact)}
                                                title="Appel audio"
                                            >
                                                <Phone size={18} />
                                            </button>
                                            <button
                                                className="callIconBtn videoBtn"
                                                onClick={() => handleVideoCall(contact)}
                                                title="Appel vidéo"
                                            >
                                                <Video size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
