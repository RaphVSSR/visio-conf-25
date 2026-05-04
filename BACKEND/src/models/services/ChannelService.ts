import { type Types } from "mongoose"
import { getMessagesByDomain } from "../ListeMessages.ts"
import SessionManager from "./authentication/SessionManager.ts"
import BroadcastTargets from "./BroadcastTargets.ts"
import Channel from "../Channel.ts"
import ChannelMember, { type ChannelMemberType } from "../ChannelMember.ts"
import ChannelPost, { type ChannelPostType } from "../ChannelPost.ts"
import ChannelPostResponse from "../ChannelPostResponse.ts"
import TeamMember from "../TeamMember.ts"

type MessageHandler = (socketId: string, payload: any) => void
type WithId<T> = T & { _id: Types.ObjectId }

export default class ChannelService {

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
		this.registerHandler("channel_get", this.handleChannelQuery)
		this.registerHandler("channel_action", this.handleChannelAction)
		this.registerHandler("channel_member", this.handleChannelMember)
		this.registerHandler("channel_post", this.handleChannelPost)

		this.controleur.inscription(this, getMessagesByDomain("channel").received, [...this.handlers.keys()])
	}

	private resolveUserId(socketId: string): string | null {
		return SessionManager.getUserId(socketId)
	}

	private handleChannelQuery = (socketId: string, payload: any) => {

		const dispatchers: Record<string, () => void> = {
			list: () => this.getChannels(socketId, payload),
			single: () => this.getChannel(socketId, payload),
		}

		dispatchers[payload.type]?.()
	}

	private handleChannelAction = (socketId: string, payload: any) => {

		const dispatchers: Record<string, () => void> = {
			create: () => this.createChannel(socketId, payload),
			update: () => this.updateChannel(socketId, payload),
			delete: () => this.deleteChannel(socketId, payload),
		}

		dispatchers[payload.type]?.()
	}

	private handleChannelMember = (socketId: string, payload: any) => {

		const dispatchers: Record<string, () => void> = {
			list: () => this.getChannelMembers(socketId, payload),
			add: () => this.addChannelMember(socketId, payload),
			remove: () => this.removeChannelMember(socketId, payload),
			leave: () => this.leaveChannel(socketId, payload),
		}

		dispatchers[payload.type]?.()
	}

	private handleChannelPost = (socketId: string, payload: any) => {

		const dispatchers: Record<string, () => void> = {
			list: () => this.getChannelPosts(socketId, payload),
			user: () => this.getUserPost(socketId, payload),
			publish: () => this.publishPost(socketId, payload),
			update: () => this.updatePost(socketId, payload),
			delete: () => this.deletePost(socketId, payload),
			answer: () => this.answerPost(socketId, payload),
		}

		dispatchers[payload.type]?.()
	}

	private getChannels = async (socketId: string, payload: { teamId: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_get_response", { type: "list", etat: false, error: "not_authenticated" })

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

		this.send(socketId, "channel_get_response", { type: "list", etat: true, channels: formattedChannels })
	}

	private getChannel = async (socketId: string, payload: { channelId: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_get_response", { type: "single", etat: false, error: "not_authenticated" })

		const { channelId } = payload

		const channel = await Channel.model.findById(channelId).lean()
		if (!channel) return this.send(socketId, "channel_get_response", { type: "single", etat: false, error: "channel_not_found" })

		if (!channel.isPublic) {
			const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
			if (!membership) return this.send(socketId, "channel_get_response", { type: "single", etat: false, error: "not_a_member" })
		}

		const formattedChannel = {
			id: channel._id!.toString(),
			name: channel.name,
			isPublic: channel.isPublic,
			createdBy: channel.createdBy.toString(),
			createdAt: channel.createdAt,
		}

		this.send(socketId, "channel_get_response", { type: "single", etat: true, channel: formattedChannel })
	}

	private createChannel = async (socketId: string, payload: { name: string, isPublic: boolean, teamId: string, members?: string[] }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_action_response", { type: "create", etat: false, error: "not_authenticated" })

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

		const broadcastSocketIds = isPublic
			? await BroadcastTargets.forTeam(teamId)
			: await BroadcastTargets.forChannel(channelId.toString())
		this.send(BroadcastTargets.pick(broadcastSocketIds, socketId), "channel_action_response", { type: "create", etat: true, channel: formattedChannel })
	}

	private updateChannel = async (socketId: string, payload: { channelId: string, name: string, isPublic: boolean, teamId: string, members?: string[] }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_action_response", { type: "update", etat: false, error: "not_authenticated" })

		const { channelId, name, isPublic, teamId, members } = payload

		const channel = await Channel.model.findById(channelId)
		if (!channel) return this.send(socketId, "channel_action_response", { type: "update", etat: false, error: "channel_not_found" })

		const adminMembership = await ChannelMember.model.findOne({ channelId, userId, role: "admin" }).lean()
		if (!adminMembership) return this.send(socketId, "channel_action_response", { type: "update", etat: false, error: "admin_required" })

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

		const broadcastSocketIds = isPublic
			? await BroadcastTargets.forTeam(teamId)
			: await BroadcastTargets.forChannel(channelId)
		this.send(BroadcastTargets.pick(broadcastSocketIds, socketId), "channel_action_response", { type: "update", etat: true, channel: formattedChannel })
	}

	private deleteChannel = async (socketId: string, payload: { channelId: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_action_response", { type: "delete", etat: false, error: "not_authenticated" })

		const { channelId } = payload

		const channel = await Channel.model.findById(channelId)
		if (!channel) return this.send(socketId, "channel_action_response", { type: "delete", etat: false, error: "channel_not_found" })

		const adminMembership = await ChannelMember.model.findOne({ channelId, userId, role: "admin" }).lean()
		if (!adminMembership) return this.send(socketId, "channel_action_response", { type: "delete", etat: false, error: "admin_required" })

		const broadcastSocketIds = channel.isPublic
			? await BroadcastTargets.forTeam(channel.teamId.toString())
			: await BroadcastTargets.forChannel(channelId)

		const posts = await ChannelPost.model.find({ channelId }).lean()
		const postIds = posts.map((post: WithId<ChannelPostType>) => post._id)
		await ChannelPostResponse.model.deleteMany({ postId: { $in: postIds } })
		await ChannelPost.model.deleteMany({ channelId })
		await ChannelMember.model.deleteMany({ channelId })
		await Channel.model.deleteOne({ _id: channelId })

		this.send(BroadcastTargets.pick(broadcastSocketIds, socketId), "channel_action_response", { type: "delete", etat: true, channelId })
	}

	private getChannelMembers = async (socketId: string, payload: { channelId: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_member_response", { type: "list", etat: false, error: "not_authenticated" })

		const { channelId } = payload

		const channel = await Channel.model.findById(channelId).lean()
		if (!channel) return this.send(socketId, "channel_member_response", { type: "list", etat: false, error: "channel_not_found" })

		if (!channel.isPublic) {
			const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
			if (!membership) return this.send(socketId, "channel_member_response", { type: "list", etat: false, error: "not_a_member" })
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

		this.send(socketId, "channel_member_response", { type: "list", etat: true, channelId, members: formattedMembers })
	}

	private addChannelMember = async (socketId: string, payload: { channelId: string, userId: string }) => {

		const requesterId = this.resolveUserId(socketId)
		if (!requesterId) return this.send(socketId, "channel_member_response", { type: "add", etat: false, error: "not_authenticated" })

		const { channelId, userId: targetUserId } = payload

		const adminMembership = await ChannelMember.model.findOne({ channelId, userId: requesterId, role: "admin" }).lean()
		if (!adminMembership) return this.send(socketId, "channel_member_response", { type: "add", etat: false, error: "admin_required" })

		const existingMember = await ChannelMember.model.findOne({ channelId, userId: targetUserId }).lean()
		if (existingMember) return this.send(socketId, "channel_member_response", { type: "add", etat: false, error: "already_a_member" })

		const channelMember = new ChannelMember({ channelId: channelId as any, userId: targetUserId as any, role: "member" })
		await channelMember.save()

		await Channel.model.updateOne({ _id: channelId }, { $push: { members: channelMember.modelInstance._id } })

		const broadcastSocketIds = await BroadcastTargets.forChannel(channelId)
		this.send(BroadcastTargets.pick(broadcastSocketIds, socketId), "channel_member_response", { type: "add", etat: true, channelId, userId: targetUserId })
	}

	private removeChannelMember = async (socketId: string, payload: { channelId: string, userId: string }) => {

		const requesterId = this.resolveUserId(socketId)
		if (!requesterId) return this.send(socketId, "channel_member_response", { type: "remove", etat: false, error: "not_authenticated" })

		const { channelId, userId: targetUserId } = payload

		const adminMembership = await ChannelMember.model.findOne({ channelId, userId: requesterId, role: "admin" }).lean()
		if (!adminMembership) return this.send(socketId, "channel_member_response", { type: "remove", etat: false, error: "admin_required" })

		const targetMembership = await ChannelMember.model.findOne({ channelId, userId: targetUserId }).lean()
		if (!targetMembership) return this.send(socketId, "channel_member_response", { type: "remove", etat: false, error: "not_a_member" })

		if (targetMembership.role === "admin") return this.send(socketId, "channel_member_response", { type: "remove", etat: false, error: "cannot_remove_admin" })

		const targetSocketIds = SessionManager.getUserSocketIds(targetUserId)

		await ChannelMember.model.deleteOne({ _id: targetMembership._id })
		await Channel.model.updateOne({ _id: channelId }, { $pull: { members: targetMembership._id } })

		const remainingSocketIds = await BroadcastTargets.forChannel(channelId)
		const broadcastSocketIds = [...remainingSocketIds, ...targetSocketIds]
		this.send(BroadcastTargets.pick(broadcastSocketIds, socketId), "channel_member_response", { type: "remove", etat: true, channelId, userId: targetUserId })
	}

	private leaveChannel = async (socketId: string, payload: { channelId: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_member_response", { type: "leave", etat: false, error: "not_authenticated" })

		const { channelId } = payload

		const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
		if (!membership) return this.send(socketId, "channel_member_response", { type: "leave", etat: false, error: "not_a_member" })

		if (membership.role === "admin") {
			const adminCount = await ChannelMember.model.countDocuments({ channelId, role: "admin" })
			if (adminCount <= 1) return this.send(socketId, "channel_member_response", { type: "leave", etat: false, error: "last_admin_cannot_leave" })
		}

		await ChannelMember.model.deleteOne({ _id: membership._id })
		await Channel.model.updateOne({ _id: channelId }, { $pull: { members: membership._id } })

		this.send(socketId, "channel_member_response", { type: "leave", etat: true, channelId })
	}

	private getChannelPosts = async (socketId: string, payload: { channelId: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_post_response", { type: "list", etat: false, error: "not_authenticated" })

		const { channelId } = payload

		const channel = await Channel.model.findById(channelId).lean()
		if (!channel) return this.send(socketId, "channel_post_response", { type: "list", etat: false, error: "channel_not_found" })

		if (!channel.isPublic) {
			const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
			if (!membership) return this.send(socketId, "channel_post_response", { type: "list", etat: false, error: "not_a_member" })
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

		this.send(socketId, "channel_post_response", { type: "list", etat: true, channelId, posts: formattedPosts })
	}

	private getUserPost = async (socketId: string, payload: { channelId: string, userId: string }) => {

		const requesterId = this.resolveUserId(socketId)
		if (!requesterId) return this.send(socketId, "channel_post_response", { type: "user", etat: false, error: "not_authenticated" })

		const { channelId, userId: targetUserId } = payload

		const channel = await Channel.model.findById(channelId).lean()
		if (!channel) return this.send(socketId, "channel_post_response", { type: "user", etat: false, error: "channel_not_found" })

		if (!channel.isPublic) {
			const membership = await ChannelMember.model.findOne({ channelId, userId: requesterId }).lean()
			if (!membership) return this.send(socketId, "channel_post_response", { type: "user", etat: false, error: "not_a_member" })
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

		this.send(socketId, "channel_post_response", { type: "user", etat: true, posts: formattedPosts })
	}

	private publishPost = async (socketId: string, payload: { channelId: string, content: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_post_response", { type: "publish", etat: false, error: "not_authenticated" })

		const { channelId, content } = payload

		const channel = await Channel.model.findById(channelId).lean()
		if (!channel) return this.send(socketId, "channel_post_response", { type: "publish", etat: false, error: "channel_not_found" })

		const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
		if (!membership) return this.send(socketId, "channel_post_response", { type: "publish", etat: false, error: "not_a_member" })

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

		const broadcastSocketIds = await BroadcastTargets.forChannel(channelId)

		this.send(BroadcastTargets.pick(broadcastSocketIds, socketId), "channel_post_response", { type: "publish", etat: true, post: formattedPost })
	}

	private updatePost = async (socketId: string, payload: { postId: string, content: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_post_response", { type: "update", etat: false, error: "not_authenticated" })

		const { postId, content } = payload

		const post = await ChannelPost.model.findById(postId)
		if (!post) return this.send(socketId, "channel_post_response", { type: "update", etat: false, error: "post_not_found" })

		if (post.authorId.toString() !== userId) return this.send(socketId, "channel_post_response", { type: "update", etat: false, error: "not_the_author" })

		post.content = content
		post.updatedAt = new Date()
		await post.save()

		const broadcastSocketIds = await BroadcastTargets.forChannel(post.channelId.toString())
		this.send(BroadcastTargets.pick(broadcastSocketIds, socketId), "channel_post_response", { type: "update", etat: true, postId, channelId: post.channelId.toString(), content, updatedAt: post.updatedAt })
	}

	private deletePost = async (socketId: string, payload: { postId: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_post_response", { type: "delete", etat: false, error: "not_authenticated" })

		const { postId } = payload

		const post = await ChannelPost.model.findById(postId)
		if (!post) return this.send(socketId, "channel_post_response", { type: "delete", etat: false, error: "post_not_found" })

		const isAuthor = post.authorId.toString() === userId
		const isAdmin = await ChannelMember.model.findOne({ channelId: post.channelId, userId, role: "admin" }).lean()

		if (!isAuthor && !isAdmin) return this.send(socketId, "channel_post_response", { type: "delete", etat: false, error: "not_authorized" })

		const channelId = post.channelId.toString()
		await ChannelPostResponse.model.deleteMany({ postId })
		await ChannelPost.model.deleteOne({ _id: postId })

		const broadcastSocketIds = await BroadcastTargets.forChannel(channelId)
		this.send(BroadcastTargets.pick(broadcastSocketIds, socketId), "channel_post_response", { type: "delete", etat: true, postId, channelId })
	}

	private answerPost = async (socketId: string, payload: { postId: string, content: string }) => {

		const userId = this.resolveUserId(socketId)
		if (!userId) return this.send(socketId, "channel_post_response", { type: "answer", etat: false, error: "not_authenticated" })

		const { postId, content } = payload

		const post = await ChannelPost.model.findById(postId).lean()
		if (!post) return this.send(socketId, "channel_post_response", { type: "answer", etat: false, error: "post_not_found" })

		if (post.authorId.toString() === userId) return this.send(socketId, "channel_post_response", { type: "answer", etat: false, error: "cannot_answer_own_post" })

		const channelId = post.channelId.toString()
		const membership = await ChannelMember.model.findOne({ channelId, userId }).lean()
		if (!membership) return this.send(socketId, "channel_post_response", { type: "answer", etat: false, error: "not_a_member" })

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

		const broadcastSocketIds = await BroadcastTargets.forChannel(channelId)

		this.send(BroadcastTargets.pick(broadcastSocketIds, socketId), "channel_post_response", { type: "answer", etat: true, postId, response: formattedResponse })
	}
}
