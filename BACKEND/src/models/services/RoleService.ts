import { getMessagesByDomain } from "../ListeMessages.ts"
import mongoose from "mongoose"
import Permission from "../Permission.ts"
import Role from "../Role.ts"
import AccessRoleGuard from "./AccessRoleGuard.ts"

type MessageHandler = (socketId: string, payload: any) => void

export default class RoleService {

	controleur: any
	nomDInstance: string
	private handlers = new Map<string, MessageHandler>()

	constructor(controleur: any, name: string) {
		this.controleur = controleur
		this.nomDInstance = name
	}

	private registerHandler(messageName: string, handler: MessageHandler) {
		this.handlers.set(messageName, handler)
	}

	private send(socketIds: string | string[], messageName: string, payload: unknown) {
		const ids = Array.isArray(socketIds) ? socketIds : [socketIds]
		this.controleur.envoie(this, { [messageName]: payload, id: ids })
	}

	private async sanitizePermissionIds(permissionIds: unknown[] = []) {
		const validIds = permissionIds
			.filter((permissionId): permissionId is string => typeof permissionId === "string")
			.filter(permissionId => mongoose.Types.ObjectId.isValid(permissionId))

		if (validIds.length === 0) return []

		const permissions = await Permission.model
			.find({ _id: { $in: validIds } }, { _id: 1 })
			.lean()

		return permissions.map(permission => permission._id)
	}

	traitementMessage(msg: any) {
		const action = Object.keys(msg).find(prop => prop !== "id")
		if (!action) return
		const handler = this.handlers.get(action)
		if (handler) handler(msg.id, msg[action])
	}

	register() {
		this.registerHandler("get_roles", this.handleGetRoles)
		this.registerHandler("get_role", this.handleGetRole)
		this.registerHandler("create_role", this.handleCreateRole)
		this.registerHandler("update_role", this.handleUpdateRole)
		this.registerHandler("delete_role", this.handleDeleteRole)

		this.controleur.inscription(this, getMessagesByDomain("roles").received, [...this.handlers.keys()])
	}

	private handleGetRoles = async (socketId: string) => {
		try {
			const roles = await Role.model
				.find()
				.populate("permissions", "_id label uuid default")
				.lean()
			this.send(socketId, "roles", roles)
		} catch (err) {
			console.error("INFO (" + this.nomDInstance + "): erreur get_roles", err)
		}
	}

	private handleGetRole = async (socketId: string, payload: { role_id: string }) => {
		try {
			const role = await Role.model
				.findOne({ _id: payload.role_id })
				.populate("permissions", "_id label uuid default")
				.lean()
			this.send(socketId, "role", role)
		} catch (err) {
			console.error("INFO (" + this.nomDInstance + "): erreur get_role", err)
		}
	}

	private handleCreateRole = async (socketId: string, payload: { name: string, perms: any[] }) => {
		try {
			const guard = await AccessRoleGuard.requireRole(socketId, "admin")
			if (!guard.authorized) return this.send(socketId, "role_creating_status", { success: false, message: guard.reason })

			const existing = await Role.model.findOne({ label: payload.name })
			if (existing == null) {
				const permissions = await this.sanitizePermissionIds(payload.perms)
				const newRole = new Role.model({
					uuid: payload.name.toLowerCase().replace(/ /g, "_"),
					label: payload.name,
					permissions,
					default: false,
				})
				const r = await newRole.save()
				this.send(socketId, "role_creating_status", { success: true, role_id: r._id })
			} else {
				this.send(socketId, "role_already_exists", { message: "Ce rôle existe déjà" })
			}
		} catch (err) {
			console.error("INFO (" + this.nomDInstance + "): erreur create_role", err)
			this.send(socketId, "role_creating_status", { success: false, message: "Erreur serveur" })
		}
	}

	private handleUpdateRole = async (socketId: string, payload: { role_id: string, name?: string, perms?: any[] }) => {
		try {
			const guard = await AccessRoleGuard.requireRole(socketId, "admin")
			if (!guard.authorized) return this.send(socketId, "role_updating_status", { success: false, message: guard.reason })

			const updateData: any = {}
			if (payload.name) {
				updateData.label = payload.name
				updateData.uuid = payload.name.toLowerCase().replace(/ /g, "_")
			}
			if (payload.perms) updateData.permissions = await this.sanitizePermissionIds(payload.perms)

			await Role.model.updateOne({ _id: payload.role_id }, { $set: updateData })
			this.send(socketId, "role_updating_status", { success: true })
		} catch (err) {
			console.error("INFO (" + this.nomDInstance + "): erreur update_role", err)
			this.send(socketId, "role_updating_status", { success: false, message: "Erreur serveur" })
		}
	}

	private handleDeleteRole = async (socketId: string, payload: { role_id: string }) => {
		try {
			const guard = await AccessRoleGuard.requireRole(socketId, "admin")
			if (!guard.authorized) return this.send(socketId, "role_deleting_status", { success: false, message: guard.reason })

			await Role.model.deleteOne({ _id: payload.role_id })
			this.send(socketId, "role_deleting_status", { success: true })
		} catch (err) {
			console.error("INFO (" + this.nomDInstance + "): erreur delete_role", err)
			this.send(socketId, "role_deleting_status", { success: false, message: "Erreur serveur" })
		}
	}
}
