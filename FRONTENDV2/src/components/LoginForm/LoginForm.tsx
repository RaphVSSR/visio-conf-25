import { useState, useEffect, FormEvent } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Link, useNavigate } from "react-router-dom";
import "./LoginForm.scss";
import { useAuth } from "hooks/useAuth";

export const LoginForm = () => {

    const [pwdStatus, setPwdStatus] = useState<"shown" | "hidden">("hidden");
    const { login, isLoading, isAuthenticated, pendingLoginRequestId, loginRejected } = useAuth();
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
            <section id="loginForm">
                <img
                    src="logos/logo_univ_grand.svg"
                    alt="Logo du formulaire de connexion."
                />
                <h1>En attente d'approbation</h1>
                <p className="pendingMessage">
                    Une session active existe sur un autre appareil.
                    En attente de l'approbation...
                </p>
            </section>
        );
    }

    return (

        <form id="loginForm" onSubmit={handleSubmit}>
            <img
                src="logos/logo_univ_grand.svg"
                alt="Logo du formulaire de connexion."
            />

            <h1>Se connecter</h1>
            {loginRejected && <p className="rejectedMessage">Connexion refusée — la session active a refusé votre demande.</p>}
            {error && <p className="error">{error}</p>}
            <fieldset id="inputWrapper">

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

            </fieldset>
            <footer id="footerForm">

                <button
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? "Connexion en cours..." : "Se connecter"}
                </button>
                <Link to="/signup" id="signupLink">Créer son compte</Link>

            </footer>
        </form>
    )
}
