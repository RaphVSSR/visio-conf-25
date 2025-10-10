"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import SignupForm from "../../components/SignupForm";
import styles from "./signup.module.css";
import Image from "next/image";
import Link from "next/link";
import { AppContextProvider } from "../../context/AppContext"; // Import the provider

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    const loggedIn = Cookies.get("loggedIn");
    if (loggedIn) {
      router.push("/");
    }
  }, []);

  return (
    <AppContextProvider>
      {" "}
      {/* Wrap your component with the provider */}
      <div className={styles.page}>
        <main className={styles.main}>
          <Image
            src="/logo_Univ_grand.svg"
            alt="Logo"
            width={340}
            height={100}
            priority
          />
          <SignupForm />
          <p className={styles.signup}>
            <Link href="/login" className={styles.link}>
              Déjà un compte ?
            </Link>
          </p>
        </main>
      </div>
    </AppContextProvider>
  );
}
