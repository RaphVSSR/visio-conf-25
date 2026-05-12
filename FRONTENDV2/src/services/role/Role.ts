import Controleur from "Controller/controleur.js"
import CanalSocketio from "Controller/canalsocketio.js"
import type { RoleState, RoleData } from "./Role.types"

type StateUpdater = (updater: (prev: RoleState) => RoleState) => void

export const initialRoleState: RoleState = {
	roles: [],
	selectedRole: null,
	isLoadingRoles: false,
	isSubmitting: false,
	roleError: "",
}

export class Role {

	readonly nomDInstance = "Role"

	private static readonly listMessageEmission = ["get_roles", "get_role", "create_role", "update_role", "delete_role"]
	private static readonly listMessageReception = ["roles", "role", "role_creating_status", "role_already_exists", "role_updating_status", "role_deleting_status"]

	private controleur: Controleur
	private canal: CanalSocketio
	private setState: StateUpdater

	constructor(setState: StateUpdater) {
		this.setState = setState
		this.controleur = new Controleur()
		this.canal = new CanalSocketio(this.controleur, "canalsocketio")
		this.controleur.inscription(this, Role.listMessageEmission, Role.listMessageReception)
		this.canal.socket.on("donne_liste", () => this.loadRoles())
	}

	destroy(): void {
		this.canal.socket.disconnect()
	}

	traitementMessage(mesg: Record<string, any>): void {
		for (const key of Object.keys(mesg)) {
			switch (key) {
				case "roles":                this.handleRolesResponse(mesg[key]); break
				case "role":                 this.handleRoleResponse(mesg[key]); break
				case "role_creating_status":  this.handleCreatingStatus(mesg[key]); break
				case "role_already_exists":   this.handleAlreadyExists(mesg[key]); break
				case "role_updating_status":  this.handleUpdatingStatus(mesg[key]); break
				case "role_deleting_status":  this.handleDeletingStatus(mesg[key]); break
			}
		}
	}

	loadRoles = (): void => {
		this.setState(prev => ({ ...prev, isLoadingRoles: true }))
		this.send("get_roles", true)
	}

	loadRole = (roleId: string): void => {
		this.send("get_role", { role_id: roleId })
	}

	createRole = (name: string, perms: string[] = []): void => {
		this.setState(prev => ({ ...prev, isSubmitting: true, roleError: "" }))
		this.send("create_role", { name, perms })
	}

	updateRole = (roleId: string, name: string, perms: string[] = []): void => {
		this.setState(prev => ({ ...prev, isSubmitting: true, roleError: "" }))
		this.send("update_role", { role_id: roleId, name, perms })
	}

	deleteRole = (roleId: string): void => {
		this.setState(prev => ({ ...prev, isSubmitting: true, roleError: "" }))
		this.send("delete_role", { role_id: roleId })
	}

	selectRole = (role: RoleData | null): void => {
		this.setState(prev => ({ ...prev, selectedRole: role }))
	}

	clearRoleError = (): void => {
		this.setState(prev => ({ ...prev, roleError: "" }))
	}

	private send(name: string, payload: unknown): void {
		this.controleur.envoie(this, { [name]: payload })
	}

	private handleRolesResponse = (data: any) => {
		if (!data) return
		this.setState(prev => ({
			...prev,
			roles: Array.isArray(data) ? data : prev.roles,
			isLoadingRoles: false,
		}))
	}

	private handleRoleResponse = (data: any) => {
		if (!data) return
		this.setState(prev => ({ ...prev, selectedRole: data }))
	}

	private handleCreatingStatus = (data: any) => {
		this.setState(prev => ({
			...prev,
			isSubmitting: false,
			roleError: data?.success ? "" : (data?.message || "Erreur lors de la création"),
		}))
		if (data?.success) this.loadRoles()
	}

	private handleAlreadyExists = (data: any) => {
		this.setState(prev => ({
			...prev,
			isSubmitting: false,
			roleError: data?.message || "Ce rôle existe déjà",
		}))
	}

	private handleUpdatingStatus = (data: any) => {
		this.setState(prev => ({
			...prev,
			isSubmitting: false,
			roleError: data?.success ? "" : (data?.message || "Erreur lors de la modification"),
		}))
		if (data?.success) this.loadRoles()
	}

	private handleDeletingStatus = (data: any) => {
		this.setState(prev => ({
			...prev,
			isSubmitting: false,
			selectedRole: data?.success ? null : prev.selectedRole,
			roleError: data?.success ? "" : (data?.message || "Erreur lors de la suppression"),
		}))
		if (data?.success) this.loadRoles()
	}
}
