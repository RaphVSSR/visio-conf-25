import { Eye, EyeOff } from 'lucide-react'
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom';
import "./SignupForm.scss"
import { AuthClient } from 'core/AuthClient';

export const SignupForm = () => {

	const [showPwd, setShowPwd] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const signUpData = useRef<{ [key: string]: string } | null>(null);
	const navigate = useNavigate();
	
	useEffect(() => {
		
		signUpData.current && (async () => {
			
			await AuthClient.signUp.email({

				email: signUpData.current!.email!,
				password: signUpData.current!.password!,
				name: signUpData.current!.firstname!,
				//image, // User image URL (optional)
				callbackURL: "/home" // A URL to redirect to after the user verifies their email (optional)

			}, {
				onRequest: (ctx) => {
					//show loading
				},
				onSuccess: (ctx) => {
					
					navigate("/home", {replace: true});
				},
				onError: (ctx) => {

					setIsLoading(!isLoading);
					alert(ctx.error.message);
				},
			});

		})()
		
	}, [signUpData.current])

	function signUpSubmitting(event: FormEvent<HTMLFormElement>){

		event.preventDefault();

		const form = event.currentTarget;
		const formData = new FormData(form);

		!form.checkValidity() ? form.reportValidity() : setIsLoading(!isLoading);

		signUpData.current = Object.fromEntries(formData.entries()) as { [key: string]: string };

	}

	return (

        <form id="signupForm" onSubmit={signUpSubmitting}>

            {/*{error && <div className={styles.error}>{error}</div>}*/}

			<img
                src="logos/logo_univ_grand.svg"
                alt="Logo du formulaire d'inscription."
            />

			<h1>Créer son compte</h1>

			<div id="inputWrapper">

				<input id="firstname" name="firstname" type="text" placeholder='Prénom' required/>

				<input id="lastname" name="lastname" type="text" placeholder='Nom' required/>

				<input id="email" name="email" type="email" placeholder='Email' required/>

				<div id="pwdWrapper">

					<input id="password" name="password" type={showPwd ? "text" : "password"} placeholder='Mot de passe' minLength={8} required/>

					{showPwd
						? <EyeOff className='pwdIco' size={20} onClick={() => setShowPwd(!showPwd)}/>
						: <Eye className='pwdIco' size={20} onClick={() => setShowPwd(!showPwd)}/>}
				</div>

				<input id="phone" name="phone" type="tel" placeholder='Téléphone' required/>

				<input id="job" name="job" type="text" placeholder="Activité" required/>

				<input id="desc" name="desc" type="text" placeholder='Description du compte' required/>

			</div>

			<div id="signupFooter">

				<button
					id="submitBtn"
					type="submit"
					disabled={isLoading}
				>
					{isLoading ? "Inscription en cours..." : "Inscription"}
				</button>

				<Link to="/login" id="loginLink">Déjà un compte ?</Link>

			</div>
        </form>

    )
}
