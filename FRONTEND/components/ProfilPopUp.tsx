"use client"

import { useState, useRef, useEffect } from "react"
import { User } from "../types/User"
import styles from "./ProfilPopUp.module.css"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/context/AppContext"
import { ChevronRight, Settings, LogOut } from "lucide-react"
import { getProfilePictureUrl } from "@/utils/fileHelpers"

export default function ProfilPopUp({ user }: { user: User }) {
    const [isOpen, setIsOpen] = useState(false)
    const popUpRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const router = useRouter()

    const { controleur, currentUser, setCurrentUser, logout } = useAppContext()
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [loginError, setLoginError] = useState("")
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [imageError, setImageError] = useState(false)

    const [status, setStatus] = useState({
        label: "",
        value: "",
        color: "",
        border: "",
    })

    const verbose = false
    const nomDInstance = "ProfilPopUp"
    const listeMessageEmis = ["update_user_request"]
    const listeMessageRecus = ["update_user_response"]

    const statusMap = {
        available: { label: "En ligne", color: "#1CE148", border: "" },
        dnd: { label: "Ne pas déranger", color: "#CB0000", border: "" },
        offline: {
            label: "Invisible",
            color: "white",
            border: "#898989 3px solid",
        },
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement

            if (
                !loading &&
                popUpRef.current &&
                !popUpRef.current.contains(target) &&
                buttonRef.current &&
                !buttonRef.current.contains(target)
            ) {
                setIsOpen(false)
                setIsMenuOpen(false)
            }
        }

        // Only add listener when popup is open
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen, loading])

    useEffect(() => {
        if (controleur) {
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
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
    }, [controleur])

    const hasUpdatedStatusRef = useRef(false)

    useEffect(() => {
        if (!currentUser || hasUpdatedStatusRef.current || !controleur) return

        hasUpdatedStatusRef.current = true

        // Set initial status first
        setStatus({
            ...statusMap["available"],
            value: "available",
        })

        // Then update server
        const payload = {
            update_user_request: {
                id: currentUser.id,
                disturb_status: "available",
            },
        }
        controleur.envoie(handler, payload)
    }, [currentUser, controleur])

    // Reset image error when user changes
    useEffect(() => {
        setImageError(false)
    }, [currentUser?.picture])

    const handler = {
        nomDInstance,
        traitementMessage: (msg: {
            update_user_response?: {
                etat: boolean
                newUserInfo?: User
                error?: string
            }
        }) => {
            if (verbose || controleur?.verboseall) {
                console.log(
                    `INFO: (${nomDInstance}) - traitementMessage - `,
                    msg
                )
            }
            if (msg.update_user_response) {
                const { etat, newUserInfo, error } = msg.update_user_response
                if (!etat) {
                    // Only show error if it's a manual status change, not initial setup

                    if (!hasUpdatedStatusRef.current) {
                        setLoginError("Changement de statut échoué")
                    }
                    setLoading(false)
                } else if (newUserInfo) {
                    setCurrentUser(newUserInfo)
                    const mappedStatus =
                        statusMap[
                            newUserInfo.disturb_status as keyof typeof statusMap
                        ]
                    if (mappedStatus) {
                        setStatus({
                            ...mappedStatus,
                            value: newUserInfo.disturb_status,
                        })
                    }
                    setLoading(false)
                    setLoginError("")
                }
            }
        },
    }

    const handleLogout = () => {
        try {
            // Close popup before logout
            setIsOpen(false)

            // Use the centralized logout function from AppContext
            logout()
        } catch (error) {
            console.error("Error during logout:", error)
            // Fallback: use the centralized logout anyway
            logout()
        }
    }

    const handleStatusChange = (
        label: string,
        value: string,
        color: string,
        border: string = ""
    ) => {
        if (!currentUser?.id) {
            setError("Utilisateur non connecté")
            return
        }

        // Prevent multiple rapid clicks during loading
        if (loading) {
            return
        }

        setStatus({ label, value, color, border })
        setLoading(true)
        setError("")
        setLoginError("")

        try {
            const payload = {
                update_user_request: {
                    id: currentUser.id,
                    disturb_status: value,
                },
            }
            controleur?.envoie(handler, payload)
        } catch (err) {
            setError("La connexion a échoué. Veuillez réessayer.")
            setLoading(false)
        }
    } // Auto-close popup on successful status change - disabled to prevent accidental clicks
    // useEffect(() => {
    //     if (!loading && !error && !loginError && status.value && isMenuOpen) {
    //         const timer = setTimeout(() => {
    //             setIsMenuOpen(false)
    //         }, 1000)
    //         return () => clearTimeout(timer)
    //     }
    // }, [loading, error, loginError, status.value, isMenuOpen])

    return (
        <div className={styles.container} style={{ position: "relative" }}>
            {" "}
            <button
                ref={buttonRef}
                className={styles.profileButton}
                onClick={() => setIsOpen(!isOpen)}
                style={{ position: "relative" }} // Pour positionner l'indicateur
            >
                <img
                    alt="Profile"
                    className={styles.profileImage}
                    src={
                        imageError
                            ? getProfilePictureUrl()
                            : getProfilePictureUrl(currentUser?.picture)
                    }
                    onError={() => setImageError(true)}
                />

                {/* Indicateur de statut */}
                <span
                    style={{
                        backgroundColor: status.color,
                        border: status.border || "none",
                        position: "absolute",
                        bottom: -2,
                        right: -2,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        boxSizing: "border-box",
                        boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                    }}
                />
            </button>
            {isOpen && (
                <div ref={popUpRef} className={styles.popUp}>
                    {" "}
                    {/* Messages d'erreur */}
                    {error && (
                        <div className={styles.errorMessage}>{error}</div>
                    )}
                    {loginError && (
                        <div className={styles.errorMessage}>{loginError}</div>
                    )}
                    <div className={styles.infosProfil}>
                        <img
                            className={styles.photoProfil}
                            src={
                                imageError
                                    ? getProfilePictureUrl()
                                    : getProfilePictureUrl(currentUser?.picture)
                            }
                            alt="profile"
                            onError={() => setImageError(true)}
                        />
                        <div className={styles.infos}>
                            <p className={styles.names}>
                                {currentUser?.firstname} {currentUser?.lastname}
                            </p>
                            <p className={styles.job}>
                                {currentUser?.job || "Étudiant"}
                            </p>
                        </div>
                    </div>{" "}
                    <div
                        className={`${styles.shadowBloc} ${styles.status}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {" "}
                        <div className={styles.statusContent}>
                            <span
                                className={styles.dot}
                                style={{
                                    backgroundColor: status.color,
                                    border: status.border,
                                }}
                            />
                            <p>
                                {loading ? "Mise à jour..." : status.label}
                                {loading && (
                                    <span
                                        className={styles.loadingIndicator}
                                        style={{ marginLeft: "8px" }}
                                    />
                                )}
                            </p>
                        </div>
                        <ChevronRight
                            size={21}
                            color="#636363"
                            strokeWidth={3}
                            style={{
                                transform: isMenuOpen
                                    ? "rotate(90deg)"
                                    : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                            }}
                        />{" "}
                        {isMenuOpen && !loading && (
                            <div className={styles.menu}>
                                <div
                                    className={styles.menuItem}
                                    onClick={() => {
                                        handleStatusChange(
                                            "En ligne",
                                            "available",
                                            "#1CE148"
                                        )
                                        setIsMenuOpen(false)
                                    }}
                                    style={{
                                        cursor: loading
                                            ? "not-allowed"
                                            : "pointer",
                                    }}
                                >
                                    <span
                                        className={styles.dot}
                                        style={{ backgroundColor: "#1CE148" }}
                                    />
                                    <span>En ligne</span>
                                </div>{" "}
                                <div
                                    className={styles.menuItem}
                                    onClick={() => {
                                        handleStatusChange(
                                            "Ne pas déranger",
                                            "dnd",
                                            "#CB0000"
                                        )
                                        setIsMenuOpen(false)
                                    }}
                                    style={{
                                        cursor: loading
                                            ? "not-allowed"
                                            : "pointer",
                                    }}
                                >
                                    <span
                                        className={styles.dot}
                                        style={{ backgroundColor: "#CB0000" }}
                                    />
                                    <span>Ne pas déranger</span>
                                </div>{" "}
                                <div
                                    className={styles.menuItem}
                                    onClick={() => {
                                        handleStatusChange(
                                            "Invisible",
                                            "offline",
                                            "white",
                                            "#898989 3px solid"
                                        )
                                        setIsMenuOpen(false)
                                    }}
                                    style={{
                                        cursor: loading
                                            ? "not-allowed"
                                            : "pointer",
                                    }}
                                >
                                    <span
                                        className={styles.dot}
                                        style={{
                                            backgroundColor: "white",
                                            border: "#898989 3px solid",
                                        }}
                                    />
                                    <span>Invisible</span>
                                </div>
                            </div>
                        )}
                    </div>{" "}
                    <div
                        onClick={() => {
                            if (!loading) {
                                setIsOpen(false)
                                router.push("/profil")
                            }
                        }}
                        className={`${styles.shadowBloc} ${styles.parametres}`}
                        style={{
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        <Settings size={21} />
                        <p>Paramètres</p>
                    </div>
                    <div
                        onClick={loading ? undefined : handleLogout}
                        className={`${styles.shadowBloc} ${styles.deconnexion}`}
                        style={{
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        <LogOut size={21} />
                        <p>Déconnexion</p>
                    </div>
                </div>
            )}
        </div>
    )
}
