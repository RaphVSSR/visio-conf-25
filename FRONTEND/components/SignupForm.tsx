"use client"

import type React from "react"

import { useState, useEffect } from "react"
import styles from "./SignupForm.module.css"
import { useAppContext } from "@/context/AppContext"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react" // Import des icônes
import Cookies from "js-cookie"

export default function SignupForm() {
    const { controleur, canal, currentUser, setCurrentUser } = useAppContext()
    const router = useRouter()
    // Messages
    const listeMessageEmis = ["signup_request"]
    const listeMessageRecus = ["signup_response"]

    const nomDInstance = "SignupForm"
    const verbose = false
    // Define the common handler instead of using useRef
    const handler = {
        nomDInstance,
        traitementMessage: (msg: {
            signup_response?: {
                etat: boolean
                token?: string
            }
        }) => {
            if (verbose || controleur.verboseall)
                console.log(
                    `INFO: (${nomDInstance}) - traitementMessage - `,
                    msg
                )
            if (msg.signup_response) {
                if (!msg.signup_response.etat) {
                    setError("Signup failed. Please try again.")
                } else {
                    const token = msg.signup_response.token
                    if (token) {
                        // Configuration plus souple des cookies
                        Cookies.set("token", token, {
                            secure: window.location.protocol === "https:", // Secure uniquement en HTTPS
                            sameSite: "lax", // Moins restrictif que "strict"
                            expires: 7, // 7 jours
                            path: "/", // Explicitement définir le chemin
                        })

                        // Stockage de secours dans localStorage
                        try {
                            localStorage.setItem("auth_token", token)
                        } catch (e) {
                            console.error(
                                "Impossible de stocker le token dans localStorage",
                                e
                            )
                        }
                    }
                    router.push("/")
                }
            }
        },
    }

    // Subscribe using the common controller instance
    useEffect(() => {
        if (currentUser) {
            router.push("/")
        } else if (controleur) {
            controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
            return () => {
                controleur.desincription(
                    handler,
                    listeMessageEmis,
                    listeMessageRecus
                )
            }
        }
    }, [controleur, currentUser])

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [firstname, setFirstname] = useState("")
    const [lastname, setLastname] = useState("")
    const [phone, setPhone] = useState("")
    const [job, setJob] = useState("")
    const [desc, setDesc] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [signupError, setSignupError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // S'assurer que le socket est connecté avant d'envoyer la requête
            if (!canal?.socket?.connected) {
                console.log("Socket not connected, attempting to connect...")
                canal?.socket?.connect()

                // Attendre que la connexion soit établie
                await new Promise<void>((resolve, reject) => {
                    let attempts = 0
                    const maxAttempts = 30 // 3 secondes

                    const checkConnection = () => {
                        attempts++
                        if (canal?.socket?.connected) {
                            resolve()
                        } else if (attempts >= maxAttempts) {
                            reject(
                                new Error(
                                    "Impossible de se connecter au serveur"
                                )
                            )
                        } else {
                            setTimeout(checkConnection, 100)
                        }
                    }

                    checkConnection()
                })
            }

            let T = {
                signup_request: {
                    email,
                    password,
                    firstname,
                    lastname,
                    phone: phone,
                    job: job,
                    desc: desc,
                },
            }
            controleur?.envoie(handler, T)
        } catch (err) {
            setError("Signup failed. Please try again.")
            console.error("Signup error:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form className={styles.signupForm} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.formGroupRow}>
                <div className={styles.formGroup}>
                    <label htmlFor="firstname">Prénom:</label>
                    <input
                        type="text"
                        id="firstname"
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="lastname">Nom:</label>
                    <input
                        type="text"
                        id="lastname"
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                        required
                    />
                </div>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="password">Mot de passe:</label>
                <div className={styles.passwordContainer}>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${styles.input} ${
                            signupError ? styles.error : ""
                        }`}
                        required
                    />
                    <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <EyeOff size={20} />
                        ) : (
                            <Eye size={20} />
                        )}
                    </button>
                </div>
            </div>
            <div className={styles.formGroupRow}>
                <div className={styles.formGroup}>
                    <label htmlFor="phone">Téléphone:</label>
                    <input
                        type="text"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="job">Job:</label>
                    <input
                        type="text"
                        id="job"
                        value={job}
                        onChange={(e) => setJob(e.target.value)}
                        required
                    />
                </div>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="desc">Description:</label>
                <input
                    type="text"
                    id="desc"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    required
                />
            </div>
            <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
            >
                {loading ? "Inscription en cours..." : "Inscription"}
            </button>
        </form>
    )
}
