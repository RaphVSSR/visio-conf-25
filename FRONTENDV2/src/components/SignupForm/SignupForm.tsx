import { Eye, EyeOff } from 'lucide-react'
import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import "./SignupForm.scss"

export const SignupForm = () => {

	const [showPwd, setShowPwd] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	return (

		//TODO : Mettre son onSubmit : onSubmit={handleSubmit}
        <form id="signupForm">
            {/*{error && <div className={styles.error}>{error}</div>}*/}

			<img
                src="logos/logo_univ_grand.svg"
                alt="Logo du formulaire d'inscription."
            />

			<h1>Créer son compte</h1>

			<div id="inputWrapper">

				<input id="firstname" type="text" placeholder='Prénom' required/>

				<input id="lastname" type="text" placeholder='Nom' required/>

				<input id="email" type="email" placeholder='Email' required/>

				<div id="pwdWrapper">

					<input id="password" type={showPwd ? "text" : "password"} placeholder='Mot de passe' required/>

					{showPwd
						? <EyeOff className='pwdIco' size={20} onClick={() => setShowPwd(!showPwd)}/>
						: <Eye className='pwdIco' size={20} onClick={() => setShowPwd(!showPwd)}/>}
				</div>

				<input id="phone" type="tel" placeholder='Téléphone' required/>

				<input id="job" type="text" placeholder="Activité" required/>

				<input id="desc" type="text" placeholder='Description du compte' required/>

			</div>

			<div id="signupFooter">

				<button
					id="submitBtn"
					type="submit"
					onClick={() => setIsLoading(!isLoading)}
					disabled={isLoading}
				>
					{isLoading ? "Inscription en cours..." : "Inscription"}
				</button>

				<Link to="/login" id="loginLink">Déjà un compte ?</Link>

			</div>
        </form>

    )
}
