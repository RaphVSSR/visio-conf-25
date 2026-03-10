import React, { FC } from 'react'

import "./Login.scss"
import { LoginForm } from 'components';

export const Login: FC = () => {

    return (
        <main id="loginPage" style={{ backgroundImage: "url('backgrounds/backLogin.jpg')"}}>
            
            <LoginForm />
            
        </main>
    )

}
