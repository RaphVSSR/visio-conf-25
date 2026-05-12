import type MessageClientAdapter from "services/MessageClientAdapter"
import type { PermissionNotice, PermissionState, RoleData, RolePermission } from "./PermissionSync.types"

type StateUpdater = (updater: (prev: PermissionState) => PermissionState) => void
type RoleSocketStatus = {
	success?: boolean
	message?: string
}

export class PermissionSync {

	private socket: MessageClientAdapter
	private onStateChange: StateUpdater
	private onNotice: (notice: PermissionNotice) => void

	private handleRoles = (data: RoleData[]) => {
		this.onStateChange(prev => ({
			...prev,
			roles: Array.isArray(data) ? data : [],
			isLoadingRoles: false,
		}))
	}

	private handleRole = (data: RoleData | null) => {
		this.onStateChange(prev => ({
			...prev,
			selectedRole: data,
		}))
	}

	private handlePermissions = (permissions: RolePermission[]) => {
		this.onStateChange(prev => ({
			...prev,
			availablePermissions: Array.isArray(permissions) ? permissions : [],
			isLoadingPermissions: false,
		}))
	}

	private handleRoleCreatingStatus = (data: RoleSocketStatus) => {
		if (data?.success) {
			this.onNotice({ name: "role-created", message: "Rôle créé avec succès", variant: "success" })
			this.loadRoles()
			return
		}

		this.onNotice({
			name: "role-create-error",
			message: data?.message || "Erreur lors de la création du rôle",
			variant: "danger",
		})
	}

	private handleRoleAlreadyExists = (data: RoleSocketStatus) => {
		this.onNotice({
			name: "role-exists",
			message: data?.message || "Ce rôle existe déjà",
			variant: "warning",
		})
	}

	private handleRoleUpdatingStatus = (data: RoleSocketStatus) => {
		if (data?.success) {
			this.onNotice({ name: "role-updated", message: "Rôle modifié avec succès", variant: "success" })
			this.clearSelectedRole()
			this.loadRoles()
			return
		}

		this.onNotice({
			name: "role-update-error",
			message: data?.message || "Erreur lors de la modification du rôle",
			variant: "danger",
		})
	}

	private handleRoleDeletingStatus = (data: RoleSocketStatus) => {
		if (data?.success) {
			this.onNotice({ name: "role-deleted", message: "Rôle supprimé", variant: "success" })
			this.clearSelectedRole()
			this.loadRoles()
			return
		}

		this.onNotice({
			name: "role-delete-error",
			message: data?.message || "Erreur lors de la suppression du rôle",
			variant: "danger",
		})
	}

	private handlePermissionDenied = (data: { permission?: string, reason?: string }) => {
		this.onNotice({
			name: "permission-denied",
			message: "Permission refusée",
			subtitle: data?.permission ? `Permission requise : ${data.permission}` : data?.reason,
			variant: "danger",
		})
		this.onStateChange(prev => ({
			...prev,
			isLoadingRoles: false,
			isLoadingPermissions: false,
		}))
	}

	constructor(socket: MessageClientAdapter, onStateChange: StateUpdater, onNotice: (notice: PermissionNotice) => void) {
		this.socket = socket
		this.onStateChange = onStateChange
		this.onNotice = onNotice

		this.socket.on("roles", this.handleRoles)
		this.socket.on("role", this.handleRole)
		this.socket.on("permissions", this.handlePermissions)
		this.socket.on("role_creating_status", this.handleRoleCreatingStatus)
		this.socket.on("role_already_exists", this.handleRoleAlreadyExists)
		this.socket.on("role_updating_status", this.handleRoleUpdatingStatus)
		this.socket.on("role_deleting_status", this.handleRoleDeletingStatus)
		this.socket.on("permission_denied", this.handlePermissionDenied)

		this.socket.onReady(() => {
			this.loadRoles()
			this.loadPermissions()
		})
	}

	loadRoles(): void {
		this.onStateChange(prev => ({ ...prev, isLoadingRoles: true }))
		this.socket.send("get_roles", {})
	}

	loadPermissions(): void {
		this.onStateChange(prev => ({ ...prev, isLoadingPermissions: true }))
		this.socket.send("get_permissions", {})
	}

	selectRole(role: RoleData): void {
		this.onStateChange(prev => ({ ...prev, selectedRole: role }))
		this.socket.send("get_role", { role_id: role._id })
	}

	clearSelectedRole(): void {
		this.onStateChange(prev => ({ ...prev, selectedRole: null }))
	}

	createRole(name: string, permissionIds: string[]): void {
		this.socket.send("create_role", {
			name,
			perms: permissionIds,
		})
	}

	updateRole(roleId: string, name: string, permissionIds: string[]): void {
		this.socket.send("update_role", {
			role_id: roleId,
			name,
			perms: permissionIds,
		})
	}

	deleteRole(roleId: string): void {
		this.socket.send("delete_role", { role_id: roleId })
	}

	destroy(): void {
		this.socket.off("roles", this.handleRoles)
		this.socket.off("role", this.handleRole)
		this.socket.off("permissions", this.handlePermissions)
		this.socket.off("role_creating_status", this.handleRoleCreatingStatus)
		this.socket.off("role_already_exists", this.handleRoleAlreadyExists)
		this.socket.off("role_updating_status", this.handleRoleUpdatingStatus)
		this.socket.off("role_deleting_status", this.handleRoleDeletingStatus)
		this.socket.off("permission_denied", this.handlePermissionDenied)
	}
}
