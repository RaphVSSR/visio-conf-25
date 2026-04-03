"use client";
import type { User } from "../types/User";
import styles from "./UserInfo.module.css";
import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Phone, MessageCircle } from "lucide-react";

interface UserInfoProps {
  user: User;
  currentUserEmail: string;
  onMessageUser?: (user: User) => void;
}

export default function UserInfo({
  user,
  currentUserEmail,
  onMessageUser,
}: UserInfoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isCurrentUser = user.email === currentUserEmail;

  // Create a fullName from firstname and lastname
  const fullName = `${user.firstname} ${user.lastname}`;

  // Generate initials from fullName
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  // Generate a consistent color based on fullName
  const getColorFromName = (name: string) => {
    const colors = [
      "#1E3664", // indigo
      "#0EA5E9", // sky
      "#10B981", // emerald
      "#F59E0B", // amber
      "#EC4899", // pink
      "#8B5CF6", // violet
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const avatarColor = getColorFromName(fullName);

  const handleMessageClick = () => {
    if (onMessageUser) {
      onMessageUser(user);
    }
  };

  return (
    <motion.li
      className={`${styles.userCard} ${
        isCurrentUser ? styles.currentUser : ""
      }`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div
        className={styles.userAvatar}
        style={{ backgroundColor: avatarColor }}
      >
        {initials}
      </div>
      <div className={styles.userInfo}>
        <h3 className={styles.userName}>{fullName}</h3>
        <div className={styles.userDetails}>
          <span className={styles.userEmail}>
            <Mail size={14} />
            {user.email}
          </span>
          {user.phone && (
            <span className={styles.userPhone}>
              <Phone size={14} />
              {user.phone}
            </span>
          )}
        </div>
      </div>
      <motion.div
        className={styles.userActions}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
        transition={{ duration: 0.2 }}
      >
        <button
          className={styles.actionButton}
          aria-label="Message"
          onClick={handleMessageClick}
        >
          <MessageCircle size={18} />
          <span>Message</span>
        </button>
      </motion.div>
    </motion.li>
  );
}
