"use client"

import { motion } from "framer-motion"
import styles from "./FileSkeleton.module.css"

export function FileItemSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  return (
    <div className={`${styles.skeletonContainer} ${styles[viewMode]}`}>
      <div className={styles.iconSkeleton}></div>
      <div className={styles.contentSkeleton}>
        <div className={styles.nameSkeleton}></div>
        {viewMode === "list" && (
          <>
            <div className={styles.dateSkeleton}></div>
            <div className={styles.sizeSkeleton}></div>
          </>
        )}
      </div>
    </div>
  )
}

export function FileListSkeleton({ viewMode, count = 8 }: { viewMode: "grid" | "list"; count?: number }) {
  return (
    <div className={`${styles.listContainer} ${styles[viewMode]}`}>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <FileItemSkeleton viewMode={viewMode} />
          </motion.div>
        ))}
    </div>
  )
}

