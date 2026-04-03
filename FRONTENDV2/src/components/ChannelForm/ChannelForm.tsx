import { useState, useEffect, useCallback, useRef, type FC, type FormEvent } from "react"
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
	const { socket, user } = useAuth()
	const [name, setName] = useState("")
	const [isPublic, setIsPublic] = useState(true)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState("")
	const [members, setMembers] = useState<Member[]>([])
	const [isEditing, setIsEditing] = useState(false)
	const [isLoadingMembers, setIsLoadingMembers] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	const onChannelCreatedRef = useRef(onChannelCreated)
	const channelToEditRef = useRef(channelToEdit)
	const userIdRef = useRef(user?._id)

	useEffect(() => { onChannelCreatedRef.current = onChannelCreated }, [onChannelCreated])
	useEffect(() => { channelToEditRef.current = channelToEdit }, [channelToEdit])
	useEffect(() => { userIdRef.current = user?._id }, [user?._id])

	useEffect(() => {
		if (!socket) return

		const handleChannelActionResponse = (data: any) => {
			switch (data.type) {
				case "create":
					setIsLoading(false)
					if (data.etat) {
						onChannelCreatedRef.current(data.channel)
					} else {
						setError(data.error || "Erreur lors de la creation du canal")
					}
					break

				case "update":
					setIsLoading(false)
					if (data.etat) {
						onChannelCreatedRef.current(data.channel)
					} else {
						setError(data.error || "Erreur lors de la mise a jour du canal")
					}
					break

				case "delete":
					setIsDeleting(false)
					if (data.etat) {
						const edit = channelToEditRef.current
						onChannelCreatedRef.current({
							...edit,
							deleted: true,
							id: edit.id,
						})
					} else {
						setError(data.error || "Erreur lors de la suppression du canal")
					}
					break
			}
		}

		const handleTeamMemberResponse = (data: any) => {
			if (data.type !== "list") return
			setIsLoadingMembers(false)
			if (data.etat) {
				const teamMembersData = data.members || []
				const membersConverted: Member[] = teamMembersData
					.filter((member: any) => member.userId !== userIdRef.current)
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

		const handleChannelMemberResponse = (data: any) => {
			if (data.type !== "list") return
			if (data.etat) {
				const channelMembersData = data.members || []
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

		socket.on("channel_action_response", handleChannelActionResponse)
		socket.on("team_member_response", handleTeamMemberResponse)
		socket.on("channel_member_response", handleChannelMemberResponse)

		return () => {
			socket.off("channel_action_response", handleChannelActionResponse)
			socket.off("team_member_response", handleTeamMemberResponse)
			socket.off("channel_member_response", handleChannelMemberResponse)
		}
	}, [socket])

	useEffect(() => {
		if (!socket) return

		setIsLoadingMembers(true)
		socket.send("team_member", { type: "list", teamId: team.id })

		if (channelToEdit) {
			setName(channelToEdit.name)
			setIsPublic(channelToEdit.isPublic)
			setIsEditing(true)

			if (!channelToEdit.isPublic) {
				socket.send("channel_member", { type: "list", channelId: channelToEdit.id })
			}
		} else {
			setName("")
			setIsPublic(true)
			setIsEditing(false)
		}
	}, [socket, channelToEdit?.id, team.id])

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

		if (isEditing) {
			socket?.send("channel_action", {
				type: "update",
				id: channelToEdit.id,
				name,
				isPublic,
				teamId: team.id,
				members: !isPublic ? selectedMemberIds : [],
			})
		} else {
			socket?.send("channel_action", {
				type: "create",
				name,
				isPublic,
				teamId: team.id,
				members: !isPublic ? selectedMemberIds : [],
			})
		}
	}

	const handleDeleteChannel = () => {
		if (!socket || !channelToEdit) return

		setIsDeleting(true)
		setError("")

		socket.send("channel_action", { type: "delete", channelId: channelToEdit.id })
	}

	const handleCancel = () => {
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
