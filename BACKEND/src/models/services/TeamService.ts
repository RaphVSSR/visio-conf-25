import { ControllerBinder, type ControllerMessage } from "../../Controller/Controller.abstracts.ts"
import Session from "./authentication/Session.ts"
import Team from "../Team.ts"
import TeamMember from "../TeamMember.ts"
import Channel from "../Channel.ts"
import ChannelMember from "../ChannelMember.ts"
import ChannelPost from "../ChannelPost.ts"
import ChannelPostResponse from "../ChannelPostResponse.ts"

export default class TeamService extends ControllerBinder {

	traitementMessage(mesg: ControllerMessage) {

		const socketId = mesg.id
		const action = Object.keys(mesg).find(key => key !== "id")

		switch (action) {

			case "teams_list_request":
				this.getTeamsList(socketId); break

			case "all_teams_request":
				this.getAllTeams(socketId); break

			case "team_create_request":
				this.createTeam(socketId, mesg[action] as { name: string, description?: string, picture?: string, members: string[] }); break

			case "team_update_request":
				this.updateTeam(socketId, mesg[action] as { id: string, name?: string, description?: string, picture?: string }); break

			case "team_delete_request":
				this.deleteTeam(socketId, mesg[action] as { teamId: string }); break

			case "team_leave_request":
				this.leaveTeam(socketId, mesg[action] as { teamId: string }); break

			case "team_members_request":
				this.getTeamMembers(socketId, mesg[action] as { teamId: string }); break

			case "team_add_member_request":
				this.addTeamMember(socketId, mesg[action] as { teamId: string, userId: string }); break

			case "team_remove_member_request":
				this.removeTeamMember(socketId, mesg[action] as { teamId: string, userId: string }); break
		}
	}

	private async resolveUserId(socketId: string): Promise<string | null> {

		const session = await Session.getSessionBySocket(socketId)
		return session ? session.userId.toString() : null
	}

	private async getTeamsList(socketId: string) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { teams_list_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

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

		this.controleur.envoie(this, { teams_list_response: { etat: true, teams: formattedTeams }, id: [socketId] })
	}

	private async getAllTeams(socketId: string) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { all_teams_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

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

		this.controleur.envoie(this, { all_teams_response: { etat: true, teams: formattedTeams }, id: [socketId] })
	}

	private async createTeam(socketId: string, payload: { name: string, description?: string, picture?: string, members: string[] }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { team_create_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

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

		this.controleur.envoie(this, { team_create_response: { etat: true, team: formattedTeam }, id: [socketId] })
	}

	private async updateTeam(socketId: string, payload: { id: string, name?: string, description?: string, picture?: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { team_update_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { id: teamId, name, description, picture } = payload

		const team = await Team.model.findById(teamId)
		if (!team) return this.controleur.envoie(this, { team_update_response: { etat: false, error: "team_not_found" }, id: [socketId] })

		const adminMembership = await TeamMember.model.findOne({ teamId, id: userId, role: "admin" }).lean()
		if (!adminMembership) return this.controleur.envoie(this, { team_update_response: { etat: false, error: "admin_required" }, id: [socketId] })

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

		this.controleur.envoie(this, { team_update_response: { etat: true, team: formattedTeam }, id: [socketId] })
	}

	private async deleteTeam(socketId: string, payload: { teamId: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { team_delete_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { teamId } = payload

		const team = await Team.model.findById(teamId)
		if (!team) return this.controleur.envoie(this, { team_delete_response: { etat: false, error: "team_not_found" }, id: [socketId] })

		const adminMembership = await TeamMember.model.findOne({ teamId, id: userId, role: "admin" }).lean()
		if (!adminMembership) return this.controleur.envoie(this, { team_delete_response: { etat: false, error: "admin_required" }, id: [socketId] })

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

		this.controleur.envoie(this, { team_delete_response: { etat: true, teamId }, id: [socketId] })
	}

	private async leaveTeam(socketId: string, payload: { teamId: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { team_leave_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { teamId } = payload

		const membership = await TeamMember.model.findOne({ teamId, id: userId }).lean()
		if (!membership) return this.controleur.envoie(this, { team_leave_response: { etat: false, error: "not_a_member" }, id: [socketId] })

		if (membership.role === "admin") {
			const adminCount = await TeamMember.model.countDocuments({ teamId, role: "admin" })
			if (adminCount <= 1) return this.controleur.envoie(this, { team_leave_response: { etat: false, error: "last_admin_cannot_leave" }, id: [socketId] })
		}

		await TeamMember.model.deleteOne({ _id: membership._id })
		await Team.model.updateOne({ _id: teamId }, { $pull: { members: membership._id } })

		this.controleur.envoie(this, { team_leave_response: { etat: true, teamId }, id: [socketId] })
	}

	private async getTeamMembers(socketId: string, payload: { teamId: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { team_members_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { teamId } = payload

		const team = await Team.model.findById(teamId).lean()
		if (!team) return this.controleur.envoie(this, { team_members_response: { etat: false, error: "team_not_found" }, id: [socketId] })

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

		this.controleur.envoie(this, { team_members_response: { etat: true, members: formattedMembers }, id: [socketId] })
	}

	private async addTeamMember(socketId: string, payload: { teamId: string, userId: string }) {

		const requesterId = await this.resolveUserId(socketId)
		if (!requesterId) return this.controleur.envoie(this, { team_add_member_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { teamId, userId: targetUserId } = payload

		const adminMembership = await TeamMember.model.findOne({ teamId, id: requesterId, role: "admin" }).lean()
		if (!adminMembership) return this.controleur.envoie(this, { team_add_member_response: { etat: false, error: "admin_required" }, id: [socketId] })

		const existingMember = await TeamMember.model.findOne({ teamId, id: targetUserId }).lean()
		if (existingMember) return this.controleur.envoie(this, { team_add_member_response: { etat: false, error: "already_a_member" }, id: [socketId] })

		const teamMember = new TeamMember({ id: targetUserId as any, role: "member", teamId: teamId as any })
		await teamMember.save()

		await Team.model.updateOne({ _id: teamId }, { $push: { members: teamMember.modelInstance._id } })

		this.controleur.envoie(this, { team_add_member_response: { etat: true, teamId, userId: targetUserId }, id: [socketId] })
	}

	private async removeTeamMember(socketId: string, payload: { teamId: string, userId: string }) {

		const requesterId = await this.resolveUserId(socketId)
		if (!requesterId) return this.controleur.envoie(this, { team_remove_member_response: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { teamId, userId: targetUserId } = payload

		const adminMembership = await TeamMember.model.findOne({ teamId, id: requesterId, role: "admin" }).lean()
		if (!adminMembership) return this.controleur.envoie(this, { team_remove_member_response: { etat: false, error: "admin_required" }, id: [socketId] })

		const targetMembership = await TeamMember.model.findOne({ teamId, id: targetUserId }).lean()
		if (!targetMembership) return this.controleur.envoie(this, { team_remove_member_response: { etat: false, error: "not_a_member" }, id: [socketId] })

		if (targetMembership.role === "admin") return this.controleur.envoie(this, { team_remove_member_response: { etat: false, error: "cannot_remove_admin" }, id: [socketId] })

		await TeamMember.model.deleteOne({ _id: targetMembership._id })
		await Team.model.updateOne({ _id: teamId }, { $pull: { members: targetMembership._id } })

		this.controleur.envoie(this, { team_remove_member_response: { etat: true, teamId, userId: targetUserId }, id: [socketId] })
	}
}
