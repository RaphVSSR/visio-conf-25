"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./ChannelMembers.module.css"
import { Users, ChevronDown, ChevronUp, Crown, UserPlus } from "lucide-react"
import type { ChannelMember } from "@/types/Channel"
import { getProfilePictureUrl } from "@/utils/fileHelpers"

interface ChannelMembersProps {
    members: ChannelMember[]
    currentUserId: string
    isAdmin: boolean
    onInviteMember?: () => void
}

export default function ChannelMembers({
    members,
    currentUserId,
    isAdmin,
    onInviteMember,
}: ChannelMembersProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const admins = members.filter((member) => member.role === "admin")
    const regularMembers = members.filter((member) => member.role === "member")

    return (
        <div className={styles.membersContainer}>
            <button
                className={styles.toggleButton}
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <div className={styles.toggleInfo}>
                    <Users size={16} />
                    <span>
                        {members.length} membre{members.length > 1 ? "s" : ""}
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp size={16} />
                ) : (
                    <ChevronDown size={16} />
                )}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={styles.membersList}
                    >
                        {isAdmin && (
                            <button
                                className={styles.inviteButton}
                                onClick={onInviteMember}
                            >
                                <UserPlus size={16} />
                                <span>Inviter un membre</span>
                            </button>
                        )}

                        <div className={styles.membersSection}>
                            <h4 className={styles.sectionTitle}>
                                Administrateurs
                            </h4>{" "}
                            {admins.map((member) => (
                                <div
                                    key={member.id}
                                    className={styles.memberItem}
                                >
                                    <img
                                        src={getProfilePictureUrl(
                                            member.picture
                                        )}
                                        alt={`${member.firstname} ${member.lastname}`}
                                    />
                                    <div className={styles.memberInfo}>
                                        <span className={styles.memberName}>
                                            {member.firstname} {member.lastname}
                                            {member.userId ===
                                                currentUserId && (
                                                <span
                                                    className={styles.youBadge}
                                                >
                                                    Vous
                                                </span>
                                            )}
                                        </span>
                                        <span className={styles.memberRole}>
                                            <Crown
                                                size={12}
                                                className={styles.adminIcon}
                                            />
                                            Administrateur
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.membersSection}>
                            <h4 className={styles.sectionTitle}>Membres</h4>
                            {regularMembers.length === 0 ? (
                                <p className={styles.emptyMembers}>
                                    Aucun membre régulier
                                </p>
                            ) : (
                                regularMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className={styles.memberItem}
                                    >
                                        <img
                                            src={
                                                member.picture ||
                                                "/placeholder.svg"
                                            }
                                            alt={member.firstname}
                                            className={styles.memberAvatar}
                                        />
                                        <div className={styles.memberInfo}>
                                            <span className={styles.memberName}>
                                                {member.firstname}{" "}
                                                {member.lastname}
                                                {member.userId ===
                                                    currentUserId && (
                                                    <span
                                                        className={
                                                            styles.youBadge
                                                        }
                                                    >
                                                        Vous
                                                    </span>
                                                )}
                                            </span>
                                            <span className={styles.memberRole}>
                                                Membre
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
