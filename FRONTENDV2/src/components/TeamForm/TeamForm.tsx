import { useEffect, useState, type FC, type FormEvent, type ChangeEvent } from "react"
import "./TeamForm.scss"
import { Users, X, AlertCircle, Upload, Trash2 } from "lucide-react"
import type { Team as TeamModel } from "pages/Teams/Teams.types"
import type { TeamState, CreateTeamInput, UpdateTeamInput } from "services/team/Team.types"
import type { User } from "types/User"
import MemberSelector, { type Member } from "../MemberSelector"

interface TeamFormProps {
	user: User | null
	state: TeamState
	teamToEdit?: TeamModel | null
	forceAllowManage?: boolean
	onLoadUsers: () => void
	onLoadMembers: (teamId: string) => void
	onCreate: (data: CreateTeamInput) => void
	onUpdate: (data: UpdateTeamInput) => void
	onDelete: (teamId: string) => void
	onAddMember: (teamId: string, userId: string) => void
	onRemoveMember: (teamId: string, userId: string) => void
	onClose: () => void
}

const TeamForm: FC<TeamFormProps> = ({
	user, state, teamToEdit, forceAllowManage = false,
	onLoadUsers, onLoadMembers,
	onCreate, onUpdate, onDelete, onAddMember, onRemoveMember, onClose,
}) => {

	const isEditing = !!teamToEdit
	const [name, setName] = useState(teamToEdit?.name ?? "")
	const [description, setDescription] = useState(teamToEdit?.description ?? "")
	const [picture, setPicture] = useState(teamToEdit?.picture ?? "")
	const [picturePreview, setPicturePreview] = useState("")
	const [localError, setLocalError] = useState("")
	const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

	useEffect(() => {
		onLoadUsers()
		if (teamToEdit) onLoadMembers(teamToEdit.id)
	}, [teamToEdit?.id])

	useEffect(() => {
		setName(teamToEdit?.name ?? "")
		setDescription(teamToEdit?.description ?? "")
		setPicture(teamToEdit?.picture ?? "")
		setSelectedMemberIds([])
	}, [teamToEdit?.id])

	const error = localError || state.teamError
	const successMessage = state.teamSuccess

	const members: Member[] = state.availableUsers
		.filter(u => u.id !== user?._id)
		.map(u => ({
			id: u.id,
			firstname: u.firstname,
			lastname: u.lastname,
			picture: u.picture,
			isSelected: isEditing
				? state.teamMembers.some(m => m.userId === u.id)
				: selectedMemberIds.includes(u.id),
		}))

	const isUserAdmin = state.teamMembers.some(m => m.userId === user?._id && m.role === "admin")
	const isCreator = teamToEdit?.createdBy === user?._id
	const canManageMembers = forceAllowManage || isUserAdmin || isCreator || !isEditing

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()
		if (!name.trim()) { setLocalError("Le nom de l'equipe est requis"); return }

		if (isEditing && teamToEdit) {
			onUpdate({ teamId: teamToEdit.id, name, description, picture })
		} else {
			if (selectedMemberIds.length === 0) {
				setLocalError("Vous devez selectionner au moins un membre pour creer une equipe")
				return
			}
			setLocalError("")
			onCreate({ name, description, picture, members: selectedMemberIds })
		}
	}

	const isLastAdmin = (memberUserId: string): boolean => {
		if (memberUserId !== user?._id) return false
		const admins = state.teamMembers.filter(m => m.role === "admin")
		const isAdminUser = state.teamMembers.find(m => m.userId === memberUserId)?.role === "admin"
		return admins.length === 1 && isAdminUser === true
	}

	const handleMemberToggle = (member: Member) => {
		if (isEditing && teamToEdit) {
			if (member.isSelected) {
				if (isLastAdmin(member.id)) {
					setLocalError("Vous ne pouvez pas quitter l'equipe car vous etes le seul administrateur")
					return
				}
				onRemoveMember(teamToEdit.id, member.id)
			} else {
				onAddMember(teamToEdit.id, member.id)
			}
		} else {
			setSelectedMemberIds(prev =>
				prev.includes(member.id) ? prev.filter(id => id !== member.id) : [...prev, member.id]
			)
		}
	}

	const handleSelectAll = () => {
		if (isEditing && teamToEdit) {
			members.filter(m => !m.isSelected).forEach(m => onAddMember(teamToEdit.id, m.id))
		} else {
			const allIds = members.map(m => m.id)
			const hasUnselected = members.some(m => !m.isSelected)
			setSelectedMemberIds(hasUnselected ? allIds : [])
		}
	}

	const handlePictureUpload = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return
		if (!file.type.startsWith("image/")) { setLocalError("Veuillez selectionner un fichier image"); return }
		if (file.size > 5 * 1024 * 1024) { setLocalError("L'image ne doit pas depasser 5MB"); return }
		setLocalError("")
		const reader = new FileReader()
		reader.onload = (e) => {
			const dataUrl = e.target?.result as string
			setPicturePreview(dataUrl)
			setPicture(dataUrl)
		}
		reader.readAsDataURL(file)
	}

	const handleRemovePicture = () => {
		setPicture("")
		setPicturePreview("")
		const input = document.getElementById("team-picture-input") as HTMLInputElement | null
		if (input) input.value = ""
	}

	const selectedCount = members.filter(m => m.isSelected).length

	return (
		<div className="team-form">
			<div className="team-form__header">
				<div className="team-form__title-container">
					<Users size={24} className="team-form__icon" />
					<h2 className="team-form__title">
						{isEditing ? "Modifier l'equipe" : "Creer une nouvelle equipe"}
					</h2>
				</div>
				<button className="team-form__close-button" onClick={onClose} aria-label="Fermer">
					<X size={20} />
				</button>
			</div>

			{error && (
				<div className="team-form__error">
					<AlertCircle size={16} />
					<span>{error}</span>
				</div>
			)}

			{successMessage && <div className="team-form__success">{successMessage}</div>}

			<form onSubmit={handleSubmit} className="team-form__form">
				<div className="team-form__form-group">
					<label htmlFor="team-name" className="team-form__label">Nom de l'equipe</label>
					<input
						id="team-name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Ex: Marketing, Developpement, RH..."
						className="team-form__input"
						autoFocus
					/>
				</div>

				<div className="team-form__form-group">
					<div className="team-form__description-image-row">
						<div className="team-form__description-section">
							<label htmlFor="team-description" className="team-form__label">Description (optionnelle)</label>
							<textarea
								id="team-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Decrivez brievement cette equipe..."
								className="team-form__textarea"
								rows={4}
							/>
						</div>

						<div className="team-form__image-section">
							<label className="team-form__label">Photo de l'equipe</label>
							<div className="team-form__picture-upload-container">
								{picture || picturePreview ? (
									<div className="team-form__picture-preview">
										<img
											src={picturePreview || picture}
											alt="Apercu de la photo de l'equipe"
											className="team-form__picture-image"
										/>
										<button
											type="button"
											className="team-form__remove-picture-button"
											onClick={handleRemovePicture}
											aria-label="Retirer la photo de l'equipe"
										>
											<Trash2 size={16} />
										</button>
									</div>
								) : (
									<div className="team-form__picture-placeholder">
										<Users size={48} className="team-form__placeholder-icon" />
										<span>Aucune photo</span>
									</div>
								)}
								<input
									id="team-picture-input"
									type="file"
									accept="image/*"
									onChange={handlePictureUpload}
									className="team-form__file-input"
								/>
								<label htmlFor="team-picture-input" className="team-form__upload-button">
									<Upload size={16} />
									{picture ? "Changer" : "Ajouter"} la photo
								</label>
							</div>
						</div>
					</div>
				</div>

				<div className="team-form__form-group">
					<MemberSelector
						members={members}
						onMemberToggle={handleMemberToggle}
						onSelectAll={handleSelectAll}
						isLoading={state.isLoadingUsers}
						searchPlaceholder="Rechercher des utilisateurs..."
						canManageMembers={canManageMembers}
						currentUserId={user?._id}
						selectedMembersTitle={
							isEditing
								? `Membres actuels de l'equipe (${selectedCount})`
								: `Membres selectionnes (${selectedCount})`
						}
						availableMembersTitle={isEditing ? "Ajouter des membres" : "Utilisateurs disponibles"}
						showSelectedSection={true}
					/>
				</div>

				<div className="team-form__actions">
					{isEditing && canManageMembers && teamToEdit && (
						<button type="button" className="team-form__delete-button" onClick={() => onDelete(teamToEdit.id)}>
							Supprimer l'equipe
						</button>
					)}
					<button type="button" className="team-form__cancel-button" onClick={onClose}>
						Annuler
					</button>
					<button type="submit" className="team-form__submit-button" disabled={state.isSubmittingTeam}>
						{state.isSubmittingTeam ? (
							<>
								<div className="team-form__button-spinner"></div>
								{isEditing ? "Mise a jour..." : "Creation..."}
							</>
						) : (
							<>
								<Users size={18} />
								{isEditing ? "Mettre a jour l'equipe" : "Creer l'equipe"}
							</>
						)}
					</button>
				</div>
			</form>
		</div>
	)
}

export default TeamForm
