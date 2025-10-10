import type { Metadata } from "next"
import "./globals.css"
import "../styles/scrollbar.css"

import { AppContextProvider } from "@/context/AppContext"
import LayoutClient from "@/components/layoutClient"

export const metadata: Metadata = {
    title: "VisioConf",
    description: "VisioConf 2024 - 2025",
    icons: {
        icon: "/Logo_Univ.png",
        shortcut: "/Logo_Univ.png",
        apple: "/Logo_Univ.png",
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="fr">
            <body>
                {/* 
                AppContextProvider : Fournit le contexte global de l'application à tous les composants enfants.
                
                Il gère :
                - L'état de l'utilisateur connecté (currentUser)
                - Les instances globales du Controleur et CanalSocketio pour la communication avec le backend
                - L'authentification automatique via les tokens stockés (cookies/localStorage)
                - La reconnexion automatique du socket selon les pages (login/signup)
                - La déconnexion automatique en cas d'erreur d'authentification
                - La fonction logout pour nettoyer les données et rediriger
                
                Placé dans le RootLayout, ce provider garantit que le contexte est disponible 
                sur toutes les pages de l'application, permettant à n'importe quel composant 
                d'accéder aux données utilisateur et aux services de communication via useAppContext().
                */}
                <AppContextProvider>
                    <LayoutClient>{children}</LayoutClient>
                </AppContextProvider>
            </body>
        </html>
    )
}
