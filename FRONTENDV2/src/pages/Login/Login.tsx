import React, { FC } from 'react'
import { Link } from 'react-router-dom'
import "./Login.scss"
import { LoginForm } from 'components';

export const Login: FC = () => {

    return (
        <main id="loginPage" style={{ background: "url('backgrounds/backLogin.jpg')"}}>
            
            <LoginForm />
            
        </main>
    )

}
