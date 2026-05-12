export type RoleData = {
	_id: string,
	uuid: string,
	label: string,
	permissions?: { _id: string, label: string }[],
	default: boolean,
}

export type RoleState = {
	roles: RoleData[],
	selectedRole: RoleData | null,
	isLoadingRoles: boolean,
	isSubmitting: boolean,
	roleError: string,
}

export type RoleActions = {
	loadRoles: () => void,
	loadRole: (roleId: string) => void,
	createRole: (name: string, perms?: string[]) => void,
	updateRole: (roleId: string, name: string, perms?: string[]) => void,
	deleteRole: (roleId: string) => void,
	selectRole: (role: RoleData | null) => void,
	clearRoleError: () => void,
}

export type RoleContextType = RoleState & RoleActions
