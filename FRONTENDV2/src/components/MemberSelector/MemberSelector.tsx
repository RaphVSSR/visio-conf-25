import { useState, useEffect, type FC } from "react"
import "./MemberSelector.scss"
import { Search, Plus, Trash2, CheckSquare, Square } from "lucide-react"

export interface Member {
	id: string
	userId?: string
	firstname: string
	lastname: string
	picture?: string
	role?: string
	isSelected: boolean
}

export interface MemberSelectorProps {
	members: Member[]
	onMemberToggle: (member: Member) => void
	onSelectAll?: () => void
	isLoading?: boolean
	searchPlaceholder?: string
	canManageMembers?: boolean
	currentUserId?: string
	selectedMembersTitle?: string
	availableMembersTitle?: string
	memberFilter?: (member: Member) => boolean
	showSelectedSection?: boolean
}

const MemberSelector: FC<MemberSelectorProps> = ({
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
}) => {
	const [searchTerm, setSearchTerm] = useState("")
	const [filteredMembers, setFilteredMembers] = useState<Member[]>([])

	useEffect(() => {
		let filtered = members.filter((member) => {
			const nameMatch = `${member.firstname} ${member.lastname}`
				.toLowerCase()
				.includes(searchTerm.toLowerCase())
			return nameMatch
		})

		if (memberFilter) {
			filtered = filtered.filter(memberFilter)
		}

		setFilteredMembers(filtered)
	}, [searchTerm, members, memberFilter])

	const selectedMembers = filteredMembers.filter((member) => member.isSelected)
	const availableMembers = filteredMembers.filter((member) => !member.isSelected)

	const areAllAvailableSelected =
		availableMembers.length === 0 && selectedMembers.length > 0

	const renderMemberAvatar = (member: Member) => (
		<div className="member-selector__avatar">
			{member.picture ? (
				<img
					src={member.picture}
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
		<div className="member-selector__info">
			<span className="member-selector__name">
				{member.firstname} {member.lastname}
				{(member.id === currentUserId || member.userId === currentUserId) && (
					<span className="member-selector__you-badge">Vous</span>
				)}
			</span>
			{showRole && member.role && (
				<span className="member-selector__role">
					{member.role === "admin" ? "Administrateur" : "Membre"}
				</span>
			)}
		</div>
	)

	return (
		<div className="member-selector">
			<div className="member-selector__search">
				<Search size={16} className="member-selector__search-icon" />
				<input
					type="text"
					className="member-selector__search-input"
					placeholder={searchPlaceholder}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</div>

			{showSelectedSection && selectedMembers.length > 0 && (
				<div className="member-selector__selected">
					<h4 className="member-selector__selected-title">
						{selectedMembersTitle ||
							`Membres selectionnes (${selectedMembers.length})`}
					</h4>
					<div className="member-selector__list">
						{selectedMembers.map((member) => (
							<div key={member.id} className="member-selector__item">
								{renderMemberAvatar(member)}
								{renderMemberInfo(member, true)}
								{canManageMembers &&
									member.userId !== currentUserId &&
									member.id !== currentUserId && (
										<button
											type="button"
											className="member-selector__remove-button"
											onClick={() => onMemberToggle(member)}
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

			<div className="member-selector__available">
				<div className="member-selector__available-header">
					<h4 className="member-selector__available-title">
						{availableMembersTitle || "Ajouter des membres"}
					</h4>
					{availableMembers.length > 0 && onSelectAll && (
						<button
							type="button"
							className="member-selector__select-all"
							onClick={onSelectAll}
						>
							{areAllAvailableSelected ? (
								<>
									<CheckSquare size={16} />
									Deselectionner tout
								</>
							) : (
								<>
									<Square size={16} />
									Selectionner tout
								</>
							)}
						</button>
					)}
				</div>

				{isLoading ? (
					<div className="member-selector__loading">
						Chargement des utilisateurs...
					</div>
				) : availableMembers.length === 0 ? (
					<div className="member-selector__no-results">
						{selectedMembers.length > 0
							? "Tous les membres disponibles ont ete selectionnes"
							: "Aucun utilisateur trouve"}
					</div>
				) : (
					availableMembers.map((member) => (
						<div key={member.id} className="member-selector__user-item">
							{renderMemberAvatar(member)}
							{renderMemberInfo(member)}
							<button
								type="button"
								className="member-selector__add-button"
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

export default MemberSelector
