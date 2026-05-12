export type RolePermission = {
	_id: string
	label: string
	uuid?: string
	default?: boolean
}

export type RoleData = {
	_id: string
	uuid: string
	label: string
	permissions?: RolePermission[]
	default: boolean
}

export type PermissionState = {
	roles: RoleData[]
	availablePermissions: RolePermission[]
	selectedRole: RoleData | null
	isLoadingRoles: boolean
	isLoadingPermissions: boolean
}

export const initialPermissionState: PermissionState = {
	roles: [],
	availablePermissions: [],
	selectedRole: null,
	isLoadingRoles: false,
	isLoadingPermissions: false,
}

export type PermissionNotice = {
	name: string
	message: string
	variant: "success" | "danger" | "warning" | "info"
	subtitle?: string
}
