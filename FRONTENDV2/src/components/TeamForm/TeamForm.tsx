// FIXME: rewire TeamForm as its own controleur participant (see services/auth/AuthSync.ts pattern). `socket` no longer comes from useAuth.
import { useState, useEffect, useCallback, useRef, type FC, type FormEvent, type ChangeEvent } from "react"
import "./TeamForm.scss"
import { useAuth } from "hooks/useAuth"
import { Users, X, AlertCircle, Upload, Trash2 } from "lucide-react"
import type { Team } from "pages/Teams/Teams.types"
import MemberSelector, { type Member } from "../MemberSelector"

interface TeamFormProps {
	onTeamCreated: (team: any) => void
	onCancel: () => void
	teamToEdit?: any
	forceAllowManage?: boolean
}

const TeamForm: FC<TeamFormProps> = ({
	onTeamCreated,
	onCancel,
	teamToEdit,
	forceAllowManage = false,
}) => {
	const { user } = useAuth()
	const socket: any = null
	const [name, setName] = useState("")
	const [description, setDescription] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState("")
	const [members, setMembers] = useState<Member[]>([])
	const [teamMembers, setTeamMembers] = useState<any[]>([])
	const [isLoadingUsers, setIsLoadingUsers] = useState(false)
	const [isLoadingMembers, setIsLoadingMembers] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [successMessage, setSuccessMessage] = useState("")
	const [isDeleting, setIsDeleting] = useState(false)
	const [teamPicture, setTeamPicture] = useState<string>("")
	const [picturePreview, setPicturePreview] = useState<string>("")

	const onTeamCreatedRef = useRef(onTeamCreated)
	const teamToEditRef = useRef(teamToEdit)
	const userIdRef = useRef(user?._id)
	const socketRef = useRef(socket)

	useEffect(() => { onTeamCreatedRef.current = onTeamCreated }, [onTeamCreated])
	useEffect(() => { teamToEditRef.current = teamToEdit }, [teamToEdit])
	useEffect(() => { userIdRef.current = user?._id }, [user?._id])
	useEffect(() => { socketRef.current = socket }, [socket])

	const loadUsers = useCallback(() => {
		const sock = socketRef.current
		if (!sock) return
		setIsLoadingUsers(true)
		sock.send("user_get", { type: "list" })
	}, [])

	const loadTeamMembers = useCallback((teamId: string) => {
		const sock = socketRef.current
		if (!sock) return
		setIsLoadingMembers(true)
		sock.send("team_member", { type: "list", teamId })
	}, [])

	useEffect(() => {
		if (!socket) return

		const handleTeamActionResponse = (data: any) => {
			switch (data.type) {
				case "create":
					setIsLoading(false)
					if (data.etat) onTeamCreatedRef.current(data.team)
					else setError(data.error || "Erreur lors de la creation de l'equipe")
					break

				case "update":
					setIsLoading(false)
					if (data.etat) onTeamCreatedRef.current(data.team)
					else setError(data.error || "Erreur lors de la mise a jour de l'equipe")
					break

				case "delete":
					setIsDeleting(false)
					if (data.etat) {
						const edit = teamToEditRef.current
						onTeamCreatedRef.current({
							...edit,
							deleted: true,
							id: edit?.id,
						} as Team)
					} else {
						setError(data.error || "Erreur lors de la suppression de l'equipe")
					}
					break
			}
		}

		const handleUserQueryResponse = (data: any) => {
			if (data.type !== "list") return
			setIsLoadingUsers(false)
			if (data.etat) {
				const users = data.users || []
				const membersConverted: Member[] = users
					.filter((u: any) => u.id !== userIdRef.current)
					.map((u: any) => ({
						id: u.id,
						firstname: u.firstname,
						lastname: u.lastname,
						picture: u.picture,
						isSelected: false,
					}))
				setMembers(membersConverted)
			}
		}

		const handleTeamMemberResponse = (data: any) => {
			const edit = teamToEditRef.current
			switch (data.type) {
				case "list":
					if (data.teamId !== edit?.id) return
					setIsLoadingMembers(false)
					if (data.etat) {
						const teamMembersData = data.members || []
						setTeamMembers(teamMembersData)
						setMembers((prevMembers) =>
							prevMembers.map((member) => ({
								...member,
								isSelected: teamMembersData.some(
									(teamMember: any) => teamMember.userId === member.id
								),
							}))
						)
					}
					break

				case "add":
					if (data.teamId !== edit?.id) return
					setIsLoading(false)
					if (data.etat) {
						if (edit) {
							loadTeamMembers(edit.id)
							setSuccessMessage("Membre ajoute avec succes")
							setTimeout(() => setSuccessMessage(""), 3000)
						}
					} else {
						const addedUserId = data.userId
						if (addedUserId) {
							setMembers((prevMembers) =>
								prevMembers.map((member) =>
									member.id === addedUserId
										? { ...member, isSelected: false }
										: member
								)
							)
						}
						setError(data.error || "Erreur lors de l'ajout du membre")
					}
					break

				case "remove":
					if (data.teamId !== edit?.id) return
					setIsLoading(false)
					if (data.etat) {
						if (edit) {
							loadTeamMembers(edit.id)
							setSuccessMessage("Membre retire avec succes")
							setTimeout(() => setSuccessMessage(""), 3000)
						}
					} else {
						const removedUserId = data.userId
						if (removedUserId) {
							setMembers((prevMembers) =>
								prevMembers.map((member) =>
									member.id === removedUserId
										? { ...member, isSelected: true }
										: member
								)
							)
						}
						setError(data.error || "Erreur lors de la suppression du membre")
					}
					break
			}
		}

		socket.on("team_action_response", handleTeamActionResponse)
		socket.on("user_get_response", handleUserQueryResponse)
		socket.on("team_member_response", handleTeamMemberResponse)

		loadUsers()

		if (teamToEdit) {
			setName(teamToEdit.name || "")
			setDescription(teamToEdit.description || "")
			setTeamPicture(teamToEdit.picture || "")
			setIsEditing(true)
			loadTeamMembers(teamToEdit.id)
		} else {
			setName("")
			setDescription("")
			setTeamPicture("")
			setIsEditing(false)
		}

		return () => {
			socket.off("team_action_response", handleTeamActionResponse)
			socket.off("user_get_response", handleUserQueryResponse)
			socket.off("team_member_response", handleTeamMemberResponse)
		}
	}, [socket, teamToEdit?.id, loadUsers, loadTeamMembers])

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault()

		if (!name.trim()) {
			setError("Le nom de l'equipe est requis")
			return
		}

		const selectedMemberIds = members
			.filter((member) => member.isSelected)
			.map((member) => member.id)

		if (!isEditing && selectedMemberIds.length === 0) {
			setError(
				"Vous devez selectionner au moins un membre pour creer une equipe"
			)
			return
		}

		setIsLoading(true)
		setError("")

		if (isEditing && teamToEdit) {
			socket?.send("team_action", {
				type: "update",
				teamId: teamToEdit.id,
				name,
				description,
				picture: teamPicture,
			})
		} else {
			socket?.send("team_action", {
				type: "create",
				name,
				description,
				picture: teamPicture,
				members: selectedMemberIds,
			})
		}
	}

	const handleDeleteTeam = () => {
		if (!socket || !teamToEdit) return

		setIsDeleting(true)
		setError("")

		socket.send("team_action", { type: "delete", teamId: teamToEdit.id })
	}

	const handleCancel = () => {
		onCancel()
	}

	const handleAddMember = (userId: string) => {
		if (!socket || !teamToEdit) return

		setIsLoading(true)
		setError("")

		socket.send("team_member", { type: "add", teamId: teamToEdit.id, userId })
	}

	const handleRemoveMember = (userId: string) => {
		if (!socket || !teamToEdit) return

		const isLastAdmin =
			userId === user?._id &&
			teamMembers.filter((member) => member.role === "admin").length === 1 &&
			teamMembers.find((member) => member.userId === userId)?.role === "admin"

		if (isLastAdmin) {
			setError(
				"Vous ne pouvez pas quitter l'equipe car vous etes le seul administrateur"
			)
			return
		}

		setIsLoading(true)
		setError("")

		socket.send("team_member", { type: "remove", teamId: teamToEdit.id, userId })
	}

	const handleMemberToggle = (member: Member) => {
		if (isEditing && teamToEdit) {
			if (member.isSelected) {
				handleRemoveMember(member.id)
				setMembers((prevMembers) =>
					prevMembers.map((m) =>
						m.id === member.id ? { ...m, isSelected: false } : m
					)
				)
			} else {
				handleAddMember(member.id)
				setMembers((prevMembers) =>
					prevMembers.map((m) =>
						m.id === member.id ? { ...m, isSelected: true } : m
					)
				)
			}
		} else {
			setMembers((prevMembers) =>
				prevMembers.map((m) =>
					m.id === member.id ? { ...m, isSelected: !m.isSelected } : m
				)
			)
		}
	}

	const handleSelectAll = () => {
		if (isEditing) {
			const membersToAdd = members.filter((member) => !member.isSelected)
			membersToAdd.forEach((member) => handleAddMember(member.id))
		} else {
			const hasUnselected = members.some((member) => !member.isSelected)
			setMembers((prevMembers) =>
				prevMembers.map((member) => ({
					...member,
					isSelected: hasUnselected,
				}))
			)
		}
	}

	const isUserAdmin = teamMembers.some(
		(member) => member.userId === user?._id && member.role === "admin"
	)
	const isCreator = teamToEdit?.createdBy === user?._id
	const canManageMembers = forceAllowManage || isUserAdmin || isCreator || !isEditing

	const handleTeamPictureUpload = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		if (!file.type.startsWith("image/")) {
			setError("Veuillez selectionner un fichier image")
			return
		}

		if (file.size > 5 * 1024 * 1024) {
			setError("L'image ne doit pas depasser 5MB")
			return
		}

		setError("")

		const reader = new FileReader()
		reader.onload = (e) => {
			const dataUrl = e.target?.result as string
			setPicturePreview(dataUrl)
			setTeamPicture(dataUrl)
		}
		reader.readAsDataURL(file)
	}

	const handleRemoveTeamPicture = () => {
		setTeamPicture("")
		setPicturePreview("")

		const fileInput = document.getElementById(
			"team-picture-input"
		) as HTMLInputElement
		if (fileInput) {
			fileInput.value = ""
		}
	}

	return (
		<div className="team-form">
			<div className="team-form__header">
				<div className="team-form__title-container">
					<Users size={24} className="team-form__icon" />
					<h2 className="team-form__title">
						{isEditing
							? "Modifier l'equipe"
							: "Creer une nouvelle equipe"}
					</h2>
				</div>
				<button
					className="team-form__close-button"
					onClick={handleCancel}
					aria-label="Fermer"
				>
					<X size={20} />
				</button>
			</div>

			{error && (
				<div className="team-form__error">
					<AlertCircle size={16} />
					<span>{error}</span>
				</div>
			)}

			{successMessage && (
				<div className="team-form__success">{successMessage}</div>
			)}

			<form onSubmit={handleSubmit} className="team-form__form">
				<div className="team-form__form-group">
					<label htmlFor="team-name" className="team-form__label">
						Nom de l'equipe
					</label>
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
							<label
								htmlFor="team-description"
								className="team-form__label"
							>
								Description (optionnelle)
							</label>
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
							<label className="team-form__label">
								Photo de l'equipe
							</label>
							<div className="team-form__picture-upload-container">
								{teamPicture || picturePreview ? (
									<div className="team-form__picture-preview">
										<img
											src={picturePreview || teamPicture}
											alt="Apercu de la photo de l'equipe"
											className="team-form__picture-image"
										/>
										<button
											type="button"
											className="team-form__remove-picture-button"
											onClick={handleRemoveTeamPicture}
											aria-label="Retirer la photo de l'equipe"
										>
											<Trash2 size={16} />
										</button>
									</div>
								) : (
									<div className="team-form__picture-placeholder">
										<Users
											size={48}
											className="team-form__placeholder-icon"
										/>
										<span>Aucune photo</span>
									</div>
								)}
								<input
									id="team-picture-input"
									type="file"
									accept="image/*"
									onChange={handleTeamPictureUpload}
									className="team-form__file-input"
								/>
								<label
									htmlFor="team-picture-input"
									className="team-form__upload-button"
								>
									<Upload size={16} />
									{teamPicture ? "Changer" : "Ajouter"} la photo
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
						isLoading={isLoadingUsers}
						searchPlaceholder="Rechercher des utilisateurs..."
						canManageMembers={canManageMembers}
						currentUserId={user?._id}
						selectedMembersTitle={
							isEditing
								? `Membres actuels de l'equipe (${
										members.filter((m) => m.isSelected).length
								  })`
								: `Membres selectionnes (${
										members.filter((m) => m.isSelected).length
								  })`
						}
						availableMembersTitle={
							isEditing
								? "Ajouter des membres"
								: "Utilisateurs disponibles"
						}
						showSelectedSection={true}
					/>
				</div>

				<div className="team-form__actions">
					{isEditing && canManageMembers && (
						<button
							type="button"
							className="team-form__delete-button"
							onClick={handleDeleteTeam}
						>
							Supprimer l'equipe
						</button>
					)}
					<button
						type="button"
						className="team-form__cancel-button"
						onClick={handleCancel}
					>
						Annuler
					</button>
					<button
						type="submit"
						className="team-form__submit-button"
						disabled={isLoading}
					>
						{isLoading ? (
							<>
								<div className="team-form__button-spinner"></div>
								{isEditing ? "Mise a jour..." : "Creation..."}
							</>
						) : (
							<>
								<Users size={18} />
								{isEditing
									? "Mettre a jour l'equipe"
									: "Creer l'equipe"}
							</>
						)}
					</button>
				</div>
			</form>
		</div>
	)
}

export default TeamForm
