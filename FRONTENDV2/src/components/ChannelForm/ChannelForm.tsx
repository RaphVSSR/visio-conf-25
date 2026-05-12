import { useEffect, useState, type FC, type FormEvent } from "react"
import "./ChannelForm.scss"
import {
	HashIcon,
	Lock,
	X,
	Check,
	MessageSquare,
	AlertCircle,
	Users,
} from "lucide-react"
import type { Channel as ChannelModel, Team as TeamModel } from "pages/Teams/Teams.types"
import type { TeamState } from "services/team/Team.types"
import type { ChannelState, CreateChannelInput, UpdateChannelInput } from "services/channel/Channel.types"
import type { User } from "types/User"
import MemberSelector, { type Member } from "../MemberSelector"

interface ChannelFormProps {
	user: User | null
	teamState: TeamState
	channelState: ChannelState
	targetTeam: TeamModel
	channelToEdit?: ChannelModel | null
	onLoadTeamMembers: (teamId: string) => void
	onLoadChannelMembers: (channelId: string) => void
	onCreate: (data: CreateChannelInput) => void
	onUpdate: (data: UpdateChannelInput) => void
	onDelete: (channelId: string) => void
	onClose: () => void
}

const ChannelForm: FC<ChannelFormProps> = ({
	user, teamState, channelState, targetTeam, channelToEdit,
	onLoadTeamMembers, onLoadChannelMembers,
	onCreate, onUpdate, onDelete, onClose,
}) => {

	const isEditing = !!channelToEdit
	const [name, setName] = useState(channelToEdit?.name ?? "")
	const [isPublic, setIsPublic] = useState(channelToEdit?.isPublic ?? true)
	const [localError, setLocalError] = useState("")
	const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

	useEffect(() => {
		onLoadTeamMembers(targetTeam.id)
		if (channelToEdit && !channelToEdit.isPublic) onLoadChannelMembers(channelToEdit.id)
	}, [targetTeam.id, channelToEdit?.id])

	useEffect(() => {
		setName(channelToEdit?.name ?? "")
		setIsPublic(channelToEdit?.isPublic ?? true)
		setSelectedMemberIds([])
	}, [channelToEdit?.id])

	const error = localError || channelState.channelError

	const members: Member[] = teamState.teamMembers
		.filter(m => m.userId !== user?._id)
		.map(m => ({
			id: m.userId,
			firstname: m.firstname,
			lastname: m.lastname,
			picture: m.picture,
			isSelected: isEditing
				? channelState.channelMembers.some(cm => cm.userId === m.userId)
				: selectedMemberIds.includes(m.userId),
		}))

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		if (!name.trim()) { setLocalError("Le nom du canal est requis"); return }
		if (!isPublic && !isEditing && selectedMemberIds.length === 0) {
			setLocalError("Vous devez selectionner au moins un membre pour un canal prive")
			return
		}
		setLocalError("")

		const memberIds = !isPublic
			? (isEditing ? members.filter(m => m.isSelected).map(m => m.id) : selectedMemberIds)
			: []

		if (isEditing && channelToEdit) {
			onUpdate({
				channelId: channelToEdit.id,
				name,
				isPublic,
				teamId: targetTeam.id,
				members: memberIds,
			})
		} else {
			onCreate({ name, isPublic, teamId: targetTeam.id, members: memberIds })
		}
	}

	const handleMemberToggle = (member: Member) => {
		setSelectedMemberIds(prev =>
			prev.includes(member.id) ? prev.filter(id => id !== member.id) : [...prev, member.id]
		)
	}

	const handleSelectAll = () => {
		const allIds = members.map(m => m.id)
		const hasUnselected = members.some(m => !m.isSelected)
		setSelectedMemberIds(hasUnselected ? allIds : [])
	}

	return (
		<div className="channel-form">
			<div className="channel-form__header">
				<div className="channel-form__title-container">
					<MessageSquare size={24} className="channel-form__icon" />
					<h2 className="channel-form__title">
						{isEditing ? "Modifier le canal" : "Creer un nouveau canal"}
						<span className="channel-form__team-name">Equipe: {targetTeam.name}</span>
					</h2>
				</div>
				<button className="channel-form__close-button" onClick={onClose} aria-label="Fermer">
					<X size={20} />
				</button>
			</div>

			{error && (
				<div className="channel-form__error">
					<AlertCircle size={16} />
					<span>{error}</span>
				</div>
			)}

			<form onSubmit={handleSubmit} className="channel-form__form">
				<div className="channel-form__form-group">
					<label htmlFor="channel-name" className="channel-form__label">Nom du canal</label>
					<div className="channel-form__input-wrapper">
						<MessageSquare size={18} className="channel-form__input-icon" />
						<input
							id="channel-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Marketing, Support, General..."
							className="channel-form__input"
							autoFocus
						/>
					</div>
				</div>

				<div className="channel-form__form-group">
					<label className="channel-form__label">Visibilite</label>
					<div className="channel-form__visibility-options">
						<button
							type="button"
							className={`channel-form__visibility-option ${isPublic ? "channel-form__visibility-option--selected" : ""}`}
							onClick={() => setIsPublic(true)}
						>
							<HashIcon size={18} className="channel-form__visibility-icon" />
							<div className="channel-form__option-content">
								<span className="channel-form__option-title">Public</span>
								<span className="channel-form__option-description">
									Tous les membres de l'equipe peuvent voir et rejoindre ce canal
								</span>
							</div>
							{isPublic && <Check size={18} className="channel-form__check-icon" />}
						</button>

						<button
							type="button"
							className={`channel-form__visibility-option ${!isPublic ? "channel-form__visibility-option--selected" : ""}`}
							onClick={() => setIsPublic(false)}
						>
							<Lock size={18} className="channel-form__visibility-icon" />
							<div className="channel-form__option-content">
								<span className="channel-form__option-title">Prive</span>
								<span className="channel-form__option-description">
									Seuls les membres invites peuvent acceder a ce canal
								</span>
							</div>
							{!isPublic && <Check size={18} className="channel-form__check-icon" />}
						</button>
					</div>
				</div>

				{!isPublic && (
					<div className="channel-form__form-group">
						<label className="channel-form__label">Membres</label>
						<MemberSelector
							members={members}
							onMemberToggle={handleMemberToggle}
							onSelectAll={handleSelectAll}
							isLoading={teamState.isLoadingMembers}
							searchPlaceholder="Rechercher des membres..."
							currentUserId={user?._id}
							selectedMembersTitle={`Membres selectionnes (${members.filter(m => m.isSelected).length})`}
							availableMembersTitle="Ajouter des membres"
						/>
					</div>
				)}

				<div className="channel-form__actions">
					{isEditing && channelToEdit && (
						<button type="button" className="channel-form__delete-button" onClick={() => onDelete(channelToEdit.id)}>
							Supprimer le canal
						</button>
					)}
					<button type="button" className="channel-form__cancel-button" onClick={onClose}>
						Annuler
					</button>
					<button type="submit" className="channel-form__submit-button" disabled={channelState.isSubmittingChannel}>
						{channelState.isSubmittingChannel ? (
							<>
								<div className="channel-form__button-spinner"></div>
								{isEditing ? "Mise a jour..." : "Creation..."}
							</>
						) : (
							<>
								<Users size={18} />
								{isEditing ? "Mettre a jour le canal" : "Creer le canal"}
							</>
						)}
					</button>
				</div>
			</form>
		</div>
	)
}

export default ChannelForm
