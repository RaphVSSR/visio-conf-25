import { type Types } from "mongoose"
import { ControllerBinder, type ControllerMessage } from "../../Controller/Controller.abstracts.ts"
import Session from "./authentication/Session.ts"
import Channel from "../Channel.ts"
import ChannelMember, { type ChannelMemberType } from "../ChannelMember.ts"
import ChannelPost, { type ChannelPostType } from "../ChannelPost.ts"
import ChannelPostResponse from "../ChannelPostResponse.ts"
import TeamMember from "../TeamMember.ts"

type WithId<T> = T & { _id: Types.ObjectId }

export default class ChannelService extends ControllerBinder {

	traitementMessage(mesg: ControllerMessage) {

		const socketId = mesg.id
		const action = Object.keys(mesg).find(key => key !== "id")

		switch (action) {

			case "get_channels":
				this.getChannels(socketId, mesg[action] as { teamId: string }); break

			case "get_channel":
				this.getChannel(socketId, mesg[action] as { channelId: string }); break

			case "create_channel":
				this.createChannel(socketId, mesg[action] as { name: string, isPublic: boolean, teamId: string, members?: string[] }); break

			case "update_channel":
				this.updateChannel(socketId, mesg[action] as { id: string, name: string, isPublic: boolean, teamId: string, members?: string[] }); break

			case "delete_channel":
				this.deleteChannel(socketId, mesg[action] as { channelId: string }); break

			case "get_channel_members":
				this.getChannelMembers(socketId, mesg[action] as { channelId: string }); break

			case "add_channel_member":
				this.addChannelMember(socketId, mesg[action] as { channelId: string, userId: string }); break

			case "remove_channel_member":
				this.removeChannelMember(socketId, mesg[action] as { channelId: string, userId: string }); break

			case "leave_channel":
				this.leaveChannel(socketId, mesg[action] as { channelId: string }); break

			case "get_posts":
				this.getChannelPosts(socketId, mesg[action] as { channelId: string }); break

			case "get_user_post":
				this.getUserPost(socketId, mesg[action] as { channelId: string, userId: string }); break

			case "publish_post":
				this.publishPost(socketId, mesg[action] as { channelId: string, content: string }); break

			case "update_post":
				this.updatePost(socketId, mesg[action] as { postId: string, content: string }); break

			case "delete_post":
				this.deletePost(socketId, mesg[action] as { postId: string }); break

			case "answer_post":
				this.answerPost(socketId, mesg[action] as { postId: string, content: string }); break
		}
	}

	private async resolveUserId(socketId: string): Promise<string | null> {

		const session = await Session.getSessionBySocket(socketId)
		return session ? session.userId.toString() : null
	}

	private async getConnectedChannelMemberSocketIds(channelId: string): Promise<string[]> {

		const members = await ChannelMember.model.find({ channelId }).lean()
		const socketIds: string[] = []

		for (const member of members) {
			const memberSockets = await Session.getUserSocketIds(member.userId.toString())
			socketIds.push(...memberSockets)
		}

		return socketIds
	}

	private async getConnectedTeamMemberSocketIds(teamId: string): Promise<string[]> {

		const members = await TeamMember.model.find({ teamId }).lean()
		const socketIds: string[] = []

		for (const member of members) {
			const memberSockets = await Session.getUserSocketIds(member.id.toString())
			socketIds.push(...memberSockets)
		}

		return socketIds
	}

