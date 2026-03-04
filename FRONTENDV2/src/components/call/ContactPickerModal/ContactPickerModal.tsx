import { FC, useContext, useEffect, useState } from "react"
import { Phone, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAudioCall } from "contexts/call/AudioCallContext"
import { SessionContext } from "contexts/SessionContext"
import Controller from "core/Controller"
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
    const { initiateCall } = useAudioCall()
    const session = useContext(SessionContext)
    const currentUser = session?.currentUser?.data?.user
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) return

        setLoading(true)
        const socket = Controller.getSocket()

        const handleResponse = (data: Contact[]) => {
            console.log("[ContactPicker] Received contacts:", data)
            setContacts(data)
            setLoading(false)
        }

        socket.on("contacts:list:response", handleResponse)

        // Debug: log session structure to find the correct path to user data
        console.log("[ContactPicker] session context:", JSON.stringify(session, null, 2))
        console.log("[ContactPicker] currentUser:", currentUser)

        // Try multiple paths to get the user email for filtering
        const user = session?.currentUser?.data?.user
            || session?.currentUser?.data
            || session?.currentUser
        const email = user?.email
        console.log("[ContactPicker] resolved user:", user, "email:", email)

        socket.emit("contacts:list", { excludeEmail: email })

        return () => {
            socket.off("contacts:list:response", handleResponse)
        }
    }, [isOpen, currentUser, session])

    const handleSelectContact = (contact: Contact) => {
        initiateCall([{
            userId: contact.id,
            firstname: contact.firstname,
            lastname: contact.lastname,
            picture: contact.picture
        }])
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
                                    <button
                                        key={contact.id}
                                        className="contactItem"
                                        onClick={() => handleSelectContact(contact)}
                                    >
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
                                        <Phone size={18} className="callIcon" />
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
