"use client"

import { motion } from "framer-motion"
import styles from "./UserSkeleton.module.css"

export default function UserSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.avatarSkeleton}></div>
      <div className={styles.contentSkeleton}>
        <div className={styles.nameSkeleton}></div>
        <div className={styles.emailSkeleton}></div>
      </div>
    </div>
  )
}

export function UsersListSkeleton() {
  return (
    <>
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <UserSkeleton />
          </motion.div>
        ))}
    </>
  )
}

