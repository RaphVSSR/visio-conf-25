import { getMessagesByDomain } from "../ListeMessages.ts"
import SessionManager from "./authentication/SessionManager.ts"
import Team from "../Team.ts"
import TeamMember from "../TeamMember.ts"
import Channel from "../Channel.ts"
import ChannelMember from "../ChannelMember.ts"
import ChannelPost from "../ChannelPost.ts"
import ChannelPostResponse from "../ChannelPostResponse.ts"

type MessageHandler = (socketId: string, payload: any) => void

export default class TeamService {

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

	traitementMessage(msg: any) {
		const action = Object.keys(msg).find(prop => prop !== "id")
		if (!action) return
		const handler = this.handlers.get(action)
		if (handler) handler(msg.id, msg[action])
	}

	register() {
		this.registerHandler("team_get", this.handleTeamQuery)
		this.registerHandler("team_action", this.handleTeamAction)
		this.registerHandler("team_member", this.handleTeamMember)

		this.controleur.inscription(this, getMessagesByDomain("team").received, [...this.handlers.keys()])
	}

	private resolveUserId(socketId: string): string | null {
		return SessionManager.getUserId(socketId)
	}

	private handleTeamQuery = (socketId: string, payload: { type: string, [key: string]: any }) => {

		const dispatchers: Record<string, () => void> = {
			list: () => this.getTeamsList(socketId),
			all: () => this.getAllTeams(socketId),
		}

		dispatchers[payload.type]?.()
	}

	private handleTeamAction = (socketId: string, payload: { type: string, [key: string]: any }) => {

		const dispatchers: Record<string, () => void> = {
			create: () => this.createTeam(socketId, payload),
			update: () => this.updateTeam(socketId, payload),
			delete: () => this.deleteTeam(socketId, payload),
			leave: () => this.leaveTeam(socketId, payload),
		}

		dispatchers[payload.type]?.()
	}

	private handleTeamMember = (socketId: string, payload: { type: string, [key: string]: any }) => {

		const dispatchers: Record<string, () => void> = {
			list: () => this.getTeamMembers(socketId, payload),
			add: () => this.addTeamMember(socketId, payload),
			remove: () => this.removeTeamMember(socketId, payload),
		}

		dispatchers[payload.type]?.()
	}

