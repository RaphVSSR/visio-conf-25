import { ControllerBinder, type ControllerMessage } from "../../Controller/Controller.abstracts.ts"
import Session from "./authentication/Session.ts"
import User from "../User.ts"

export default class UserService extends ControllerBinder {

	traitementMessage(mesg: ControllerMessage) {

		const socketId = mesg.id
		const action = Object.keys(mesg).find(key => key !== "id")

		switch (action) {

			case "users_list_request":
				this.getUsersList(socketId); break

			case "user_info_request":
				this.getUserInfo(socketId, mesg[action] as { userId: string }); break

			case "users_search_request":
				this.searchUsers(socketId, mesg[action] as { query: string }); break

			case "update_user_request":
				this.updateUser(socketId, mesg[action] as Record<string, any>); break

			case "update_user_status_request":
				this.updateUserStatus(socketId, mesg[action] as { userId: string, status: string }); break

			case "update_user_roles_request":
				this.updateUserRoles(socketId, mesg[action] as { userId: string, roles: string[] }); break
		}
	}

	private async resolveUserId(socketId: string): Promise<string | null> {

		const session = await Session.getSessionBySocket(socketId)
		return session ? session.userId.toString() : null
	}

	private async getUsersList(socketId: string) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { users_list_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const users = await User.model.find({ status: "active" })
			.select("firstname lastname email picture is_online job")
			.lean()

		const formattedUsers = users.map(user => ({
			id: user._id!.toString(),
			firstname: user.firstname,
			lastname: user.lastname,
			email: user.email,
			picture: user.picture,
			isOnline: user.is_online,
			job: user.job,
		}))

		this.controleur.envoie(this, { users_list_response: { etat: true, users: formattedUsers }, id: [socketId] })
	}

	private async getUserInfo(socketId: string, payload: { userId: string }) {

		const requesterId = await this.resolveUserId(socketId)
		if (!requesterId) return this.controleur.envoie(this, { user_info_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { userId } = payload

		const user = await User.model.findById(userId)
			.select("firstname lastname email picture is_online job desc phone date_created")
			.lean()

		if (!user) return this.controleur.envoie(this, { user_info_response: { etat: false, error: "user_not_found" }, id: [socketId] })

		const formattedUser = {
			id: user._id!.toString(),
			firstname: user.firstname,
			lastname: user.lastname,
			email: user.email,
			picture: user.picture,
			isOnline: user.is_online,
			job: user.job,
			desc: user.desc,
			phone: user.phone,
			dateCreated: user.date_created,
		}

		this.controleur.envoie(this, { user_info_response: { etat: true, user: formattedUser }, id: [socketId] })
	}

	private async searchUsers(socketId: string, payload: { query: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { users_search_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { query } = payload
		const regex = new RegExp(query, "i")

		const users = await User.model.find({
			status: "active",
			$or: [
				{ firstname: regex },
				{ lastname: regex },
				{ email: regex },
			],
		})
			.select("firstname lastname email picture is_online")
			.limit(20)
			.lean()

		const formattedUsers = users.map(user => ({
			id: user._id!.toString(),
			firstname: user.firstname,
			lastname: user.lastname,
			email: user.email,
			picture: user.picture,
			isOnline: user.is_online,
		}))

		this.controleur.envoie(this, { users_search_response: { etat: true, users: formattedUsers }, id: [socketId] })
	}

	private async updateUser(socketId: string, payload: Record<string, any>) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { update_user_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const allowedFields = ["firstname", "lastname", "phone", "job", "desc", "picture"]
		const updateData: Record<string, any> = {}

		for (const field of allowedFields) {
			if (payload[field] !== undefined) updateData[field] = payload[field]
		}

		await User.model.updateOne({ _id: userId }, { $set: updateData })

		this.controleur.envoie(this, { update_user_response: { etat: true }, id: [socketId] })
	}

	private async updateUserStatus(socketId: string, payload: { userId: string, status: string }) {

		const requesterId = await this.resolveUserId(socketId)
		if (!requesterId) return this.controleur.envoie(this, { update_user_status_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { userId, status } = payload

		await User.model.updateOne({ _id: userId }, { $set: { status } })

		this.controleur.envoie(this, { update_user_status_response: { etat: true, userId, status }, id: [socketId] })
	}

	private async updateUserRoles(socketId: string, payload: { userId: string, roles: string[] }) {

		const requesterId = await this.resolveUserId(socketId)
		if (!requesterId) return this.controleur.envoie(this, { update_user_roles_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { userId, roles } = payload

		await User.model.updateOne({ _id: userId }, { $set: { roles } })

		this.controleur.envoie(this, { update_user_roles_response: { etat: true, userId, roles }, id: [socketId] })
	}
}
