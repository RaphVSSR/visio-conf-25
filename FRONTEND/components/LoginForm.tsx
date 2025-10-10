"use client"

import type React from "react"

import { useState, useEffect } from "react"
import styles from "./LoginForm.module.css"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/context/AppContext"
import { Eye, EyeOff } from "lucide-react"
import Cookies from "js-cookie"

export default function LoginForm() {
    const { controleur, canal, currentUser, setCurrentUser } = useAppContext()
    const listeMessageEmis = ["login_request"]
    const listeMessageRecus = ["login_response"]

    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL)

    const nomDInstance = "LoginForm"
    const verbose = false

    const router = useRouter()

    const handler = {
        nomDInstance,
        traitementMessage: (msg: {
            login_response?: {
                etat: boolean
                token?: string
            }
        }) => {
            if (verbose || controleur?.verboseall)
                console.log(
                    `INFO: (${nomDInstance}) - traitementMessage - `,
                    msg
                )

            if (msg.login_response) {
                if (msg.login_response.etat === false) {
                    // Si la connexion échoue, nous ne savons pas exactement pourquoi
                    // donc nous affichons un message d'erreur générique sur l'email
                    setLoginError("Email ou mot de passe incorrect")
                } else {
                    setLoginError("")
                    const token = msg.login_response.token
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
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [loginError, setLoginError] = useState("")

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
                login_request: { email, password },
            }
            controleur?.envoie(handler, T)
        } catch (err) {
            setError("La connexion a échoué. Veuillez réessayer.")
            console.error("Login error:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form className={styles.loginForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${styles.input} ${
                        loginError ? styles.error : ""
                    }`}
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
                            loginError ? styles.error : ""
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
                {loginError && (
                    <div className={styles.errorMessage}>{loginError}</div>
                )}
            </div>
            <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
            >
                {loading ? "Connexion en cours..." : "Connexion"}
            </button>
        </form>
    )
}
