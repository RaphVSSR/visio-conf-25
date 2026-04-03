"use client"
import { User } from "../types/User"
import styles from "./CurrentUser.module.css"
import { getProfilePictureUrl } from "@/utils/fileHelpers"

interface CurrentUserProps {
    user: User
}

export default function CurrentUser({ user }: CurrentUserProps) {
    return (
        <div className={styles.currentUser}>
            {" "}
            <div className={styles.profilePicture}>
                <img
                    src={getProfilePictureUrl(user.picture)}
                    alt="Profile picture"
                    className={styles.profilePictureImg}
                />
            </div>
            <div>
                <p>
                    {user.firstname} {user.lastname}
                </p>
                <p>{user.email}</p>
            </div>
        </div>
    )
}
