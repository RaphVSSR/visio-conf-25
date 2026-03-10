import { useState, useEffect, type FC, type FormEvent } from "react"
import "./ChannelForm.scss"
import { useAuth } from "hooks/useAuth"
import {
	HashIcon,
	Lock,
	X,
	Check,
	MessageSquare,
	AlertCircle,
	Users,
} from "lucide-react"
import type { Team } from "pages/Teams/Teams.types"
import MemberSelector, { type Member } from "../MemberSelector/MemberSelector"

interface ChannelFormProps {
	onChannelCreated: (channel: any) => void
	onCancel: () => void
	channelToEdit?: any
	team: Team
}

const ChannelForm: FC<ChannelFormProps> = ({
	onChannelCreated,
	onCancel,
	channelToEdit,
	team,
}) => {
	const { controleur, user } = useAuth()
	const [name, setName] = useState("")
	const [isPublic, setIsPublic] = useState(true)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState("")
	const [members, setMembers] = useState<Member[]>([])
	const [isEditing, setIsEditing] = useState(false)
	const [isLoadingMembers, setIsLoadingMembers] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	const nomDInstance = "ChannelForm"
	const verbose = false

	const listeMessageEmis = [
		"create_channel",
		"update_channel",
		"delete_channel",
		"team_members_request",
		"get_channel_members",
	]
	const listeMessageRecus = [
		"channel_creating_status",
		"channel_updating_status",
		"channel_deleting_status",
		"team_members_response",
		"channel_members",
	]

	const handler = {
		nomDInstance,
		traitementMessage: (msg: any) => {
			if (verbose || controleur?.verboseall)
				console.log(`INFO: (${nomDInstance}) - traitementMessage - `, msg)

			if (msg.channel_creating_status) {
				setIsLoading(false)
				if (msg.channel_creating_status.etat) {
					onChannelCreated(msg.channel_creating_status.channel)
				} else {
					setError(
						msg.channel_creating_status.error ||
							"Erreur lors de la creation du canal"
					)
				}
			}

			if (msg.channel_updating_status) {
				setIsLoading(false)
				if (msg.channel_updating_status.etat) {
					onChannelCreated(msg.channel_updating_status.channel)
				} else {
					setError(
						msg.channel_updating_status.error ||
							"Erreur lors de la mise a jour du canal"
					)
				}
			}

			if (msg.channel_deleting_status) {
				setIsDeleting(false)
				if (msg.channel_deleting_status.etat) {
					onChannelCreated({
						...channelToEdit,
						deleted: true,
						id: channelToEdit.id,
					})
				} else {
					setError(
						msg.channel_deleting_status.error ||
							"Erreur lors de la suppression du canal"
					)
				}
			}

			if (msg.team_members_response) {
				setIsLoadingMembers(false)
				if (msg.team_members_response.etat) {
					const teamMembersData = msg.team_members_response.members || []
					const membersConverted: Member[] = teamMembersData
						.filter((member: any) => member.userId !== user?._id)
						.map((member: any) => ({
							id: member.userId,
							firstname: member.firstname,
							lastname: member.lastname,
							picture: member.picture,
							isSelected: false,
						}))
					setMembers(membersConverted)
				}
			}

			if (msg.channel_members) {
				if (msg.channel_members.etat) {
					const channelMembersData =
						msg.channel_members.members || []
					setMembers((prevMembers) =>
						prevMembers.map((member) => ({
							...member,
							isSelected: channelMembersData.some(
								(channelMember: any) =>
									channelMember.userId === member.id
							),
						}))
					)
				}
			}
		},
	}

	const loadTeamMembers = () => {
		if (controleur) {
			setIsLoadingMembers(true)
			controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
			const request = { team_members_request: { teamId: team.id } }
			controleur.envoie(handler, request)
		}
	}

	const loadChannelMembers = (channelId: string) => {
		if (controleur) {
			controleur.inscription(handler, listeMessageEmis, listeMessageRecus)
			const request = { get_channel_members: { channelId } }
			controleur.envoie(handler, request)
		}
	}

	useEffect(() => {
		loadTeamMembers()

		if (channelToEdit) {
			setName(channelToEdit.name)
			setIsPublic(channelToEdit.isPublic)
			setIsEditing(true)

			if (!channelToEdit.isPublic) {
				loadChannelMembers(channelToEdit.id)
			}
		} else {
			setName("")
			setIsPublic(true)
			setIsEditing(false)
		}

		return () => {
			controleur?.desincription(handler, listeMessageEmis, listeMessageRecus)
		}
	}, [channelToEdit?.id, team.id])

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()

		if (!name.trim()) {
			setError("Le nom du canal est requis")
			return
		}

		const selectedMemberIds = members
			.filter((member) => member.isSelected)
			.map((member) => member.id)

		if (!isPublic && selectedMemberIds.length === 0) {
			setError(
				"Vous devez selectionner au moins un membre pour un canal prive"
			)
			return
		}

		setIsLoading(true)
		setError("")

		controleur?.inscription(handler, listeMessageEmis, listeMessageRecus)

		if (isEditing) {
			const updateRequest = {
				update_channel: {
					id: channelToEdit.id,
					name,
					isPublic,
					teamId: team.id,
					members: !isPublic ? selectedMemberIds : [],
				},
			}
			controleur?.envoie(handler, updateRequest)
		} else {
			const createRequest = {
				create_channel: {
					name,
					isPublic,
					teamId: team.id,
					members: !isPublic ? selectedMemberIds : [],
				},
			}
			controleur?.envoie(handler, createRequest)
		}
	}

	const handleDeleteChannel = () => {
		if (!controleur || !channelToEdit) return

		setIsDeleting(true)
		setError("")

		const request = {
			delete_channel: { channelId: channelToEdit.id },
		}
		controleur.envoie(handler, request)
	}

	const handleCancel = () => {
		controleur?.desincription(handler, listeMessageEmis, listeMessageRecus)
		onCancel()
	}

	const handleMemberToggle = (member: Member) => {
		setMembers((prevMembers) =>
			prevMembers.map((m) =>
				m.id === member.id ? { ...m, isSelected: !m.isSelected } : m
			)
		)
	}

	const handleSelectAll = () => {
		const hasUnselected = members.some((member) => !member.isSelected)
		setMembers((prevMembers) =>
			prevMembers.map((member) => ({
				...member,
				isSelected: hasUnselected,
			}))
		)
	}

	return (
		<div className="channel-form">
			<div className="channel-form__header">
				<div className="channel-form__title-container">
					<MessageSquare size={24} className="channel-form__icon" />
					<h2 className="channel-form__title">
						{isEditing ? "Modifier le canal" : "Creer un nouveau canal"}
						<span className="channel-form__team-name">
							Equipe: {team.name}
						</span>
					</h2>
				</div>
				<button
					className="channel-form__close-button"
					onClick={handleCancel}
					aria-label="Fermer"
				>
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
					<label htmlFor="channel-name" className="channel-form__label">
						Nom du canal
					</label>
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
							className={`channel-form__visibility-option ${
								isPublic ? "channel-form__visibility-option--selected" : ""
							}`}
							onClick={() => setIsPublic(true)}
						>
							<HashIcon
								size={18}
								className="channel-form__visibility-icon"
							/>
							<div className="channel-form__option-content">
								<span className="channel-form__option-title">
									Public
								</span>
								<span className="channel-form__option-description">
									Tous les membres de l'equipe peuvent voir et rejoindre ce canal
								</span>
							</div>
							{isPublic && (
								<Check size={18} className="channel-form__check-icon" />
							)}
						</button>

						<button
							type="button"
							className={`channel-form__visibility-option ${
								!isPublic ? "channel-form__visibility-option--selected" : ""
							}`}
							onClick={() => setIsPublic(false)}
						>
							<Lock size={18} className="channel-form__visibility-icon" />
							<div className="channel-form__option-content">
								<span className="channel-form__option-title">
									Prive
								</span>
								<span className="channel-form__option-description">
									Seuls les membres invites peuvent acceder a ce canal
								</span>
							</div>
							{!isPublic && (
								<Check size={18} className="channel-form__check-icon" />
							)}
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
							isLoading={isLoadingMembers}
							searchPlaceholder="Rechercher des membres..."
							currentUserId={user?._id}
							selectedMembersTitle={`Membres selectionnes (${
								members.filter((m) => m.isSelected).length
							})`}
							availableMembersTitle="Ajouter des membres"
						/>
					</div>
				)}

				<div className="channel-form__actions">
					{isEditing && (
						<button
							type="button"
							className="channel-form__delete-button"
							onClick={handleDeleteChannel}
						>
							Supprimer le canal
						</button>
					)}
					<button
						type="button"
						className="channel-form__cancel-button"
						onClick={handleCancel}
					>
						Annuler
					</button>
					<button
						type="submit"
						className="channel-form__submit-button"
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<div className="channel-form__button-spinner"></div>
								{isEditing ? "Mise a jour..." : "Creation..."}
							</>
						) : (
							<>
								<Users size={18} />
								{isEditing
									? "Mettre a jour le canal"
									: "Creer le canal"}
							</>
						)}
					</button>
				</div>
			</form>
		</div>
	)
}

export default ChannelForm
