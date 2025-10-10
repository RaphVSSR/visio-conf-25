"use client"
import { useState, useEffect } from "react"
import styles from "./MemberSelector.module.css"
import { getProfilePictureUrl } from "@/utils/fileHelpers"
import { Search, Plus, Trash2, CheckSquare, Square, Users } from "lucide-react"

export interface Member {
    id: string
    userId?: string // Pour les membres existants d'équipes/canaux
    firstname: string
    lastname: string
    picture?: string
    role?: string // Pour afficher le rôle dans les membres existants
    isSelected: boolean // Nouvelle propriété pour indiquer si le membre est sélectionné
}

export interface MemberSelectorProps {
    // Données simplifiées - une seule liste
    members: Member[]

    // Actions simplifiées
    onMemberToggle: (member: Member) => void
    onSelectAll?: () => void

    // États
    isLoading?: boolean
    searchPlaceholder?: string

    // Permissions
    canManageMembers?: boolean
    currentUserId?: string

    // Labels personnalisés
    selectedMembersTitle?: string
    availableMembersTitle?: string

    // Filtres personnalisés
    memberFilter?: (member: Member) => boolean

    // Options d'affichage
    showSelectedSection?: boolean
}

export default function MemberSelector({
    members,
    onMemberToggle,
    onSelectAll,
    isLoading = false,
    searchPlaceholder = "Rechercher des utilisateurs...",
    canManageMembers = true,
    currentUserId,
    selectedMembersTitle,
    availableMembersTitle,
    memberFilter,
    showSelectedSection = true,
}: MemberSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([])

    // Filtrer les membres en fonction du terme de recherche
    useEffect(() => {
        let filtered = members.filter((member) => {
            const nameMatch = `${member.firstname} ${member.lastname}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())

            return nameMatch
        })

        // Appliquer un filtre personnalisé si fourni
        if (memberFilter) {
            filtered = filtered.filter(memberFilter)
        }

        setFilteredMembers(filtered)
    }, [searchTerm, members, memberFilter])

    const handleSelectAll = () => {
        if (onSelectAll) {
            onSelectAll()
        }
    }
    console.log("Filtered Members:", filteredMembers)

    const selectedMembers = filteredMembers.filter(
        (member) => member.isSelected
    )
    const availableMembers = filteredMembers.filter(
        (member) => !member.isSelected
    )

    const areAllAvailableSelected =
        availableMembers.length === 0 && selectedMembers.length > 0

    const renderMemberAvatar = (member: Member) => (
        <div className={styles.memberAvatar}>
            {member.picture ? (
                <img
                    src={getProfilePictureUrl(member.picture)}
                    alt={`${member.firstname} ${member.lastname}`}
                />
            ) : (
                <>
                    {member.firstname?.charAt(0) || "?"}
                    {member.lastname?.charAt(0) || "?"}
                </>
            )}
        </div>
    )

    const renderMemberInfo = (member: Member, showRole = false) => (
        <div className={styles.memberInfo}>
            <span className={styles.memberName}>
                {member.firstname} {member.lastname}
                {(member.id === currentUserId ||
                    member.userId === currentUserId) && (
                    <span className={styles.youBadge}>Vous</span>
                )}
            </span>
            {showRole && member.role && (
                <span className={styles.memberRole}>
                    {member.role === "admin" ? "Administrateur" : "Membre"}
                </span>
            )}
        </div>
    )

    return (
        <div className={styles.memberSelector}>
            {/* Barre de recherche */}
            <div className={styles.searchContainer}>
                <Search size={16} className={styles.searchIcon} />
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Membres sélectionnés */}
            {showSelectedSection && selectedMembers.length > 0 && (
                <div className={styles.selectedMembers}>
                    <h4 className={styles.selectedMembersTitle}>
                        {selectedMembersTitle ||
                            `Membres sélectionnés (${selectedMembers.length})`}
                    </h4>
                    <div className={styles.membersList}>
                        {selectedMembers.map((member) => (
                            <div key={member.id} className={styles.memberItem}>
                                {renderMemberAvatar(member)}
                                {renderMemberInfo(member, true)}
                                {canManageMembers &&
                                    member.userId !== currentUserId &&
                                    member.id !== currentUserId && (
                                        <button
                                            type="button"
                                            className={styles.removeButton}
                                            onClick={() =>
                                                onMemberToggle(member)
                                            }
                                            aria-label={`Retirer ${member.firstname} ${member.lastname}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Liste des membres disponibles */}
            <div className={styles.usersList}>
                <div className={styles.usersListHeader}>
                    <h4 className={styles.usersListTitle}>
                        {availableMembersTitle || "Ajouter des membres"}
                    </h4>
                    {availableMembers.length > 0 && onSelectAll && (
                        <button
                            type="button"
                            className={styles.selectAllButton}
                            onClick={handleSelectAll}
                        >
                            {areAllAvailableSelected ? (
                                <>
                                    <CheckSquare size={16} />
                                    Désélectionner tout
                                </>
                            ) : (
                                <>
                                    <Square size={16} />
                                    Sélectionner tout
                                </>
                            )}
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className={styles.loadingUsers}>
                        Chargement des utilisateurs...
                    </div>
                ) : availableMembers.length === 0 ? (
                    <div className={styles.noResults}>
                        {selectedMembers.length > 0
                            ? "Tous les membres disponibles ont été sélectionnés"
                            : "Aucun utilisateur trouvé"}
                    </div>
                ) : (
                    availableMembers.map((member) => (
                        <div key={member.id} className={styles.userItem}>
                            {renderMemberAvatar(member)}
                            {renderMemberInfo(member)}
                            <button
                                type="button"
                                className={styles.addButton}
                                onClick={() => onMemberToggle(member)}
                                aria-label={`Ajouter ${member.firstname} ${member.lastname}`}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
