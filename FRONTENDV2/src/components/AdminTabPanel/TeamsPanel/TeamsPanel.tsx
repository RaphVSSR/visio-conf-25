// FIXME: rewire TeamsPanel as its own controleur participant (see services/auth/AuthSync.ts pattern). `socket` no longer comes from useAuth.
// FIXME: local `ToastState` + setTimeout dismissal must migrate to global useToast (showToast/removeToast) once this is rewired.
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "hooks/useAuth"
import { Pencil, Plus, Search, Trash2, Users, X, Check } from "lucide-react"
import { List, ListItem } from "design-system/components"
import TeamForm from "components/TeamForm/TeamForm"
import { Team, initialTeamState } from "services/team/Team"
import type { TeamState } from "services/team/Team.types"
import "./TeamsPanel.scss"
import type { AdminTeam, TeamActionResponse, TeamGetAllResponse, ToastState } from "./TeamsPanel.types"

export type TeamsPanelProps = {
	onClose: () => void
}

export const TeamsPanel: FC<TeamsPanelProps> = ({ onClose }) => {

	const { user } = useAuth()
	const socket: any = null
	const [teamState, setTeamState] = useState<TeamState>(initialTeamState)
	const teamRef = useRef<Team | null>(null)

	useEffect(() => {
		const team = new Team(setTeamState)
		teamRef.current = team
		return () => { team.destroy(); teamRef.current = null }
	}, [])

	const [teams, setTeams] = useState<AdminTeam[]>([])
	const [searchTerm, setSearchTerm] = useState("")
	const [editingTeam, setEditingTeam] = useState<AdminTeam | null>(null)
	const [creating, setCreating] = useState(false)
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
	const [toast, setToast] = useState<ToastState>(null)

	const loadTeams = useCallback(() => {
		if (!socket) return
		socket.send("team_get", { type: "all" })
	}, [socket])

	const handleTeamGetResponse = useCallback((data: TeamGetAllResponse) => {
		if (data.type !== "all") return
		if (data.etat && data.teams) setTeams(data.teams)
		else setToast({ message: data.error ?? "load_failed", kind: "error" })
	}, [])

	const handleTeamActionResponse = useCallback((data: TeamActionResponse) => {
		if (!data.etat) {
			setToast({ message: data.error ?? "action_failed", kind: "error" })
			return
		}
		if (data.type === "create" && data.team) {
			setTeams(prev => [...prev, data.team!])
			setCreating(false)
			setToast({ message: "Équipe créée", kind: "success" })
		}
		if (data.type === "update" && data.team) {
			setTeams(prev => prev.map(team => team.id === data.team!.id ? { ...team, ...data.team! } : team))
			setEditingTeam(null)
			setToast({ message: "Équipe mise à jour", kind: "success" })
		}
		if (data.type === "delete" && data.teamId) {
			setTeams(prev => prev.filter(team => team.id !== data.teamId))
			setPendingDeleteId(null)
			setToast({ message: "Équipe supprimée", kind: "success" })
		}
	}, [])

	useEffect(() => {
		if (!socket) return
		socket.on("team_get_response", handleTeamGetResponse)
		socket.on("team_action_response", handleTeamActionResponse)
		loadTeams()
		return () => {
			socket.off("team_get_response", handleTeamGetResponse)
			socket.off("team_action_response", handleTeamActionResponse)
		}
	}, [socket, handleTeamGetResponse, handleTeamActionResponse, loadTeams])

	useEffect(() => {
		if (!toast) return
		const handle = setTimeout(() => setToast(null), 3200)
		return () => clearTimeout(handle)
	}, [toast])

	const visibleTeams = useMemo(() => {
		const needle = searchTerm.trim().toLowerCase()
		if (!needle) return teams
		return teams.filter(team =>
			team.name.toLowerCase().includes(needle)
			|| (team.description ?? "").toLowerCase().includes(needle)
		)
	}, [teams, searchTerm])

	const requestDelete = (teamId: string) => setPendingDeleteId(teamId)
	const cancelDelete = () => setPendingDeleteId(null)
	const confirmDelete = (teamId: string) => {
		if (!socket) return
		socket.send("team_action", { type: "delete", teamId })
	}

	const closeForm = () => {
		setEditingTeam(null)
		setCreating(false)
		teamRef.current?.closeForm()
	}

	const formOpen = creating || !!editingTeam

	return (
		<section id="adminTab" className="teamsPanel">
			<header className="teamsPanelHeader">
				<div className="teamsPanelTitle">
					<h2>Administration · Équipes</h2>
					<p className="teamsPanelCount">{visibleTeams.length} équipe(s)</p>
				</div>
				<button type="button" className="teamsPanelClose" onClick={onClose} aria-label="Fermer">
					<X size={28} />
				</button>
			</header>

			<div className="teamsPanelToolbar">
				<div className="teamsPanelSearch">
					<Search size={16} />
					<input
						type="text"
						value={searchTerm}
						onChange={event => setSearchTerm(event.target.value)}
						placeholder="Rechercher une équipe…"
					/>
				</div>
				<button type="button" className="teamsPanelCreate" onClick={() => setCreating(true)}>
					<Plus size={18} />
					<span>Créer une équipe</span>
				</button>
			</div>

			<List variant="rows" aria-label="Liste des équipes">
				{visibleTeams.map(team => (
					<ListItem key={team.id} accentColor="#444447" onClick={() => !pendingDeleteId && setEditingTeam(team)}>
						<div className="teamPicture">
							{team.picture
								? <img src={team.picture} alt="" />
								: <Users size={24} />
							}
						</div>
						<div className="itemMain">
							<p className="teamName">{team.name}</p>
							{team.description && <p className="teamDescription">{team.description}</p>}
						</div>
						<div className="itemMeta">
							<span>{team.memberCount} membre(s)</span>
							<span>{new Date(team.createdAt).toLocaleDateString("fr-FR")}</span>
						</div>
						<div className="itemActions" onClick={event => event.stopPropagation()}>
							{pendingDeleteId === team.id ? (
								<>
									<span className="confirmLabel">Supprimer ?</span>
									<button type="button" className="iconBtn iconBtn--confirm" onClick={() => confirmDelete(team.id)} aria-label="Confirmer">
										<Check size={18} />
									</button>
									<button type="button" className="iconBtn" onClick={cancelDelete} aria-label="Annuler">
										<X size={18} />
									</button>
								</>
							) : (
								<>
									<button type="button" className="iconBtn" onClick={() => setEditingTeam(team)} aria-label="Modifier">
										<Pencil size={18} />
									</button>
									<button type="button" className="iconBtn iconBtn--danger" onClick={() => requestDelete(team.id)} aria-label="Supprimer">
										<Trash2 size={18} />
									</button>
								</>
							)}
						</div>
					</ListItem>
				))}
			</List>

			{formOpen && (
				<aside className="teamsPanelDrawer" role="dialog" aria-modal="true">
					<TeamForm
						user={user}
						state={teamState}
						teamToEdit={editingTeam ?? undefined}
						forceAllowManage={true}
						onLoadUsers={() => teamRef.current?.loadUsers()}
						onLoadMembers={(teamId) => teamRef.current?.loadMembers(teamId)}
						onCreate={(data) => teamRef.current?.createTeam(data)}
						onUpdate={(data) => teamRef.current?.updateTeam(data)}
						onDelete={(teamId) => teamRef.current?.deleteTeam(teamId)}
						onAddMember={(teamId, userId) => teamRef.current?.addMember(teamId, userId)}
						onRemoveMember={(teamId, userId) => teamRef.current?.removeMember(teamId, userId)}
						onClose={closeForm}
					/>
				</aside>
			)}

			{toast && (
				<div className={`teamsPanelToast teamsPanelToast--${toast.kind}`} role="status">{toast.message}</div>
			)}
		</section>
	)
}