	private async getChannels(socketId: string, payload: { teamId: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { channels: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { teamId } = payload

		const channels = await Channel.model.find({ teamId }).lean()

		const visibleChannels = []
		for (const channel of channels) {
			if (channel.isPublic) {
				visibleChannels.push(channel)
			} else {
				const membership = await ChannelMember.model.findOne({ channelId: channel._id, userId }).lean()
				if (membership) visibleChannels.push(channel)
			}
		}

		const formattedChannels = visibleChannels.map(channel => ({
			id: channel._id!.toString(),
			name: channel.name,
			isPublic: channel.isPublic,
			createdBy: channel.createdBy.toString(),
			createdAt: channel.createdAt,
		}))

		this.controleur.envoie(this, { channels: { etat: true, channels: formattedChannels }, id: [socketId] })
	}

	private async getChannel(socketId: string, payload: { channelId: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { channel: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { channelId } = payload

		const channel = await Channel.model.findById(channelId).lean()
		if (!channel) return this.controleur.envoie(this, { channel: { etat: false, error: "channel_not_found" }, id: [socketId] })

		if (!channel.isPublic) {
			const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
			if (!membership) return this.controleur.envoie(this, { channel: { etat: false, error: "not_a_member" }, id: [socketId] })
		}

		const formattedChannel = {
			id: channel._id!.toString(),
			name: channel.name,
			isPublic: channel.isPublic,
			createdBy: channel.createdBy.toString(),
			createdAt: channel.createdAt,
		}

		this.controleur.envoie(this, { channel: { etat: true, channel: formattedChannel }, id: [socketId] })
	}

	private async createChannel(socketId: string, payload: { name: string, isPublic: boolean, teamId: string, members?: string[] }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { channel_creating_status: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { name, isPublic, teamId, members } = payload

		const newChannel = new Channel({ name, isPublic, teamId: teamId as any, createdBy: userId as any })
		await newChannel.save()

		const channelId = newChannel.modelInstance._id!

		const creatorMember = new ChannelMember({ channelId: channelId as any, userId: userId as any, role: "admin" })
		await creatorMember.save()

		const memberIds: string[] = [creatorMember.modelInstance._id!.toString()]

		if (isPublic) {

			const teamMembers = await TeamMember.model.find({ teamId }).lean()
			for (const teamMember of teamMembers) {
				const teamMemberUserId = teamMember.id.toString()
				if (teamMemberUserId === userId) continue

				const channelMember = new ChannelMember({ channelId: channelId as any, userId: teamMemberUserId as any, role: "member" })
				await channelMember.save()
				memberIds.push(channelMember.modelInstance._id!.toString())
			}

		} else if (members && members.length > 0) {

			for (const memberId of members) {
				if (memberId === userId) continue

				const channelMember = new ChannelMember({ channelId: channelId as any, userId: memberId as any, role: "member" })
				await channelMember.save()
				memberIds.push(channelMember.modelInstance._id!.toString())
			}
		}

		newChannel.modelInstance.members = memberIds as any
		await newChannel.modelInstance.save()

		const formattedChannel = {
			id: channelId.toString(),
			name: newChannel.modelInstance.name,
			isPublic: newChannel.modelInstance.isPublic,
			createdBy: newChannel.modelInstance.createdBy.toString(),
			createdAt: newChannel.modelInstance.createdAt,
		}

		const teamSocketIds = await this.getConnectedTeamMemberSocketIds(teamId)
		this.controleur.envoie(this, { channel_creating_status: { etat: true, channel: formattedChannel }, id: teamSocketIds.length > 0 ? teamSocketIds : [socketId] })
	}

	private async updateChannel(socketId: string, payload: { id: string, name: string, isPublic: boolean, teamId: string, members?: string[] }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { channel_updating_status: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { id: channelId, name, isPublic, teamId, members } = payload

		const channel = await Channel.model.findById(channelId)
		if (!channel) return this.controleur.envoie(this, { channel_updating_status: { etat: false, error: "channel_not_found" }, id: [socketId] })

		const adminMembership = await ChannelMember.model.findOne({ channelId, userId, role: "admin" }).lean()
		if (!adminMembership) return this.controleur.envoie(this, { channel_updating_status: { etat: false, error: "admin_required" }, id: [socketId] })

		channel.name = name
		channel.isPublic = isPublic
		channel.updatedAt = new Date()

		if (isPublic) {

			const existingMembers = await ChannelMember.model.find({ channelId }).lean()
			const existingUserIds = new Set(existingMembers.map((member: ChannelMemberType) => member.userId.toString()))

			const teamMembers = await TeamMember.model.find({ teamId }).lean()
			for (const teamMember of teamMembers) {
				const teamMemberUserId = teamMember.id.toString()
				if (existingUserIds.has(teamMemberUserId)) continue

				const channelMember = new ChannelMember({ channelId: channelId as any, userId: teamMemberUserId as any, role: "member" })
				await channelMember.save()
			}

		} else if (members) {

			const existingMembers = await ChannelMember.model.find({ channelId }).lean()
			const desiredMemberSet = new Set(members)
			desiredMemberSet.add(userId)

			for (const existing of existingMembers) {
				const existingUserId = existing.userId.toString()
				if (!desiredMemberSet.has(existingUserId)) {
					await ChannelMember.model.deleteOne({ _id: existing._id })
				}
			}

			const existingUserIds = new Set(existingMembers.map((member: ChannelMemberType) => member.userId.toString()))
			for (const memberId of members) {
				if (existingUserIds.has(memberId)) continue

				const channelMember = new ChannelMember({ channelId: channelId as any, userId: memberId as any, role: "member" })
				await channelMember.save()
			}
		}

		const allMembers = await ChannelMember.model.find({ channelId }).lean()
		channel.members = allMembers.map((member: WithId<ChannelMemberType>) => member._id) as any
		await channel.save()

		const formattedChannel = {
			id: channel._id!.toString(),
			name: channel.name,
			isPublic: channel.isPublic,
			createdBy: channel.createdBy.toString(),
			createdAt: channel.createdAt,
		}

		const teamSocketIds = await this.getConnectedTeamMemberSocketIds(teamId)
		this.controleur.envoie(this, { channel_updating_status: { etat: true, channel: formattedChannel }, id: teamSocketIds.length > 0 ? teamSocketIds : [socketId] })
	}

	private async deleteChannel(socketId: string, payload: { channelId: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { channel_deleting_status: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { channelId } = payload

		const channel = await Channel.model.findById(channelId)
		if (!channel) return this.controleur.envoie(this, { channel_deleting_status: { etat: false, error: "channel_not_found" }, id: [socketId] })

		const adminMembership = await ChannelMember.model.findOne({ channelId, userId, role: "admin" }).lean()
		if (!adminMembership) return this.controleur.envoie(this, { channel_deleting_status: { etat: false, error: "admin_required" }, id: [socketId] })

		const teamSocketIds = await this.getConnectedTeamMemberSocketIds(channel.teamId.toString())

		const posts = await ChannelPost.model.find({ channelId }).lean()
		const postIds = posts.map((post: WithId<ChannelPostType>) => post._id)
		await ChannelPostResponse.model.deleteMany({ postId: { $in: postIds } })
		await ChannelPost.model.deleteMany({ channelId })
		await ChannelMember.model.deleteMany({ channelId })
		await Channel.model.deleteOne({ _id: channelId })

		this.controleur.envoie(this, { channel_deleting_status: { etat: true, channelId }, id: teamSocketIds.length > 0 ? teamSocketIds : [socketId] })
	}

	private async getChannelMembers(socketId: string, payload: { channelId: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { channel_members: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { channelId } = payload

		const channel = await Channel.model.findById(channelId).lean()
		if (!channel) return this.controleur.envoie(this, { channel_members: { etat: false, error: "channel_not_found" }, id: [socketId] })

		if (!channel.isPublic) {
			const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
			if (!membership) return this.controleur.envoie(this, { channel_members: { etat: false, error: "not_a_member" }, id: [socketId] })
		}

		const members = await ChannelMember.model.find({ channelId })
			.populate("userId", "firstname lastname email picture")
			.lean()

		const formattedMembers = members.map((member: any) => {
			const user = member.userId as any
			return {
				id: member._id!.toString(),
				userId: user?._id?.toString() ?? member.userId.toString(),
				firstname: user?.firstname,
				lastname: user?.lastname,
				picture: user?.picture,
				role: member.role,
				joinedAt: member.joinedAt,
			}
		})

		this.controleur.envoie(this, { channel_members: { etat: true, members: formattedMembers }, id: [socketId] })
	}

	private async addChannelMember(socketId: string, payload: { channelId: string, userId: string }) {

		const requesterId = await this.resolveUserId(socketId)
		if (!requesterId) return this.controleur.envoie(this, { channel_member_adding_status: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { channelId, userId: targetUserId } = payload

		const adminMembership = await ChannelMember.model.findOne({ channelId, userId: requesterId, role: "admin" }).lean()
		if (!adminMembership) return this.controleur.envoie(this, { channel_member_adding_status: { etat: false, error: "admin_required" }, id: [socketId] })

		const existingMember = await ChannelMember.model.findOne({ channelId, userId: targetUserId }).lean()
		if (existingMember) return this.controleur.envoie(this, { channel_member_adding_status: { etat: false, error: "already_a_member" }, id: [socketId] })

		const channelMember = new ChannelMember({ channelId: channelId as any, userId: targetUserId as any, role: "member" })
		await channelMember.save()

		await Channel.model.updateOne({ _id: channelId }, { $push: { members: channelMember.modelInstance._id } })

		this.controleur.envoie(this, { channel_member_adding_status: { etat: true, channelId, userId: targetUserId }, id: [socketId] })
	}

	private async removeChannelMember(socketId: string, payload: { channelId: string, userId: string }) {

		const requesterId = await this.resolveUserId(socketId)
		if (!requesterId) return this.controleur.envoie(this, { channel_member_removing_status: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { channelId, userId: targetUserId } = payload

		const adminMembership = await ChannelMember.model.findOne({ channelId, userId: requesterId, role: "admin" }).lean()
		if (!adminMembership) return this.controleur.envoie(this, { channel_member_removing_status: { etat: false, error: "admin_required" }, id: [socketId] })

		const targetMembership = await ChannelMember.model.findOne({ channelId, userId: targetUserId }).lean()
		if (!targetMembership) return this.controleur.envoie(this, { channel_member_removing_status: { etat: false, error: "not_a_member" }, id: [socketId] })

		if (targetMembership.role === "admin") return this.controleur.envoie(this, { channel_member_removing_status: { etat: false, error: "cannot_remove_admin" }, id: [socketId] })

		await ChannelMember.model.deleteOne({ _id: targetMembership._id })
		await Channel.model.updateOne({ _id: channelId }, { $pull: { members: targetMembership._id } })

		this.controleur.envoie(this, { channel_member_removing_status: { etat: true, channelId, userId: targetUserId }, id: [socketId] })
	}

	private async leaveChannel(socketId: string, payload: { channelId: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { channel_leaving_status: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { channelId } = payload

		const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
		if (!membership) return this.controleur.envoie(this, { channel_leaving_status: { etat: false, error: "not_a_member" }, id: [socketId] })

		if (membership.role === "admin") {
			const adminCount = await ChannelMember.model.countDocuments({ channelId, role: "admin" })
			if (adminCount <= 1) return this.controleur.envoie(this, { channel_leaving_status: { etat: false, error: "last_admin_cannot_leave" }, id: [socketId] })
		}

		await ChannelMember.model.deleteOne({ _id: membership._id })
		await Channel.model.updateOne({ _id: channelId }, { $pull: { members: membership._id } })

		this.controleur.envoie(this, { channel_leaving_status: { etat: true, channelId }, id: [socketId] })
	}

	private async getChannelPosts(socketId: string, payload: { channelId: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { posts: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { channelId } = payload

		const channel = await Channel.model.findById(channelId).lean()
		if (!channel) return this.controleur.envoie(this, { posts: { etat: false, error: "channel_not_found" }, id: [socketId] })

		if (!channel.isPublic) {
			const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
			if (!membership) return this.controleur.envoie(this, { posts: { etat: false, error: "not_a_member" }, id: [socketId] })
		}

		const posts = await ChannelPost.model.find({ channelId })
			.populate("authorId", "firstname lastname email picture")
			.sort({ createdAt: 1 })
			.lean()

		const formattedPosts = await Promise.all(posts.map(async (post: any) => {

			const responses = await ChannelPostResponse.model.find({ postId: post._id })
				.populate("authorId", "firstname lastname email picture")
				.sort({ createdAt: 1 })
				.lean()

			const author = post.authorId as any
			return {
				id: post._id!.toString(),
				channelId: post.channelId.toString(),
				content: post.content,
				authorId: author?._id?.toString() ?? post.authorId.toString(),
				authorFirstname: author?.firstname,
				authorLastname: author?.lastname,
				authorPicture: author?.picture,
				createdAt: post.createdAt,
				updatedAt: post.updatedAt,
				responseCount: responses.length,
				responses: responses.map((response: any) => {
					const respAuthor = response.authorId as any
					return {
						id: response._id!.toString(),
						postId: response.postId.toString(),
						content: response.content,
						authorId: respAuthor?._id?.toString() ?? response.authorId.toString(),
						authorFirstname: respAuthor?.firstname,
						authorLastname: respAuthor?.lastname,
						authorPicture: respAuthor?.picture,
						createdAt: response.createdAt,
						updatedAt: response.updatedAt,
					}
				}),
			}
		}))

		this.controleur.envoie(this, { posts: { etat: true, posts: formattedPosts }, id: [socketId] })
	}

	private async getUserPost(socketId: string, payload: { channelId: string, userId: string }) {

		const requesterId = await this.resolveUserId(socketId)
		if (!requesterId) return this.controleur.envoie(this, { user_post: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { channelId, userId: targetUserId } = payload

		const channel = await Channel.model.findById(channelId).lean()
		if (!channel) return this.controleur.envoie(this, { user_post: { etat: false, error: "channel_not_found" }, id: [socketId] })

		if (!channel.isPublic) {
			const membership = await ChannelMember.model.findOne({ channelId, userId: requesterId }).lean()
			if (!membership) return this.controleur.envoie(this, { user_post: { etat: false, error: "not_a_member" }, id: [socketId] })
		}

		const posts = await ChannelPost.model.find({ channelId, authorId: targetUserId })
			.populate("authorId", "firstname lastname email picture")
			.sort({ createdAt: 1 })
			.lean()

		const formattedPosts = posts.map((post: any) => {
			const author = post.authorId as any
			return {
				id: post._id!.toString(),
				channelId: post.channelId.toString(),
				content: post.content,
				authorId: author?._id?.toString() ?? post.authorId.toString(),
				authorFirstname: author?.firstname,
				authorLastname: author?.lastname,
				authorPicture: author?.picture,
				createdAt: post.createdAt,
				updatedAt: post.updatedAt,
			}
		})

		this.controleur.envoie(this, { user_post: { etat: true, posts: formattedPosts }, id: [socketId] })
	}

	private async publishPost(socketId: string, payload: { channelId: string, content: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { post_publishing_status: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { channelId, content } = payload

		const channel = await Channel.model.findById(channelId).lean()
		if (!channel) return this.controleur.envoie(this, { post_publishing_status: { etat: false, error: "channel_not_found" }, id: [socketId] })

		const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
		if (!membership) return this.controleur.envoie(this, { post_publishing_status: { etat: false, error: "not_a_member" }, id: [socketId] })

		const newPost = new ChannelPost({ channelId: channelId as any, content, authorId: userId as any })
		await newPost.save()

		const populatedPost = await ChannelPost.model.findById(newPost.modelInstance._id)
			.populate("authorId", "firstname lastname email picture")
			.lean()

		const author = populatedPost!.authorId as any
		const formattedPost = {
			id: populatedPost!._id!.toString(),
			channelId: populatedPost!.channelId.toString(),
			content: populatedPost!.content,
			authorId: author?._id?.toString() ?? populatedPost!.authorId.toString(),
			authorFirstname: author?.firstname,
			authorLastname: author?.lastname,
			authorPicture: author?.picture,
			createdAt: populatedPost!.createdAt,
			updatedAt: populatedPost!.updatedAt,
			responseCount: 0,
			responses: [],
		}

		const broadcastSocketIds = await this.getConnectedChannelMemberSocketIds(channelId)

		this.controleur.envoie(this, { post_publishing_status: { etat: true, post: formattedPost }, id: broadcastSocketIds.length > 0 ? broadcastSocketIds : [socketId] })
	}

	private async updatePost(socketId: string, payload: { postId: string, content: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { post_updating_status: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { postId, content } = payload

		const post = await ChannelPost.model.findById(postId)
		if (!post) return this.controleur.envoie(this, { post_updating_status: { etat: false, error: "post_not_found" }, id: [socketId] })

		if (post.authorId.toString() !== userId) return this.controleur.envoie(this, { post_updating_status: { etat: false, error: "not_the_author" }, id: [socketId] })

		post.content = content
		post.updatedAt = new Date()
		await post.save()

		this.controleur.envoie(this, { post_updating_status: { etat: true, postId, content }, id: [socketId] })
	}

	private async deletePost(socketId: string, payload: { postId: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { post_deleting_status: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { postId } = payload

		const post = await ChannelPost.model.findById(postId)
		if (!post) return this.controleur.envoie(this, { post_deleting_status: { etat: false, error: "post_not_found" }, id: [socketId] })

		const isAuthor = post.authorId.toString() === userId
		const isAdmin = await ChannelMember.model.findOne({ channelId: post.channelId, userId, role: "admin" }).lean()

		if (!isAuthor && !isAdmin) return this.controleur.envoie(this, { post_deleting_status: { etat: false, error: "not_authorized" }, id: [socketId] })

		await ChannelPostResponse.model.deleteMany({ postId })
		await ChannelPost.model.deleteOne({ _id: postId })

		this.controleur.envoie(this, { post_deleting_status: { etat: true, postId }, id: [socketId] })
	}

	private async answerPost(socketId: string, payload: { postId: string, content: string }) {

		const userId = await this.resolveUserId(socketId)
		if (!userId) return this.controleur.envoie(this, { post_answering_status: { etat: false, error: "not_authenticated" }, id: [socketId] })

		const { postId, content } = payload

		const post = await ChannelPost.model.findById(postId).lean()
		if (!post) return this.controleur.envoie(this, { post_answering_status: { etat: false, error: "post_not_found" }, id: [socketId] })

		if (post.authorId.toString() === userId) return this.controleur.envoie(this, { post_answering_status: { etat: false, error: "cannot_answer_own_post" }, id: [socketId] })

		const channelId = post.channelId.toString()
		const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
		if (!membership) return this.controleur.envoie(this, { post_answering_status: { etat: false, error: "not_a_member" }, id: [socketId] })

		const newResponse = new ChannelPostResponse({ postId: postId as any, content, authorId: userId as any })
		await newResponse.save()

		await ChannelPost.model.updateOne({ _id: postId }, { $inc: { responseCount: 1 } })

		const populatedResponse = await ChannelPostResponse.model.findById(newResponse.modelInstance._id)
			.populate("authorId", "firstname lastname email picture")
			.lean()

		const author = populatedResponse!.authorId as any
		const formattedResponse = {
			id: populatedResponse!._id!.toString(),
			postId: populatedResponse!.postId.toString(),
			content: populatedResponse!.content,
			authorId: author?._id?.toString() ?? populatedResponse!.authorId.toString(),
			authorFirstname: author?.firstname,
			authorLastname: author?.lastname,
			authorPicture: author?.picture,
			createdAt: populatedResponse!.createdAt,
			updatedAt: populatedResponse!.updatedAt,
		}

		const broadcastSocketIds = await this.getConnectedChannelMemberSocketIds(channelId)

		this.controleur.envoie(this, { post_answering_status: { etat: true, postId, response: formattedResponse }, id: broadcastSocketIds.length > 0 ? broadcastSocketIds : [socketId] })
	}
}
