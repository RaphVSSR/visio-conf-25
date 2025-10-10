"use client";
import type { User } from "../types/User";
import UserInfo from "./UserInfo";
import { UsersListSkeleton } from "./UserSkeleton";
import styles from "./UsersList.module.css";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UsersListProps {
  users: User[];
  currentUserEmail: string;
  isLoading?: boolean;
  onMessageUser?: (user: User) => void;
}

export default function UsersList({
  users,
  currentUserEmail,
  isLoading = false,
  onMessageUser,
}: UsersListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);

  useEffect(() => {
    const usersWithoutCurrent = users.filter(
      (user) => user.email !== currentUserEmail
    );

    if (searchTerm.trim() === "") {
      setFilteredUsers(usersWithoutCurrent);
    } else {
      const filtered = usersWithoutCurrent.filter((user) => {
        // Combine firstname and lastname as full name
        const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
        return (
          fullName.includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users, currentUserEmail]);

  return (
    <div className={styles.usersListContainer}>
      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <ul className={styles.usersList}>
          <UsersListSkeleton />
        </ul>
      ) : (
        <>
          <div className={styles.usersCount}>
            {filteredUsers.length} utilisateur
            {filteredUsers.length !== 1 ? "s" : ""}
          </div>
          <div className={styles.usersListWrapper}>
            <AnimatePresence>
              <ul className={styles.usersList}>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <motion.div
                      key={user.email}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                      }}
                    >
                      <UserInfo
                        user={user}
                        currentUserEmail={currentUserEmail}
                        onMessageUser={onMessageUser}
                      />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.noResults}
                  >
                    Aucun utilisateur trouvé
                  </motion.div>
                )}
              </ul>
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
