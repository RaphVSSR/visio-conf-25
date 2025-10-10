"use client"

import { useAppContext } from "@/context/AppContext"
import styles from "./profilPage.module.css"
import { useState, useRef, useEffect } from "react"
import { ImageDown, Loader2, User as UserIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { User } from "@/types/User"
import { getProfilePictureUrl, getApiUrl } from "@/utils/fileHelpers"
import Cookies from "js-cookie"

export default function ProfilPage() {
    const { currentUser, controleur, canal, setCurrentUser } = useAppContext()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
    const pathname = usePathname()

    const nomDInstance = "ProfilPage"
    const verbose = false

    const listeMessageEmis = ["update_user_request"]

    const listeMessageRecus = ["update_user_response"]

    const formatDate = (dateValue: any) => {
        if (!dateValue) return "Non disponible"
        try {
            let dateObj
            if (
                typeof dateValue === "string" ||
                typeof dateValue === "number"
            ) {
                dateObj = new Date(dateValue)
            } else if (dateValue instanceof Date) {
                dateObj = dateValue
            } else if (dateValue.$date) {
                dateObj = new Date(dateValue.$date)
            } else {
                return "Format de date inconnu"
            }
            if (isNaN(dateObj.getTime())) return "Format de date invalide"
            return dateObj.toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch (error) {
            return "Format de date invalide"
        }
    }

    const handler = {
        nomDInstance,
        traitementMessage: (msg: {
            update_user_response?: {
                etat: boolean
                newUserInfo: User | null
                error?: string
            }
        }) => {
            if (verbose || controleur?.verboseall)
                console.log(
                    `INFO: (${nomDInstance}) - traitementMessage - `,
                    msg
                )

            if (msg.update_user_response) {
                if (msg.update_user_response.etat) {
                    setCurrentUser(msg.update_user_response.newUserInfo)
                    setUploadError(null)
                    setUploadSuccess(
                        "Photo de profil mise à jour avec succès !"
                    )
                    setTimeout(() => setUploadSuccess(null), 3000)
                } else {
                    setUploadError(
                        "Échec de la mise à jour du profil: " +
                            msg.update_user_response.error
                    )
                    setUploadSuccess(null)
                }
                setIsUploading(false)
            }
        },
    }

    useEffect(() => {
        if (controleur && canal && currentUser?.id) {
            // Log pour debug
            if (verbose)
                console.log(
                    "Inscription aux messages avec l'utilisateur:",
                    currentUser.id
                )

            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
        } else {
            // Log pour debug
            if (verbose)
                console.log("Impossible de s'inscrire aux messages:", {
                    controleur: !!controleur,
                    canal: !!canal,
                    userId: currentUser?.id,
                })
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
    }, [pathname, controleur, canal, currentUser])

    useEffect(() => {
        // Réinitialisation complète lorsque l'utilisateur change
        setSelectedFile(null)
        setIsUploading(false)
        setUploadError(null)
        setUploadSuccess(null)

        // Désinscription et réinscription
        if (controleur) {
            controleur.desincription(
                handler,
                listeMessageEmis,
                listeMessageRecus
            )

            if (canal && currentUser?.id) {
                controleur.inscription(
                    handler,
                    listeMessageEmis,
                    listeMessageRecus
                )
                if (verbose)
                    console.log(
                        "Réinscription pour le nouvel utilisateur:",
                        currentUser.id
                    )
            }
        }
    }, [currentUser?.id]) // Dépendance spécifique à l'ID utilisateur

    // Déclencher le clic sur l'input file quand le bouton est cliqué
    const handleEditPhotoClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    // Gérer le changement de fichier
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            uploadFile(file)
        }
    }

    const uploadFile = async (file: File) => {
        if (!currentUser) {
            setUploadError("Utilisateur non connecté")
            return
        }

        setIsUploading(true)
        setUploadError(null)
        setUploadSuccess(null)

        try {
            // Créer FormData pour l'upload
            const formData = new FormData()
            formData.append("profilePicture", file)

            // Récupérer le token d'authentification
            const token =
                Cookies.get("token") || localStorage.getItem("auth_token")

            if (!token) {
                throw new Error("Token d'authentification manquant")
            }

            // Envoyer le fichier au serveur backend
            const response = await fetch(
                `${getApiUrl()}/api/files/upload/profile`,
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: "include",
                }
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(
                    errorData.error || `Erreur HTTP: ${response.status}`
                )
            }

            const result = await response.json()

            if (result.success) {
                // Mettre à jour le profil utilisateur avec le nouveau nom de fichier
                const updateProfilePictureMessage = {
                    update_user_request: {
                        id: currentUser.id,
                        picture: result.filename,
                    },
                }

                if (controleur) {
                    controleur.envoie(handler, updateProfilePictureMessage)
                }
            } else {
                setUploadError(result.error || "Erreur lors de l'upload")
                setIsUploading(false)
            }
        } catch (error) {
            console.error("Erreur upload:", error)
            setUploadError(
                error instanceof Error
                    ? error.message
                    : "Erreur lors de l'upload du fichier"
            )
            setIsUploading(false)
        } // Réinitialiser l'input file
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    if (!currentUser) {
        return (
            <div className={styles.page}>
                <div className={styles.header}>
                    <div className={styles.titleContainer}>
                        <UserIcon className={styles.icon} />
                        <h1 className={styles.title}>Mon Profil</h1>
                    </div>
                    <p className={styles.subtitle}>
                        Gérez vos informations personnelles et votre photo de
                        profil
                    </p>
                </div>
                <main className={styles.main}>
                    <div>Chargement en cours...</div>
                </main>
            </div>
        )
    }

    // Ajout : filtrer les rôles valides
    const filteredRoles =
        currentUser.roles && Array.isArray(currentUser.roles)
            ? currentUser.roles.filter((role) => !!role && role !== "")
            : []

    console.log("filteredRoles", filteredRoles, currentUser)

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.titleContainer}>
                    <UserIcon className={styles.icon} />
                    <h1 className={styles.title}>Mon Profil</h1>
                </div>
                <p className={styles.subtitle}>
                    Gérez vos informations personnelles et votre photo de profil
                </p>
            </div>

            <main className={styles.main}>
                <div className={styles.profilCard}>
                    <div className={styles.photoContainer}>
                        <img
                            src={getProfilePictureUrl(currentUser.picture)}
                            alt="Photo de profil"
                            className={styles.profilePhoto}
                            onError={(e) => {
                                ;(e.target as HTMLImageElement).src =
                                    getProfilePictureUrl()
                            }}
                        />
                        <button
                            className={styles.editPhotoButton}
                            aria-label="Modifier la photo de profil"
                            onClick={handleEditPhotoClick}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <Loader2 className={styles.spinner} />
                            ) : (
                                <ImageDown />
                            )}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            className={styles.fileInput}
                            onChange={handleFileChange}
                        />
                    </div>
                    {uploadError && (
                        <p className={styles.errorMessage}>{uploadError}</p>
                    )}
                    {uploadSuccess && (
                        <p className={styles.successMessage}>{uploadSuccess}</p>
                    )}
                    <h3>
                        {currentUser.firstname || "Prénom"}{" "}
                        {currentUser.lastname || "Nom"}
                    </h3>
                    <p>{currentUser.desc || "Aucune description disponible"}</p>{" "}
                    <div className={styles.profilItemsContainer}>
                        <div className={styles.profilItem}>
                            <h4>Nom</h4>
                            <p>{currentUser.lastname || "Non renseigné"}</p>
                        </div>
                        <div className={styles.profilItem}>
                            <h4>Prénom</h4>
                            <p>{currentUser.firstname || "Non renseigné"}</p>
                        </div>
                        <div className={styles.profilItem}>
                            <h4>Email</h4>
                            <p>{currentUser.email || "Email non renseigné"}</p>
                        </div>
                        <div className={styles.profilItem}>
                            <h4>Métier</h4>
                            <p>{currentUser.job || "Non renseigné"}</p>
                        </div>
                        <div className={styles.profilItem}>
                            <h4>Compte créé</h4>
                            <p>{formatDate(currentUser.date_create)}</p>
                        </div>
                        <div className={styles.profilItem}>
                            <h4>Rôles</h4>
                            <p>
                                {currentUser.roles &&
                                Array.isArray(currentUser.roles) &&
                                filteredRoles.length > 0
                                    ? filteredRoles.join(", ")
                                    : "Aucun rôle attribué"}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
