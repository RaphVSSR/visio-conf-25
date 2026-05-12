import Permission from "../../Permission.ts"
import Role from "../../Role.ts"
import User from "../../User.ts"
import SessionManager from "../authentication/SessionManager.ts"
import { CONTROLLER_MESSAGE_PERMISSIONS } from "../../permissions/PermissionRegistry.ts"

type ControllerMessage = Record<string, unknown> & { id?: string }

function normalizeRoles(roles: unknown) {
	if (!roles) return []
	return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === "string") : []
}

export function getControllerMessagePermission(message: ControllerMessage) {
	const action = Object.keys(message).find(key => key !== "id")
	if (!action) return undefined

	const rule = CONTROLLER_MESSAGE_PERMISSIONS[action]
	if (!rule) return undefined

	return typeof rule === "function" ? rule(message[action]) : rule
}

export async function userHasRole(userId: string, roleUuid: string) {
	const user = await User.model.findById(userId).select("roles").lean()
	return normalizeRoles(user?.roles).includes(roleUuid)
}

export async function userHasPermission(userId: string, permissionUuid: string) {
	const user = await User.model.findById(userId).select("roles").lean()
	const roleUuids = normalizeRoles(user?.roles)

	if (roleUuids.length === 0) return false

	const permission = await Permission.model
		.findOne({ uuid: permissionUuid })
		.select("_id")
		.lean()

	if (!permission?._id) return false

	const roleWithPermission = await Role.model.exists({
		uuid: { $in: roleUuids },
		permissions: permission._id,
	})

	return Boolean(roleWithPermission)
}

export async function socketHasPermission(socketId: string, permissionUuid: string) {
	const userId = SessionManager.getUserId(socketId)
	if (!userId) return false

	return userHasPermission(userId, permissionUuid)
}
