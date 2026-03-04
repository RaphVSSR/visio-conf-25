import { useState, useEffect, FormEvent } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Link, useNavigate } from "react-router-dom";
import "./LoginForm.scss";
import { useAuth } from "hooks/useAuthMessages";

/**
 * Formulaire de connexion.
 * Utilise le contrôleur pour envoyer le message `login` via Socket.io.
 * Redirige vers /home après un login réussi.
 */
export const LoginForm = () => {

    const [pwdStatus, setPwdStatus] = useState<"shown" | "hidden">("hidden");
    const { login, isLoading, isAuthenticated, pendingLoginRequestId } = useAuth();
    const [error, setError] = useState<string>("");
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) navigate("/home", { replace: true })
    }, [isAuthenticated, navigate])

    function handleSubmit(event: FormEvent<HTMLFormElement>) {

        event.preventDefault();

        const form = event.currentTarget;
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        setError("");
        login(email, password);
    }

    if (pendingLoginRequestId) {
        return (
            <div id="loginForm">
                <img
                    src="logos/logo_univ_grand.svg"
                    alt="Logo du formulaire de connexion."
                />
                <h1>En attente d'approbation</h1>
                <p style={{ textAlign: "center", color: "#555", padding: "1rem" }}>
                    Une session active existe sur un autre appareil.
                    En attente de l'approbation...
                </p>
            </div>
        );
    }

    return (

        <form id="loginForm" onSubmit={handleSubmit}>
            <img
                src="logos/logo_univ_grand.svg"
                alt="Logo du formulaire de connexion."
            />

            <h1>Se connecter</h1>
            {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
            <div id="inputWrapper">

                <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Email"
                    required
                />
                <div id="pwdWrapper">
                    <input
                        type={pwdStatus === "shown" ? "text" : "password"}
                        id="password"
                        name="password"
                        placeholder="Password"
                        required
                    />

                    {pwdStatus === "shown" ? <EyeOff className="pwdVisibilityIco" size={20} onClick={() => setPwdStatus("hidden")}/> : <Eye className="pwdVisibilityIco" size={20} onClick={() => setPwdStatus("shown")}/>}
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
