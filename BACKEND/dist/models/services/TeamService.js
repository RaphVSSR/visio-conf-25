import { getMessagesByDomain } from "../ListeMessages.js";
import SessionManager from "./authentication/SessionManager.js";
import Team from "../Team.js";
import TeamMember from "../TeamMember.js";
import Channel from "../Channel.js";
import ChannelMember from "../ChannelMember.js";
import ChannelPost from "../ChannelPost.js";
import ChannelPostResponse from "../ChannelPostResponse.js";
export default class TeamService {
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
        this.registerHandler("team_get", this.handleTeamQuery);
        this.registerHandler("team_action", this.handleTeamAction);
        this.registerHandler("team_member", this.handleTeamMember);
        this.controleur.inscription(this, getMessagesByDomain("team").received, [...this.handlers.keys()]);
    }
    resolveUserId(socketId) {
        return SessionManager.getUserId(socketId);
    }
    handleTeamQuery = (socketId, payload) => {
        const dispatchers = {
            list: () => this.getTeamsList(socketId),
            all: () => this.getAllTeams(socketId),
        };
        dispatchers[payload.type]?.();
    };
    handleTeamAction = (socketId, payload) => {
        const dispatchers = {
            create: () => this.createTeam(socketId, payload),
            update: () => this.updateTeam(socketId, payload),
            delete: () => this.deleteTeam(socketId, payload),
            leave: () => this.leaveTeam(socketId, payload),
        };
        dispatchers[payload.type]?.();
    };
    handleTeamMember = (socketId, payload) => {
        const dispatchers = {
            list: () => this.getTeamMembers(socketId, payload),
            add: () => this.addTeamMember(socketId, payload),
            remove: () => this.removeTeamMember(socketId, payload),
        };
        dispatchers[payload.type]?.();
    };
    getTeamsList = async (socketId) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "team_get_response", { type: "list", etat: false, error: "not_authenticated" });
        const memberships = await TeamMember.model.find({ id: userId }).lean();
        const teamIds = memberships.map(membership => membership.teamId);
        const teams = await Team.model.find({ _id: { $in: teamIds } }).lean();
        const formattedTeams = teams.map(team => {
            const membership = memberships.find(m => m.teamId.toString() === team._id.toString());
            return {
                id: team._id.toString(),
                name: team.name,
                description: team.description,
                picture: team.picture,
                createdBy: team.createdBy.toString(),
                createdAt: team.createdAt,
                updatedAt: team.updatedAt,
                role: membership?.role ?? "member",
            };
        });
        this.send(socketId, "team_get_response", { type: "list", etat: true, teams: formattedTeams });
    };
    getAllTeams = async (socketId) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "team_get_response", { type: "all", etat: false, error: "not_authenticated" });
        const teams = await Team.model.find({}).lean();
        const formattedTeams = teams.map(team => ({
            id: team._id.toString(),
            name: team.name,
            description: team.description,
            picture: team.picture,
            createdBy: team.createdBy.toString(),
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
        }));
        this.send(socketId, "team_get_response", { type: "all", etat: true, teams: formattedTeams });
    };
    createTeam = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "team_action_response", { type: "create", etat: false, error: "not_authenticated" });
        const { name, description, picture, members } = payload;
        const newTeam = new Team({ name, description, picture, createdBy: userId });
        await newTeam.save();
        const teamId = newTeam.modelInstance._id;
        const creatorMember = new TeamMember({ id: userId, role: "admin", teamId: teamId });
        await creatorMember.save();
        const memberDocIds = [creatorMember.modelInstance._id.toString()];
        if (members && members.length > 0) {
            for (const memberId of members) {
                if (memberId === userId)
                    continue;
                const teamMember = new TeamMember({ id: memberId, role: "member", teamId: teamId });
                await teamMember.save();
                memberDocIds.push(teamMember.modelInstance._id.toString());
            }
        }
        newTeam.modelInstance.members = memberDocIds;
        await newTeam.modelInstance.save();
        const formattedTeam = {
            id: teamId.toString(),
            name: newTeam.modelInstance.name,
            description: newTeam.modelInstance.description,
            picture: newTeam.modelInstance.picture,
            createdBy: newTeam.modelInstance.createdBy.toString(),
            createdAt: newTeam.modelInstance.createdAt,
            updatedAt: newTeam.modelInstance.updatedAt,
            role: "admin",
        };
        this.send(socketId, "team_action_response", { type: "create", etat: true, team: formattedTeam });
    };
    updateTeam = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "team_action_response", { type: "update", etat: false, error: "not_authenticated" });
        const { id: teamId, name, description, picture } = payload;
        const team = await Team.model.findById(teamId);
        if (!team)
            return this.send(socketId, "team_action_response", { type: "update", etat: false, error: "team_not_found" });
        const adminMembership = await TeamMember.model.findOne({ teamId, id: userId, role: "admin" }).lean();
        if (!adminMembership)
            return this.send(socketId, "team_action_response", { type: "update", etat: false, error: "admin_required" });
        if (name !== undefined)
            team.name = name;
        if (description !== undefined)
            team.description = description;
        if (picture !== undefined)
            team.picture = picture;
        team.updatedAt = new Date();
        await team.save();
        const formattedTeam = {
            id: team._id.toString(),
            name: team.name,
            description: team.description,
            picture: team.picture,
            createdBy: team.createdBy.toString(),
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
            role: "admin",
        };
        this.send(socketId, "team_action_response", { type: "update", etat: true, team: formattedTeam });
    };
    deleteTeam = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "team_action_response", { type: "delete", etat: false, error: "not_authenticated" });
        const { teamId } = payload;
        const team = await Team.model.findById(teamId);
        if (!team)
            return this.send(socketId, "team_action_response", { type: "delete", etat: false, error: "team_not_found" });
        const adminMembership = await TeamMember.model.findOne({ teamId, id: userId, role: "admin" }).lean();
        if (!adminMembership)
            return this.send(socketId, "team_action_response", { type: "delete", etat: false, error: "admin_required" });
        const channels = await Channel.model.find({ teamId }).lean();
        for (const channel of channels) {
            const channelId = channel._id.toString();
            const posts = await ChannelPost.model.find({ channelId }).lean();
            const postIds = posts.map((post) => post._id);
            await ChannelPostResponse.model.deleteMany({ postId: { $in: postIds } });
            await ChannelPost.model.deleteMany({ channelId });
            await ChannelMember.model.deleteMany({ channelId });
        }
        await Channel.model.deleteMany({ teamId });
        await TeamMember.model.deleteMany({ teamId });
        await Team.model.deleteOne({ _id: teamId });
        this.send(socketId, "team_action_response", { type: "delete", etat: true, teamId });
    };
    leaveTeam = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "team_action_response", { type: "leave", etat: false, error: "not_authenticated" });
        const { teamId } = payload;
        const membership = await TeamMember.model.findOne({ teamId, id: userId }).lean();
        if (!membership)
            return this.send(socketId, "team_action_response", { type: "leave", etat: false, error: "not_a_member" });
        if (membership.role === "admin") {
            const adminCount = await TeamMember.model.countDocuments({ teamId, role: "admin" });
            if (adminCount <= 1)
                return this.send(socketId, "team_action_response", { type: "leave", etat: false, error: "last_admin_cannot_leave" });
        }
        await TeamMember.model.deleteOne({ _id: membership._id });
        await Team.model.updateOne({ _id: teamId }, { $pull: { members: membership._id } });
        this.send(socketId, "team_action_response", { type: "leave", etat: true, teamId });
    };
    getTeamMembers = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "team_member_response", { type: "list", etat: false, error: "not_authenticated" });
        const { teamId } = payload;
        const team = await Team.model.findById(teamId).lean();
        if (!team)
            return this.send(socketId, "team_member_response", { type: "list", etat: false, error: "team_not_found" });
        const members = await TeamMember.model.find({ teamId })
            .populate("id", "firstname lastname email picture")
            .lean();
        const formattedMembers = members.map((member) => {
            const user = member.id;
            return {
                id: member._id.toString(),
                userId: user?._id?.toString() ?? member.id.toString(),
                firstname: user?.firstname,
                lastname: user?.lastname,
                picture: user?.picture,
                role: member.role,
                joinedAt: member.joinedAt,
            };
        });
        this.send(socketId, "team_member_response", { type: "list", etat: true, members: formattedMembers });
    };
    addTeamMember = async (socketId, payload) => {
        const requesterId = this.resolveUserId(socketId);
        if (!requesterId)
            return this.send(socketId, "team_member_response", { type: "add", etat: false, error: "not_authenticated" });
        const { teamId, userId: targetUserId } = payload;
        const adminMembership = await TeamMember.model.findOne({ teamId, id: requesterId, role: "admin" }).lean();
        if (!adminMembership)
            return this.send(socketId, "team_member_response", { type: "add", etat: false, error: "admin_required" });
        const existingMember = await TeamMember.model.findOne({ teamId, id: targetUserId }).lean();
        if (existingMember)
            return this.send(socketId, "team_member_response", { type: "add", etat: false, error: "already_a_member" });
        const teamMember = new TeamMember({ id: targetUserId, role: "member", teamId: teamId });
        await teamMember.save();
        await Team.model.updateOne({ _id: teamId }, { $push: { members: teamMember.modelInstance._id } });
        this.send(socketId, "team_member_response", { type: "add", etat: true, teamId, userId: targetUserId });
    };
    removeTeamMember = async (socketId, payload) => {
        const requesterId = this.resolveUserId(socketId);
        if (!requesterId)
            return this.send(socketId, "team_member_response", { type: "remove", etat: false, error: "not_authenticated" });
        const { teamId, userId: targetUserId } = payload;
        const adminMembership = await TeamMember.model.findOne({ teamId, id: requesterId, role: "admin" }).lean();
        if (!adminMembership)
            return this.send(socketId, "team_member_response", { type: "remove", etat: false, error: "admin_required" });
        const targetMembership = await TeamMember.model.findOne({ teamId, id: targetUserId }).lean();
        if (!targetMembership)
            return this.send(socketId, "team_member_response", { type: "remove", etat: false, error: "not_a_member" });
        if (targetMembership.role === "admin")
            return this.send(socketId, "team_member_response", { type: "remove", etat: false, error: "cannot_remove_admin" });
        await TeamMember.model.deleteOne({ _id: targetMembership._id });
        await Team.model.updateOne({ _id: teamId }, { $pull: { members: targetMembership._id } });
        this.send(socketId, "team_member_response", { type: "remove", etat: true, teamId, userId: targetUserId });
    };
}
//# sourceMappingURL=TeamService.js.map