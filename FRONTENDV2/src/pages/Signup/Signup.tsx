import { SignupForm } from 'components/SignupForm/SignupForm';
import React, { FC } from 'react'
import "./Signup.scss"

export const Signup: FC = () => {

  return (

    <main id="signupPage" style={{ backgroundImage: "url('backgrounds/backLogin.jpg')"}}>

      <SignupForm />

    </main>
  );
}
