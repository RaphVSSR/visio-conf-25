"use client"

import { useState, useEffect, FormEvent, useRef, useContext } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Link, Navigate, useNavigate } from "react-router-dom";
import "./LoginForm.scss";
import { AuthClient } from "core/AuthClient";
import { SessionContext } from "contexts/SessionContext";

export const LoginForm = () => {
    //const { controleur, canal, currentUser, setCurrentUser } = useAppContext()
    //const listeMessageEmis = ["login_request"]
    //const listeMessageRecus = ["login_response"]

    //console.log("API URL:", process.env.NEXT_PUBLIC_API_URL)

    //const nomDInstance = "LoginForm"
    //const verbose = false

    //const router = useRouter()

    //const handler = {
    //    nomDInstance,
    //    traitementMessage: (msg: {
    //        login_response?: {
    //            etat: boolean
    //            token?: string
    //        }
    //    }) => {
    //        if (verbose || controleur?.verboseall)
    //            console.log(
    //                `INFO: (${nomDInstance}) - traitementMessage - `,
    //                msg
    //            )

    //        if (msg.login_response) {
    //            if (msg.login_response.etat === false) {
    //                // Si la connexion échoue, nous ne savons pas exactement pourquoi
    //                // donc nous affichons un message d'erreur générique sur l'email
    //                setLoginError("Email ou mot de passe incorrect")
    //            } else {
    //                setLoginError("")
    //                const token = msg.login_response.token
    //                if (token) {
    //                    // Configuration plus souple des cookies
    //                    Cookies.set("token", token, {
    //                        secure: window.location.protocol === "https:", // Secure uniquement en HTTPS
    //                        sameSite: "lax", // Moins restrictif que "strict"
    //                        expires: 7, // 7 jours
    //                        path: "/", // Explicitement définir le chemin
    //                    })

    //                    // Stockage de secours dans localStorage
    //                    try {
    //                        localStorage.setItem("auth_token", token)
    //                    } catch (e) {
    //                        console.error(
    //                            "Impossible de stocker le token dans localStorage",
    //                            e
    //                        )
    //                    }
    //                }
    //                router.push("/")
    //            }
    //        }
    //    },
    //}

    //useEffect(() => {
    //    if (currentUser) {
    //        router.push("/")
    //    } else if (controleur) {
    //        controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
    //        return () => {
    //            controleur.desincription(
    //                handler,
    //                listeMessageEmis,
    //                listeMessageRecus
    //            )
    //        }
    //    }
    //}, [controleur, currentUser])
    
    const [pwdStatus, setPwdStatus] = useState<"shown" | "hidden">("hidden");
    //const [showPassword, setShowPassword] = useState(false)
    //const [error, setError] = useState("")
    const signInData = useRef<{ [key: string]: string } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const navigate = useNavigate();
    const session = useContext(SessionContext);
    
    //const [loginError, setLoginError] = useState("")

    //const handleSubmit = async (e: React.FormEvent) => {
    //    e.preventDefault()
    //    setLoading(true)
    //    setError("")

    //    try {
    //        // S'assurer que le socket est connecté avant d'envoyer la requête
    //        if (!canal?.socket?.connected) {
    //            console.log("Socket not connected, attempting to connect...")
    //            canal?.socket?.connect()

    //            // Attendre que la connexion soit établie
    //            await new Promise<void>((resolve, reject) => {
    //                let attempts = 0
    //                const maxAttempts = 30 // 3 secondes

    //                const checkConnection = () => {
    //                    attempts++
    //                    if (canal?.socket?.connected) {
    //                        resolve()
    //                    } else if (attempts >= maxAttempts) {
    //                        reject(
    //                            new Error(
    //                                "Impossible de se connecter au serveur"
    //                            )
    //                        )
    //                    } else {
    //                        setTimeout(checkConnection, 100)
    //                    }
    //                }

    //                checkConnection()
    //            })
    //        }

    //        let T = {
    //            login_request: { email, password },
    //        }
    //        controleur?.envoie(handler, T)
    //    } catch (err) {
    //        setError("La connexion a échoué. Veuillez réessayer.")
    //        console.error("Login error:", err)
    //    } finally {
    //        setLoading(false)
    //    }
    //}

    useEffect(() => {
        
        signInData.current && (async () => {
                
            await AuthClient.signIn.email({
                email: signInData.current!.email!, // required
                password: signInData.current!.password!, // required
                rememberMe: true,
                callbackURL: "/home",
            });
            
        })();

    }, [signInData.current])

    function signInSubmitting(event: FormEvent<HTMLFormElement>){
    
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        !form.checkValidity() ? form.reportValidity() : setIsLoading(!isLoading);

        signInData.current = Object.fromEntries(formData.entries()) as { [key: string]: string };

    }

    return (

        <form id="loginForm" onSubmit={signInSubmitting}> 
            <img
                src="logos/logo_univ_grand.svg"
                alt="Logo du formulaire de connexion."
            />

            <h1>Se connecter</h1>
            <div id="inputWrapper">

                <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Email"
                    //value={email}
                    //onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <div id="pwdWrapper">
                    <input
                        type={pwdStatus === "shown" ? "text" : "password"}
                        id="password"
                        name="password"
                        placeholder="Password"
                        //value={password}
                        //onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {pwdStatus === "shown" ? <EyeOff className="pwdVisibilityIco" size={20} onClick={() => setPwdStatus("hidden")}/> : <Eye className="pwdVisibilityIco" size={20} onClick={() => setPwdStatus("shown")}/>}
                    {/*{loginError && (
                        <p className={styles.errorMessage}>{loginError}</p>
                    )}*/}
                </div>

            </div>
            <div id="footerForm">

                <button
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Connexion en cours..." : "Se connecter"}
                </button>
                <Link to="/signup" id="signupLink">Créer son compte</Link>

            </div>
        </form>
    )
}