	private getTeamsList = async (socketId: string) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "team_get_response", { type: "list", etat: false, error: "not_authenticated" })

		const memberships = await TeamMember.model.find({ id: userId }).lean()
		const teamIds = memberships.map(membership => membership.teamId)

		const teams = await Team.model.find({ _id: { $in: teamIds } }).lean()

		const formattedTeams = teams.map(team => {
			const membership = memberships.find(m => m.teamId.toString() === team._id!.toString())
			return {
				id: team._id!.toString(),
				name: team.name,
				description: team.description,
				picture: team.picture,
				createdBy: team.createdBy.toString(),
				createdAt: team.createdAt,
				updatedAt: team.updatedAt,
				role: membership?.role ?? "member",
			}
		})

		this.send(socketId, "team_get_response", { type: "list", etat: true, teams: formattedTeams })
	}

	private getAllTeams = async (socketId: string) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "team_get_response", { type: "all", etat: false, error: "not_authenticated" })

		const teams = await Team.model.find({}).lean()

		const formattedTeams = teams.map(team => ({
			id: team._id!.toString(),
			name: team.name,
			description: team.description,
			picture: team.picture,
			createdBy: team.createdBy.toString(),
			createdAt: team.createdAt,
			updatedAt: team.updatedAt,
		}))

		this.send(socketId, "team_get_response", { type: "all", etat: true, teams: formattedTeams })
	}

	private createTeam = async (socketId: string, payload: { name: string, description?: string, picture?: string, members: string[] }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "team_action_response", { type: "create", etat: false, error: "not_authenticated" })

		const { name, description, picture, members } = payload

		const newTeam = new Team({ name, description, picture, createdBy: userId as any })
		await newTeam.save()

		const teamId = newTeam.modelInstance._id!

		const creatorMember = new TeamMember({ id: userId as any, role: "admin", teamId: teamId as any })
		await creatorMember.save()

		const memberDocIds: string[] = [creatorMember.modelInstance._id!.toString()]

		if (members && members.length > 0) {
			for (const memberId of members) {
				if (memberId === userId) continue

				const teamMember = new TeamMember({ id: memberId as any, role: "member", teamId: teamId as any })
				await teamMember.save()
				memberDocIds.push(teamMember.modelInstance._id!.toString())
			}
		}

		newTeam.modelInstance.members = memberDocIds as any
		await newTeam.modelInstance.save()

		const formattedTeam = {
			id: teamId.toString(),
			name: newTeam.modelInstance.name,
			description: newTeam.modelInstance.description,
			picture: newTeam.modelInstance.picture,
			createdBy: newTeam.modelInstance.createdBy.toString(),
			createdAt: newTeam.modelInstance.createdAt,
			updatedAt: newTeam.modelInstance.updatedAt,
			role: "admin",
		}

		this.send(socketId, "team_action_response", { type: "create", etat: true, team: formattedTeam })
	}

	private updateTeam = async (socketId: string, payload: { id: string, name?: string, description?: string, picture?: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "team_action_response", { type: "update", etat: false, error: "not_authenticated" })

		const { id: teamId, name, description, picture } = payload

		const team = await Team.model.findById(teamId)
		if (!team) return this.send(socketId, "team_action_response", { type: "update", etat: false, error: "team_not_found" })

		const adminMembership = await TeamMember.model.findOne({ teamId, id: userId, role: "admin" }).lean()
		if (!adminMembership) return this.send(socketId, "team_action_response", { type: "update", etat: false, error: "admin_required" })

		if (name !== undefined) team.name = name
		if (description !== undefined) team.description = description
		if (picture !== undefined) team.picture = picture
		team.updatedAt = new Date()

		await team.save()

		const formattedTeam = {
			id: team._id!.toString(),
			name: team.name,
			description: team.description,
			picture: team.picture,
			createdBy: team.createdBy.toString(),
			createdAt: team.createdAt,
			updatedAt: team.updatedAt,
			role: "admin",
		}

		this.send(socketId, "team_action_response", { type: "update", etat: true, team: formattedTeam })
	}

	private deleteTeam = async (socketId: string, payload: { teamId: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "team_action_response", { type: "delete", etat: false, error: "not_authenticated" })

		const { teamId } = payload

		const team = await Team.model.findById(teamId)
		if (!team) return this.send(socketId, "team_action_response", { type: "delete", etat: false, error: "team_not_found" })

		const adminMembership = await TeamMember.model.findOne({ teamId, id: userId, role: "admin" }).lean()
		if (!adminMembership) return this.send(socketId, "team_action_response", { type: "delete", etat: false, error: "admin_required" })

		const channels = await Channel.model.find({ teamId }).lean()
		for (const channel of channels) {
			const channelId = channel._id!.toString()
			const posts = await ChannelPost.model.find({ channelId }).lean()
			const postIds = posts.map((post: any) => post._id)
			await ChannelPostResponse.model.deleteMany({ postId: { $in: postIds } })
			await ChannelPost.model.deleteMany({ channelId })
			await ChannelMember.model.deleteMany({ channelId })
		}
		await Channel.model.deleteMany({ teamId })

		await TeamMember.model.deleteMany({ teamId })
		await Team.model.deleteOne({ _id: teamId })

		this.send(socketId, "team_action_response", { type: "delete", etat: true, teamId })
	}

	private leaveTeam = async (socketId: string, payload: { teamId: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "team_action_response", { type: "leave", etat: false, error: "not_authenticated" })

		const { teamId } = payload

		const membership = await TeamMember.model.findOne({ teamId, id: userId }).lean()
		if (!membership) return this.send(socketId, "team_action_response", { type: "leave", etat: false, error: "not_a_member" })

		if (membership.role === "admin") {
			const adminCount = await TeamMember.model.countDocuments({ teamId, role: "admin" })
			if (adminCount <= 1) return this.send(socketId, "team_action_response", { type: "leave", etat: false, error: "last_admin_cannot_leave" })
		}

		await TeamMember.model.deleteOne({ _id: membership._id })
		await Team.model.updateOne({ _id: teamId }, { $pull: { members: membership._id } })

		this.send(socketId, "team_action_response", { type: "leave", etat: true, teamId })
	}

	private getTeamMembers = async (socketId: string, payload: { teamId: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "team_member_response", { type: "list", etat: false, error: "not_authenticated" })

		const { teamId } = payload

		const team = await Team.model.findById(teamId).lean()
		if (!team) return this.send(socketId, "team_member_response", { type: "list", etat: false, error: "team_not_found" })

		const members = await TeamMember.model.find({ teamId })
			.populate("id", "firstname lastname email picture")
			.lean()

		const formattedMembers = members.map((member: any) => {
			const user = member.id as any
			return {
				id: member._id!.toString(),
				userId: user?._id?.toString() ?? member.id.toString(),
				firstname: user?.firstname,
				lastname: user?.lastname,
				picture: user?.picture,
				role: member.role,
				joinedAt: member.joinedAt,
			}
		})

		this.send(socketId, "team_member_response", { type: "list", etat: true, members: formattedMembers })
	}

	private addTeamMember = async (socketId: string, payload: { teamId: string, userId: string }) => {

		const requesterId = this.resolveUserId(socketId)
		if (!requesterId) return this.send(socketId, "team_member_response", { type: "add", etat: false, error: "not_authenticated" })

		const { teamId, userId: targetUserId } = payload

		const adminMembership = await TeamMember.model.findOne({ teamId, id: requesterId, role: "admin" }).lean()
		if (!adminMembership) return this.send(socketId, "team_member_response", { type: "add", etat: false, error: "admin_required" })

		const existingMember = await TeamMember.model.findOne({ teamId, id: targetUserId }).lean()
		if (existingMember) return this.send(socketId, "team_member_response", { type: "add", etat: false, error: "already_a_member" })

		const teamMember = new TeamMember({ id: targetUserId as any, role: "member", teamId: teamId as any })
		await teamMember.save()

		await Team.model.updateOne({ _id: teamId }, { $push: { members: teamMember.modelInstance._id } })

		this.send(socketId, "team_member_response", { type: "add", etat: true, teamId, userId: targetUserId })
	}

	private removeTeamMember = async (socketId: string, payload: { teamId: string, userId: string }) => {

		const requesterId = this.resolveUserId(socketId)
		if (!requesterId) return this.send(socketId, "team_member_response", { type: "remove", etat: false, error: "not_authenticated" })

		const { teamId, userId: targetUserId } = payload

		const adminMembership = await TeamMember.model.findOne({ teamId, id: requesterId, role: "admin" }).lean()
		if (!adminMembership) return this.send(socketId, "team_member_response", { type: "remove", etat: false, error: "admin_required" })

		const targetMembership = await TeamMember.model.findOne({ teamId, id: targetUserId }).lean()
		if (!targetMembership) return this.send(socketId, "team_member_response", { type: "remove", etat: false, error: "not_a_member" })

		if (targetMembership.role === "admin") return this.send(socketId, "team_member_response", { type: "remove", etat: false, error: "cannot_remove_admin" })

		await TeamMember.model.deleteOne({ _id: targetMembership._id })
		await Team.model.updateOne({ _id: teamId }, { $pull: { members: targetMembership._id } })

		this.send(socketId, "team_member_response", { type: "remove", etat: true, teamId, userId: targetUserId })
	}
}
