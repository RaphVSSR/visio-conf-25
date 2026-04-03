"use client"
import { motion } from "framer-motion"
import styles from "./ChannelSkeleton.module.css"

interface ChannelSkeletonProps {
  count?: number
}

export default function ChannelSkeleton({ count = 3 }: ChannelSkeletonProps) {
  return (
    <div className={styles.skeletonContainer}>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={styles.skeletonItem}
          >
            <div className={styles.skeletonIcon}></div>
            <div className={styles.skeletonText}></div>
          </motion.div>
        ))}
    </div>
  )
}
