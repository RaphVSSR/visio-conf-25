"use client"

import Link from "next/link"
import { Frown, Home, Mail } from "lucide-react"
import { motion } from "framer-motion"
import styles from "./not-found.module.css" // Import du CSS Module

// Crée un composant Link compatible avec framer-motion
const MotionLink = motion(Link)

export default function NotFound() {
  return (
    <div className={styles["page-404"]}>
      <motion.div
        className={styles["header-404"]}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles["titleContainer-404"]}>
          <Frown className={`${styles["icon-404"]} ${styles["animate-bounce"]}`} />
          <h1 className={styles["title-404"]}>{"404"}</h1>
        </div>
        <p className={styles["subtitle-404"]}>Oups ! La page que vous recherchez n'a pas été trouvée.</p>
      </motion.div>

      <motion.main
        className={styles["main-404"]}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p className={styles["main-text"]}>
          Il semble que vous ayez pris un mauvais virage. Ne vous inquiétez pas, nous sommes là pour vous aider à
          retrouver votre chemin.
        </p>
        <div className={styles["button-container"]}>
          <MotionLink href="/" className={styles["button-primary"]} whileTap={{ scale: 0.98 }}>
            <Home className={styles["button-icon"]} />
            Retour à l'accueil
          </MotionLink>
        </div>
      </motion.main>
    </div>
  )
}
