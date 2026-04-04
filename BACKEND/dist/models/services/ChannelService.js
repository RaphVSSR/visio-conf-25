import { getMessagesByDomain } from "../ListeMessages.js";
import SessionManager from "./authentication/SessionManager.js";
import Channel from "../Channel.js";
import ChannelMember from "../ChannelMember.js";
import ChannelPost from "../ChannelPost.js";
import ChannelPostResponse from "../ChannelPostResponse.js";
import TeamMember from "../TeamMember.js";
export default class ChannelService {
    controleur;
    nomDInstance;
    handlers = new Map();
    constructor(controleur, name) {
        this.controleur = controleur;
        this.nomDInstance = name;
    }
    registerHandler(messageName, handler) {
        this.handlers.set(messageName, handler);
    }
    send(socketIds, messageName, payload) {
        const ids = Array.isArray(socketIds) ? socketIds : [socketIds];
        this.controleur.envoie(this, { [messageName]: payload, id: ids });
    }
    traitementMessage(msg) {
        const action = Object.keys(msg).find(prop => prop !== "id");
        if (!action)
            return;
        const handler = this.handlers.get(action);
        if (handler)
            handler(msg.id, msg[action]);
    }
    register() {
        this.registerHandler("channel_get", this.handleChannelQuery);
        this.registerHandler("channel_action", this.handleChannelAction);
        this.registerHandler("channel_member", this.handleChannelMember);
        this.registerHandler("channel_post", this.handleChannelPost);
        this.controleur.inscription(this, getMessagesByDomain("channel").received, [...this.handlers.keys()]);
    }
    resolveUserId(socketId) {
        return SessionManager.getUserId(socketId);
    }
    async getConnectedChannelMemberSocketIds(channelId) {
        const members = await ChannelMember.model.find({ channelId }).lean();
        const socketIds = [];
        for (const member of members) {
            socketIds.push(...SessionManager.getUserSocketIds(member.userId.toString()));
        }
        return socketIds;
    }
    async getConnectedTeamMemberSocketIds(teamId) {
        const members = await TeamMember.model.find({ teamId }).lean();
        const socketIds = [];
        for (const member of members) {
            socketIds.push(...SessionManager.getUserSocketIds(member.id.toString()));
        }
        return socketIds;
    }
    handleChannelQuery = (socketId, payload) => {
        const dispatchers = {
            list: () => this.getChannels(socketId, payload),
            single: () => this.getChannel(socketId, payload),
        };
        dispatchers[payload.type]?.();
    };
    handleChannelAction = (socketId, payload) => {
        const dispatchers = {
            create: () => this.createChannel(socketId, payload),
            update: () => this.updateChannel(socketId, payload),
            delete: () => this.deleteChannel(socketId, payload),
        };
        dispatchers[payload.type]?.();
    };
    handleChannelMember = (socketId, payload) => {
        const dispatchers = {
            list: () => this.getChannelMembers(socketId, payload),
            add: () => this.addChannelMember(socketId, payload),
            remove: () => this.removeChannelMember(socketId, payload),
            leave: () => this.leaveChannel(socketId, payload),
        };
        dispatchers[payload.type]?.();
    };
    handleChannelPost = (socketId, payload) => {
        const dispatchers = {
            list: () => this.getChannelPosts(socketId, payload),
            user: () => this.getUserPost(socketId, payload),
            publish: () => this.publishPost(socketId, payload),
            update: () => this.updatePost(socketId, payload),
            delete: () => this.deletePost(socketId, payload),
            answer: () => this.answerPost(socketId, payload),
        };
        dispatchers[payload.type]?.();
    };
    getChannels = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_get_response", { type: "list", etat: false, error: "not_authenticated" });
        const { teamId } = payload;
        const channels = await Channel.model.find({ teamId }).lean();
        const visibleChannels = [];
        for (const channel of channels) {
            if (channel.isPublic) {
                visibleChannels.push(channel);
            }
            else {
                const membership = await ChannelMember.model.findOne({ channelId: channel._id, userId }).lean();
                if (membership)
                    visibleChannels.push(channel);
            }
        }
        const formattedChannels = visibleChannels.map(channel => ({
            id: channel._id.toString(),
            name: channel.name,
            isPublic: channel.isPublic,
            createdBy: channel.createdBy.toString(),
            createdAt: channel.createdAt,
        }));
        this.send(socketId, "channel_get_response", { type: "list", etat: true, channels: formattedChannels });
    };
    getChannel = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_get_response", { type: "single", etat: false, error: "not_authenticated" });
        const { channelId } = payload;
        const channel = await Channel.model.findById(channelId).lean();
        if (!channel)
            return this.send(socketId, "channel_get_response", { type: "single", etat: false, error: "channel_not_found" });
        if (!channel.isPublic) {
            const membership = await ChannelMember.model.findOne({ channelId, userId }).lean();
            if (!membership)
                return this.send(socketId, "channel_get_response", { type: "single", etat: false, error: "not_a_member" });
        }
        const formattedChannel = {
            id: channel._id.toString(),
            name: channel.name,
            isPublic: channel.isPublic,
            createdBy: channel.createdBy.toString(),
            createdAt: channel.createdAt,
        };
        this.send(socketId, "channel_get_response", { type: "single", etat: true, channel: formattedChannel });
    };
    createChannel = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_action_response", { type: "create", etat: false, error: "not_authenticated" });
        const { name, isPublic, teamId, members } = payload;
        const newChannel = new Channel({ name, isPublic, teamId: teamId, createdBy: userId });
        await newChannel.save();
        const channelId = newChannel.modelInstance._id;
        const creatorMember = new ChannelMember({ channelId: channelId, userId: userId, role: "admin" });
        await creatorMember.save();
        const memberIds = [creatorMember.modelInstance._id.toString()];
        if (isPublic) {
            const teamMembers = await TeamMember.model.find({ teamId }).lean();
            for (const teamMember of teamMembers) {
                const teamMemberUserId = teamMember.id.toString();
                if (teamMemberUserId === userId)
                    continue;
                const channelMember = new ChannelMember({ channelId: channelId, userId: teamMemberUserId, role: "member" });
                await channelMember.save();
                memberIds.push(channelMember.modelInstance._id.toString());
            }
        }
        else if (members && members.length > 0) {
            for (const memberId of members) {
                if (memberId === userId)
                    continue;
                const channelMember = new ChannelMember({ channelId: channelId, userId: memberId, role: "member" });
                await channelMember.save();
                memberIds.push(channelMember.modelInstance._id.toString());
            }
        }
        newChannel.modelInstance.members = memberIds;
        await newChannel.modelInstance.save();
        const formattedChannel = {
            id: channelId.toString(),
            name: newChannel.modelInstance.name,
            isPublic: newChannel.modelInstance.isPublic,
            createdBy: newChannel.modelInstance.createdBy.toString(),
            createdAt: newChannel.modelInstance.createdAt,
        };
        const teamSocketIds = await this.getConnectedTeamMemberSocketIds(teamId);
        this.send(teamSocketIds.length > 0 ? teamSocketIds : socketId, "channel_action_response", { type: "create", etat: true, channel: formattedChannel });
    };
    updateChannel = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_action_response", { type: "update", etat: false, error: "not_authenticated" });
        const { id: channelId, name, isPublic, teamId, members } = payload;
        const channel = await Channel.model.findById(channelId);
        if (!channel)
            return this.send(socketId, "channel_action_response", { type: "update", etat: false, error: "channel_not_found" });
        const adminMembership = await ChannelMember.model.findOne({ channelId, userId, role: "admin" }).lean();
        if (!adminMembership)
            return this.send(socketId, "channel_action_response", { type: "update", etat: false, error: "admin_required" });
        channel.name = name;
        channel.isPublic = isPublic;
        channel.updatedAt = new Date();
        if (isPublic) {
            const existingMembers = await ChannelMember.model.find({ channelId }).lean();
            const existingUserIds = new Set(existingMembers.map((member) => member.userId.toString()));
            const teamMembers = await TeamMember.model.find({ teamId }).lean();
            for (const teamMember of teamMembers) {
                const teamMemberUserId = teamMember.id.toString();
                if (existingUserIds.has(teamMemberUserId))
                    continue;
                const channelMember = new ChannelMember({ channelId: channelId, userId: teamMemberUserId, role: "member" });
                await channelMember.save();
            }
        }
        else if (members) {
            const existingMembers = await ChannelMember.model.find({ channelId }).lean();
            const desiredMemberSet = new Set(members);
            desiredMemberSet.add(userId);
            for (const existing of existingMembers) {
                const existingUserId = existing.userId.toString();
                if (!desiredMemberSet.has(existingUserId)) {
                    await ChannelMember.model.deleteOne({ _id: existing._id });
                }
            }
            const existingUserIds = new Set(existingMembers.map((member) => member.userId.toString()));
            for (const memberId of members) {
                if (existingUserIds.has(memberId))
                    continue;
                const channelMember = new ChannelMember({ channelId: channelId, userId: memberId, role: "member" });
                await channelMember.save();
            }
        }
        const allMembers = await ChannelMember.model.find({ channelId }).lean();
        channel.members = allMembers.map((member) => member._id);
        await channel.save();
        const formattedChannel = {
            id: channel._id.toString(),
            name: channel.name,
            isPublic: channel.isPublic,
            createdBy: channel.createdBy.toString(),
            createdAt: channel.createdAt,
        };
        const teamSocketIds = await this.getConnectedTeamMemberSocketIds(teamId);
        this.send(teamSocketIds.length > 0 ? teamSocketIds : socketId, "channel_action_response", { type: "update", etat: true, channel: formattedChannel });
    };
    deleteChannel = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_action_response", { type: "delete", etat: false, error: "not_authenticated" });
        const { channelId } = payload;
        const channel = await Channel.model.findById(channelId);
        if (!channel)
            return this.send(socketId, "channel_action_response", { type: "delete", etat: false, error: "channel_not_found" });
        const adminMembership = await ChannelMember.model.findOne({ channelId, userId, role: "admin" }).lean();
        if (!adminMembership)
            return this.send(socketId, "channel_action_response", { type: "delete", etat: false, error: "admin_required" });
        const teamSocketIds = await this.getConnectedTeamMemberSocketIds(channel.teamId.toString());
        const posts = await ChannelPost.model.find({ channelId }).lean();
        const postIds = posts.map((post) => post._id);
        await ChannelPostResponse.model.deleteMany({ postId: { $in: postIds } });
        await ChannelPost.model.deleteMany({ channelId });
        await ChannelMember.model.deleteMany({ channelId });
        await Channel.model.deleteOne({ _id: channelId });
        this.send(teamSocketIds.length > 0 ? teamSocketIds : socketId, "channel_action_response", { type: "delete", etat: true, channelId });
    };
    getChannelMembers = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_member_response", { type: "list", etat: false, error: "not_authenticated" });
        const { channelId } = payload;
        const channel = await Channel.model.findById(channelId).lean();
        if (!channel)
            return this.send(socketId, "channel_member_response", { type: "list", etat: false, error: "channel_not_found" });
        if (!channel.isPublic) {
            const membership = await ChannelMember.model.findOne({ channelId, userId }).lean();
            if (!membership)
                return this.send(socketId, "channel_member_response", { type: "list", etat: false, error: "not_a_member" });
        }
        const members = await ChannelMember.model.find({ channelId })
            .populate("userId", "firstname lastname email picture")
            .lean();
        const formattedMembers = members.map((member) => {
            const user = member.userId;
            return {
                id: member._id.toString(),
                userId: user?._id?.toString() ?? member.userId.toString(),
                firstname: user?.firstname,
                lastname: user?.lastname,
                picture: user?.picture,
                role: member.role,
                joinedAt: member.joinedAt,
            };
        });
        this.send(socketId, "channel_member_response", { type: "list", etat: true, members: formattedMembers });
    };
    addChannelMember = async (socketId, payload) => {
        const requesterId = this.resolveUserId(socketId);
        if (!requesterId)
            return this.send(socketId, "channel_member_response", { type: "add", etat: false, error: "not_authenticated" });
        const { channelId, userId: targetUserId } = payload;
        const adminMembership = await ChannelMember.model.findOne({ channelId, userId: requesterId, role: "admin" }).lean();
        if (!adminMembership)
            return this.send(socketId, "channel_member_response", { type: "add", etat: false, error: "admin_required" });
        const existingMember = await ChannelMember.model.findOne({ channelId, userId: targetUserId }).lean();
        if (existingMember)
            return this.send(socketId, "channel_member_response", { type: "add", etat: false, error: "already_a_member" });
        const channelMember = new ChannelMember({ channelId: channelId, userId: targetUserId, role: "member" });
        await channelMember.save();
        await Channel.model.updateOne({ _id: channelId }, { $push: { members: channelMember.modelInstance._id } });
        this.send(socketId, "channel_member_response", { type: "add", etat: true, channelId, userId: targetUserId });
    };
    removeChannelMember = async (socketId, payload) => {
        const requesterId = this.resolveUserId(socketId);
        if (!requesterId)
            return this.send(socketId, "channel_member_response", { type: "remove", etat: false, error: "not_authenticated" });
        const { channelId, userId: targetUserId } = payload;
        const adminMembership = await ChannelMember.model.findOne({ channelId, userId: requesterId, role: "admin" }).lean();
        if (!adminMembership)
            return this.send(socketId, "channel_member_response", { type: "remove", etat: false, error: "admin_required" });
        const targetMembership = await ChannelMember.model.findOne({ channelId, userId: targetUserId }).lean();
        if (!targetMembership)
            return this.send(socketId, "channel_member_response", { type: "remove", etat: false, error: "not_a_member" });
        if (targetMembership.role === "admin")
            return this.send(socketId, "channel_member_response", { type: "remove", etat: false, error: "cannot_remove_admin" });
        await ChannelMember.model.deleteOne({ _id: targetMembership._id });
        await Channel.model.updateOne({ _id: channelId }, { $pull: { members: targetMembership._id } });
        this.send(socketId, "channel_member_response", { type: "remove", etat: true, channelId, userId: targetUserId });
    };
    leaveChannel = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_member_response", { type: "leave", etat: false, error: "not_authenticated" });
        const { channelId } = payload;
        const membership = await ChannelMember.model.findOne({ channelId, userId }).lean();
        if (!membership)
            return this.send(socketId, "channel_member_response", { type: "leave", etat: false, error: "not_a_member" });
        if (membership.role === "admin") {
            const adminCount = await ChannelMember.model.countDocuments({ channelId, role: "admin" });
            if (adminCount <= 1)
                return this.send(socketId, "channel_member_response", { type: "leave", etat: false, error: "last_admin_cannot_leave" });
        }
        await ChannelMember.model.deleteOne({ _id: membership._id });
        await Channel.model.updateOne({ _id: channelId }, { $pull: { members: membership._id } });
        this.send(socketId, "channel_member_response", { type: "leave", etat: true, channelId });
    };
    getChannelPosts = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_post_response", { type: "list", etat: false, error: "not_authenticated" });
        const { channelId } = payload;
        const channel = await Channel.model.findById(channelId).lean();
        if (!channel)
            return this.send(socketId, "channel_post_response", { type: "list", etat: false, error: "channel_not_found" });
        if (!channel.isPublic) {
            const membership = await ChannelMember.model.findOne({ channelId, userId }).lean();
            if (!membership)
                return this.send(socketId, "channel_post_response", { type: "list", etat: false, error: "not_a_member" });
        }
        const posts = await ChannelPost.model.find({ channelId })
            .populate("authorId", "firstname lastname email picture")
            .sort({ createdAt: 1 })
            .lean();
        const formattedPosts = await Promise.all(posts.map(async (post) => {
            const responses = await ChannelPostResponse.model.find({ postId: post._id })
                .populate("authorId", "firstname lastname email picture")
                .sort({ createdAt: 1 })
                .lean();
            const author = post.authorId;
            return {
                id: post._id.toString(),
                channelId: post.channelId.toString(),
                content: post.content,
                authorId: author?._id?.toString() ?? post.authorId.toString(),
                authorFirstname: author?.firstname,
                authorLastname: author?.lastname,
                authorPicture: author?.picture,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                responseCount: responses.length,
                responses: responses.map((response) => {
                    const respAuthor = response.authorId;
                    return {
                        id: response._id.toString(),
                        postId: response.postId.toString(),
                        content: response.content,
                        authorId: respAuthor?._id?.toString() ?? response.authorId.toString(),
                        authorFirstname: respAuthor?.firstname,
                        authorLastname: respAuthor?.lastname,
                        authorPicture: respAuthor?.picture,
                        createdAt: response.createdAt,
                        updatedAt: response.updatedAt,
                    };
                }),
            };
        }));
        this.send(socketId, "channel_post_response", { type: "list", etat: true, posts: formattedPosts });
    };
    getUserPost = async (socketId, payload) => {
        const requesterId = this.resolveUserId(socketId);
        if (!requesterId)
            return this.send(socketId, "channel_post_response", { type: "user", etat: false, error: "not_authenticated" });
        const { channelId, userId: targetUserId } = payload;
        const channel = await Channel.model.findById(channelId).lean();
        if (!channel)
            return this.send(socketId, "channel_post_response", { type: "user", etat: false, error: "channel_not_found" });
        if (!channel.isPublic) {
            const membership = await ChannelMember.model.findOne({ channelId, userId: requesterId }).lean();
            if (!membership)
                return this.send(socketId, "channel_post_response", { type: "user", etat: false, error: "not_a_member" });
        }
        const posts = await ChannelPost.model.find({ channelId, authorId: targetUserId })
            .populate("authorId", "firstname lastname email picture")
            .sort({ createdAt: 1 })
            .lean();
        const formattedPosts = posts.map((post) => {
            const author = post.authorId;
            return {
                id: post._id.toString(),
                channelId: post.channelId.toString(),
                content: post.content,
                authorId: author?._id?.toString() ?? post.authorId.toString(),
                authorFirstname: author?.firstname,
                authorLastname: author?.lastname,
                authorPicture: author?.picture,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
            };
        });
        this.send(socketId, "channel_post_response", { type: "user", etat: true, posts: formattedPosts });
    };
    publishPost = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_post_response", { type: "publish", etat: false, error: "not_authenticated" });
        const { channelId, content } = payload;
        const channel = await Channel.model.findById(channelId).lean();
        if (!channel)
            return this.send(socketId, "channel_post_response", { type: "publish", etat: false, error: "channel_not_found" });
        const membership = await ChannelMember.model.findOne({ channelId, userId }).lean();
        if (!membership)
            return this.send(socketId, "channel_post_response", { type: "publish", etat: false, error: "not_a_member" });
        const newPost = new ChannelPost({ channelId: channelId, content, authorId: userId });
        await newPost.save();
        const populatedPost = await ChannelPost.model.findById(newPost.modelInstance._id)
            .populate("authorId", "firstname lastname email picture")
            .lean();
        const author = populatedPost.authorId;
        const formattedPost = {
            id: populatedPost._id.toString(),
            channelId: populatedPost.channelId.toString(),
            content: populatedPost.content,
            authorId: author?._id?.toString() ?? populatedPost.authorId.toString(),
            authorFirstname: author?.firstname,
            authorLastname: author?.lastname,
            authorPicture: author?.picture,
            createdAt: populatedPost.createdAt,
            updatedAt: populatedPost.updatedAt,
            responseCount: 0,
            responses: [],
        };
        const broadcastSocketIds = await this.getConnectedChannelMemberSocketIds(channelId);
        this.send(broadcastSocketIds.length > 0 ? broadcastSocketIds : socketId, "channel_post_response", { type: "publish", etat: true, post: formattedPost });
    };
    updatePost = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_post_response", { type: "update", etat: false, error: "not_authenticated" });
        const { postId, content } = payload;
        const post = await ChannelPost.model.findById(postId);
        if (!post)
            return this.send(socketId, "channel_post_response", { type: "update", etat: false, error: "post_not_found" });
        if (post.authorId.toString() !== userId)
            return this.send(socketId, "channel_post_response", { type: "update", etat: false, error: "not_the_author" });
        post.content = content;
        post.updatedAt = new Date();
        await post.save();
        this.send(socketId, "channel_post_response", { type: "update", etat: true, postId, content });
    };
    deletePost = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_post_response", { type: "delete", etat: false, error: "not_authenticated" });
        const { postId } = payload;
        const post = await ChannelPost.model.findById(postId);
        if (!post)
            return this.send(socketId, "channel_post_response", { type: "delete", etat: false, error: "post_not_found" });
        const isAuthor = post.authorId.toString() === userId;
        const isAdmin = await ChannelMember.model.findOne({ channelId: post.channelId, userId, role: "admin" }).lean();
        if (!isAuthor && !isAdmin)
            return this.send(socketId, "channel_post_response", { type: "delete", etat: false, error: "not_authorized" });
        await ChannelPostResponse.model.deleteMany({ postId });
        await ChannelPost.model.deleteOne({ _id: postId });
        this.send(socketId, "channel_post_response", { type: "delete", etat: true, postId });
    };
    answerPost = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "channel_post_response", { type: "answer", etat: false, error: "not_authenticated" });
        const { postId, content } = payload;
        const post = await ChannelPost.model.findById(postId).lean();
        if (!post)
            return this.send(socketId, "channel_post_response", { type: "answer", etat: false, error: "post_not_found" });
        if (post.authorId.toString() === userId)
            return this.send(socketId, "channel_post_response", { type: "answer", etat: false, error: "cannot_answer_own_post" });
        const channelId = post.channelId.toString();
        const membership = await ChannelMember.model.findOne({ channelId, userId }).lean();
        if (!membership)
            return this.send(socketId, "channel_post_response", { type: "answer", etat: false, error: "not_a_member" });
        const newResponse = new ChannelPostResponse({ postId: postId, content, authorId: userId });
        await newResponse.save();
        await ChannelPost.model.updateOne({ _id: postId }, { $inc: { responseCount: 1 } });
        const populatedResponse = await ChannelPostResponse.model.findById(newResponse.modelInstance._id)
            .populate("authorId", "firstname lastname email picture")
            .lean();
        const author = populatedResponse.authorId;
        const formattedResponse = {
            id: populatedResponse._id.toString(),
            postId: populatedResponse.postId.toString(),
            content: populatedResponse.content,
            authorId: author?._id?.toString() ?? populatedResponse.authorId.toString(),
            authorFirstname: author?.firstname,
            authorLastname: author?.lastname,
            authorPicture: author?.picture,
            createdAt: populatedResponse.createdAt,
            updatedAt: populatedResponse.updatedAt,
        };
        const broadcastSocketIds = await this.getConnectedChannelMemberSocketIds(channelId);
        this.send(broadcastSocketIds.length > 0 ? broadcastSocketIds : socketId, "channel_post_response", { type: "answer", etat: true, postId, response: formattedResponse });
    };
}
//# sourceMappingURL=ChannelService.js.map