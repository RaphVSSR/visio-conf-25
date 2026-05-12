import Controleur from "Controller/controleur.js"
import CanalSocketio from "Controller/canalsocketio.js"
import type { TeamState, CreateTeamInput, UpdateTeamInput } from "./Team.types"
import type { Team as TeamModel } from "pages/Teams/Teams.types"

type StateUpdater = (updater: (prev: TeamState) => TeamState) => void

export const initialTeamState: TeamState = {
	teams: [],
	selectedTeam: null,
	teamFormMode: null,
	teamMembers: [],
	availableUsers: [],
	isLoadingTeams: true,
	isLoadingMembers: false,
	isLoadingUsers: false,
	isSubmittingTeam: false,
	isDeletingTeam: false,
	teamError: "",
	teamSuccess: "",
}

export class Team {

	readonly nomDInstance = "Team"

	private static readonly listMessageEmission = ["team_get", "team_action", "team_member", "user_get"]
	private static readonly listMessageReception = ["team_get_response", "team_action_response", "team_member_response", "user_get_response"]

	private controleur: Controleur
	private canal: CanalSocketio
	private setState: StateUpdater

	constructor(setState: StateUpdater) {
		this.setState = setState
		this.controleur = new Controleur()
		this.canal = new CanalSocketio(this.controleur, "canalsocketio")
		this.controleur.inscription(this, Team.listMessageEmission, Team.listMessageReception)
		this.canal.socket.on("donne_liste", () => this.loadTeams())
	}

	destroy(): void {
		this.canal.socket.disconnect()
	}

	traitementMessage(mesg: Record<string, any>): void {
		for (const key of Object.keys(mesg)) {
			switch (key) {
				case "team_get_response":    this.handleGetResponse(mesg[key]); break
				case "team_action_response": this.handleActionResponse(mesg[key]); break
				case "team_member_response": this.handleMemberResponse(mesg[key]); break
				case "user_get_response":    this.handleUserResponse(mesg[key]); break
			}
		}
	}

	loadTeams = (): void => {
		this.setState(prev => ({ ...prev, isLoadingTeams: true }))
		this.send("team_get", { type: "list" })
	}

	selectTeam = (team: TeamModel | null): void => {
		this.setState(prev => ({ ...prev, selectedTeam: team, teamFormMode: null }))
	}

	openCreateForm = (): void => {
		this.setState(prev => ({ ...prev, teamFormMode: "create", teamError: "", teamSuccess: "" }))
	}

	openEditForm = (team: TeamModel): void => {
		this.setState(prev => ({ ...prev, selectedTeam: team, teamFormMode: "edit", teamError: "", teamSuccess: "" }))
	}

	closeForm = (): void => {
		this.setState(prev => ({ ...prev, teamFormMode: null, teamError: "", teamSuccess: "" }))
	}

	loadUsers = (): void => {
		this.setState(prev => ({ ...prev, isLoadingUsers: true }))
		this.send("user_get", { type: "list" })
	}

	loadMembers = (teamId: string): void => {
		this.setState(prev => ({ ...prev, isLoadingMembers: true }))
		this.send("team_member", { type: "list", teamId })
	}

	createTeam = (data: CreateTeamInput): void => {
		this.setState(prev => ({ ...prev, isSubmittingTeam: true, teamError: "" }))
		this.send("team_action", { type: "create", ...data })
	}

	updateTeam = (data: UpdateTeamInput): void => {
		this.setState(prev => ({ ...prev, isSubmittingTeam: true, teamError: "" }))
		this.send("team_action", { type: "update", ...data })
	}

	deleteTeam = (teamId: string): void => {
		this.setState(prev => ({ ...prev, isDeletingTeam: true, teamError: "" }))
		this.send("team_action", { type: "delete", teamId })
	}

	addMember = (teamId: string, userId: string): void => {
		this.setState(prev => ({ ...prev, isSubmittingTeam: true, teamError: "" }))
		this.send("team_member", { type: "add", teamId, userId })
	}

	removeMember = (teamId: string, userId: string): void => {
		this.setState(prev => ({ ...prev, isSubmittingTeam: true, teamError: "" }))
		this.send("team_member", { type: "remove", teamId, userId })
	}

	clearTeamMessages = (): void => {
		this.setState(prev => ({ ...prev, teamError: "", teamSuccess: "" }))
	}

	private send(name: string, payload: unknown): void {
		this.controleur.envoie(this, { [name]: payload })
	}

	private handleGetResponse = (data: any) => {
		if (data?.type !== "list") return
		this.setState(prev => {
			const teams: TeamModel[] = data.etat ? (data.teams || []) : prev.teams
			const selectedTeam = prev.selectedTeam
				? teams.find(t => t.id === prev.selectedTeam!.id) ?? null
				: prev.selectedTeam
			return { ...prev, teams, selectedTeam, isLoadingTeams: false }
		})
	}

	private handleActionResponse = (data: any) => {
		switch (data?.type) {
			case "create":
				this.setState(prev => ({
					...prev,
					isSubmittingTeam: false,
					teamError: data.etat ? "" : (data.error || "Erreur lors de la creation de l'equipe"),
					teamFormMode: data.etat ? null : prev.teamFormMode,
					selectedTeam: data.etat ? data.team : prev.selectedTeam,
				}))
				if (data.etat) this.loadTeams()
				break
			case "update":
				this.setState(prev => ({
					...prev,
					isSubmittingTeam: false,
					teamError: data.etat ? "" : (data.error || "Erreur lors de la mise a jour de l'equipe"),
					teamFormMode: data.etat ? null : prev.teamFormMode,
					selectedTeam: data.etat && prev.selectedTeam?.id === data.team?.id
						? data.team
						: prev.selectedTeam,
				}))
				if (data.etat) this.loadTeams()
				break
			case "delete":
			case "leave":
				this.setState(prev => ({
					...prev,
					isDeletingTeam: false,
					teamError: data.etat ? "" : (data.error || "Erreur lors de la suppression de l'equipe"),
					teamFormMode: data.etat ? null : prev.teamFormMode,
					selectedTeam: data.etat ? null : prev.selectedTeam,
				}))
				if (data.etat) this.loadTeams()
				break
		}
	}

	private handleMemberResponse = (data: any) => {
		switch (data?.type) {
			case "list":
				this.setState(prev => ({
					...prev,
					teamMembers: data.etat ? (data.members || []) : prev.teamMembers,
					isLoadingMembers: false,
				}))
				break
			case "add":
			case "remove":
				this.setState(prev => ({
					...prev,
					isSubmittingTeam: false,
					teamError: data.etat ? "" : (data.error || "Erreur sur l'operation membre"),
					teamSuccess: data.etat ? (data.type === "add" ? "Membre ajoute" : "Membre retire") : prev.teamSuccess,
				}))
				if (data.etat && data.teamId) this.loadMembers(data.teamId)
				break
		}
	}

	private handleUserResponse = (data: any) => {
		if (data?.type !== "list") return
		this.setState(prev => ({
			...prev,
			availableUsers: data.etat ? (data.users || []) : prev.availableUsers,
			isLoadingUsers: false,
		}))
	}
}
