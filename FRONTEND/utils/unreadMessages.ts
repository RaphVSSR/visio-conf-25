import type { Discussion } from "@/types/Discussion"
import type { User } from "@/types/User"

/**
 * Utilitaires pour les discussions
 */

/**
 * Obtient le nom d'affichage d'une discussion
 */
export function getDiscussionDisplayName(
    discussion: Discussion,
    currentUser: User
): string {
    if (discussion.discussion_name) {
        return discussion.discussion_name
    }

    // Pour les discussions privées, afficher le nom de l'autre membre
    if (
        discussion.discussion_members &&
        discussion.discussion_members.length === 2
    ) {
        const otherMember = discussion.discussion_members.find(
            (member) => member.email !== currentUser.email
        )
        if (otherMember) {
            return `${otherMember.firstname} ${otherMember.lastname}`
        }
    }

    return "Discussion"
}
