"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import LoginForm from "../../components/LoginForm"
import styles from "./login.module.css"
import Image from "next/image"
import Link from "next/link"
import { useAppContext } from "@/context/AppContext"

export default function LoginPage() {
    const router = useRouter()

    const { currentUser } = useAppContext()

    useEffect(() => {
        const token = Cookies.get("token") // Use cookies instead of localStorage
        if (token) {
            if (currentUser) {
                router.push("/")
            }
        }
    }, [])

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <Image
                    src="/logo_Univ_grand.svg"
                    alt="Logo"
                    width={340}
                    height={100}
                    priority
                />
                <LoginForm />
                <p className={styles.signup}>
                    <Link href="/signup" className={styles.link}>
                        Pas encore de compte ?
                    </Link>
                </p>
            </main>
        </div>
    )
}
