import { Eye, EyeOff } from "lucide-react";
import React, { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignupForm.scss";
import { useAuth } from "hooks/useAuth";

/**
 * Formulaire d'inscription.
 * Utilise le contrôleur pour envoyer le message `register` via Socket.io.
 */
export const SignupForm = () => {
  const [showPwd, setShowPwd] = useState<boolean>(false);
  const { register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/home", { replace: true });
  }, [isAuthenticated, navigate]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);

    register({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      firstname: formData.get("firstname") as string,
      lastname: formData.get("lastname") as string,
      phone: formData.get("phone") as string,
    });
  }

  return (
    <form id="signupForm" onSubmit={handleSubmit}>
      <img
        src="logos/logo_univ_grand.svg"
        alt="Logo du formulaire d'inscription."
      />

      <h1>Créer son compte</h1>

      <fieldset id="inputWrapper">
        <input
          id="firstname"
          name="firstname"
          type="text"
          placeholder="Prénom"
          required
        />

        <input
          id="lastname"
          name="lastname"
          type="text"
          placeholder="Nom"
          required
        />

        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
        />

        <div id="pwdWrapper">
          <input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            placeholder="Mot de passe"
            minLength={8}
            required
          />

          {showPwd ? (
            <EyeOff
              className="pwdIco"
              size={20}
              onClick={() => setShowPwd(!showPwd)}
            />
          ) : (
            <Eye
              className="pwdIco"
              size={20}
              onClick={() => setShowPwd(!showPwd)}
            />
          )}
        </div>

        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="Téléphone"
          required
        />
      </fieldset>

      <footer id="signupFooter">
        <button id="submitBtn" type="submit" disabled={isLoading}>
          {isLoading ? "Inscription en cours..." : "Inscription"}
        </button>

        <Link to="/login" id="loginLink">
          Déjà un compte ?
        </Link>
      </footer>
    </form>
  );
};
