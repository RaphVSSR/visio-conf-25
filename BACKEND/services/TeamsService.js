import Team from "../models/team.js"
import TeamMember from "../models/teamMember.js"
import User from "../models/user.js"
import Channel from "../models/channel.js"
import ChannelMember from "../models/channelMember.js"
import SocketIdentificationService from "./SocketIdentification.js"

class TeamsService {
    controleur
    verbose = false
    listeDesMessagesEmis = [
        "teams_list_response",
        "team_create_response",
        "team_update_response",
        "team_delete_response",
        "team_leave_response",
        "team_members_response",
        "team_add_member_response",
        "team_remove_member_response",
        "all_teams_response",
    ]
    listeDesMessagesRecus = [
        "teams_list_request",
        "team_create_request",
        "team_update_request",
        "team_delete_request",
        "team_leave_request",
        "team_members_request",
        "team_add_member_request",
        "team_remove_member_request",
        "all_teams_request",
    ]

    constructor(c, nom) {
        this.controleur = c
        this.nomDInstance = nom
        if (this.controleur.verboseall || this.verbose)
            console.log(
                "INFO (" +
                    this.nomDInstance +
                    "): s'enregistre auprès du contrôleur"
            )

        this.controleur.inscription(
            this,
            this.listeDesMessagesEmis,
            this.listeDesMessagesRecus
        )
    }

    async traitementMessage(mesg) {
        if (this.controleur.verboseall || this.verbose) {
            console.log(
                "INFO (" +
                    this.nomDInstance +
                    "): reçoit le message suivant à traiter"
            )
            console.log(mesg)
        }

        if (mesg.teams_list_request) {
            await this.handleTeamsList(mesg)
        }

        if (mesg.team_create_request) {
            await this.handleTeamCreate(mesg)
        }

        if (mesg.team_update_request) {
            await this.handleTeamUpdate(mesg)
        }

        if (mesg.team_delete_request) {
            await this.handleTeamDelete(mesg)
        }

        if (mesg.team_leave_request) {
            await this.handleTeamLeave(mesg)
        }

        if (mesg.team_members_request) {
            await this.handleTeamMembers(mesg)
        }

        if (mesg.team_add_member_request) {
            await this.handleTeamAddMember(mesg)
        }
        if (mesg.team_remove_member_request) {
            await this.handleTeamRemoveMember(mesg)
        }

        if (mesg.all_teams_request) {
            await this.getAllTeams(mesg)
        }
    }

    async handleTeamsList(mesg) {
        try {
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Récupérer les équipes dont l'utilisateur est membre
            const teamMemberships = await TeamMember.find({
                userId: userInfo._id,
            })
            const teamIds = teamMemberships.map(
                (membership) => membership.teamId
            )

            // Récupérer les détails des équipes
            const teams = await Team.find({ _id: { $in: teamIds } })

            const message = {
                teams_list_response: {
                    etat: true,
                    teams: teams.map((team) => ({
                        id: team._id,
                        name: team.name,
                        description: team.description,
                        picture: team.picture,
                        createdAt: team.createdAt,
                        updatedAt: team.updatedAt,
                        createdBy: team.createdBy,
                        role:
                            teamMemberships.find(
                                (m) =>
                                    m.teamId.toString() === team._id.toString()
                            )?.role || "member",
                    })),
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                teams_list_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }
    async handleTeamCreate(mesg) {
        try {
            const { name, description, members, picture } =
                mesg.team_create_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            } // Create new team
            const team = new Team({
                name,
                description,
                picture,
                createdBy: userInfo._id,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await team.save()

            // Add creator as admin member
            const creatorMember = new TeamMember({
                teamId: team._id,
                userId: userInfo._id,
                role: "admin",
                joinedAt: new Date(),
            })

            await creatorMember.save() // Ajouter les membres fournis (hors créateur déjà admin)
            if (Array.isArray(members) && members.length > 0) {
                // On convertit tout en string pour la comparaison
                const creatorIdStr = userInfo._id.toString()
                const filteredMembers = members.filter(
                    (userId) => userId.toString() !== creatorIdStr
                )

                for (const userId of filteredMembers) {
                    try {
                        // Find user to get ObjectId
                        let user = null

                        // Try to find by ObjectId first (if userId looks like ObjectId)
                        if (
                            userId &&
                            userId.length === 24 &&
                            /^[0-9a-fA-F]{24}$/.test(userId)
                        ) {
                            user = await User.findById(userId)
                        }

                        // If not found by ObjectId, try by UUID
                        if (!user) {
                            user = await User.findOne({ uuid: userId })
                        }

                        if (user) {
                            const member = new TeamMember({
                                teamId: team._id,
                                userId: user._id, // Use ObjectId for consistency
                                role: "member",
                                joinedAt: new Date(),
                            })
                            await member.save()
                        }
                    } catch (err) {
                        console.log("Error adding member", userId, err)
                    }
                }
            }

            // Create a default "General" channel for the team
            const generalChannel = new Channel({
                name: "Général",
                teamId: team._id,
                isPublic: true,
                createdBy: userInfo._id,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await generalChannel.save()

            // Add creator as admin member of the channel
            const channelMember = new ChannelMember({
                channelId: generalChannel._id,
                userId: userInfo._id,
                role: "admin",
                joinedAt: new Date(),
            })

            await channelMember.save() // Ajouter les membres fournis au channel général (hors créateur déjà admin)
            if (Array.isArray(members) && members.length > 0) {
                const creatorIdStr = userInfo._id.toString()
                const filteredMembers = members.filter(
                    (userId) => userId.toString() !== creatorIdStr
                )
                for (const userId of filteredMembers) {
                    try {
                        // Find user to get ObjectId
                        let user = null

                        // Try to find by ObjectId first (if userId looks like ObjectId)
                        if (
                            userId &&
                            userId.length === 24 &&
                            /^[0-9a-fA-F]{24}$/.test(userId)
                        ) {
                            user = await User.findById(userId)
                        }

                        // If not found by ObjectId, try by UUID
                        if (!user) {
                            user = await User.findOne({ uuid: userId })
                        }

                        if (user) {
                            const member = new ChannelMember({
                                channelId: generalChannel._id,
                                userId: user._id, // Use ObjectId for consistency
                                role: "member",
                                joinedAt: new Date(),
                            })
                            await member.save()
                        }
                    } catch (err) {
                        console.log(
                            "Error adding member to channel",
                            userId,
                            err
                        )
                    }
                }
            }
            const message = {
                team_create_response: {
                    etat: true,
                    team: {
                        id: team._id,
                        name: team.name,
                        description: team.description,
                        picture: team.picture,
                        createdAt: team.createdAt,
                        updatedAt: team.updatedAt,
                        createdBy: team.createdBy,
                        role: "admin",
                    },
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                team_create_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }
    async handleTeamUpdate(mesg) {
        try {
            const { id, name, description, picture } = mesg.team_update_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if user is admin of the team
            const memberCheck = await TeamMember.findOne({
                teamId: id,
                userId: userInfo._id,
                role: "admin",
            })

            if (!memberCheck) {
                throw new Error(
                    "Vous n'avez pas les droits pour modifier cette équipe"
                )
            }

            // Update team
            const updateData = {}
            if (name) updateData.name = name
            if (description !== undefined) updateData.description = description
            if (picture !== undefined) updateData.picture = picture
            updateData.updatedAt = new Date()

            const team = await Team.findByIdAndUpdate(id, updateData, {
                new: true,
            })

            if (!team) {
                throw new Error("Équipe non trouvée")
            }
            const message = {
                team_update_response: {
                    etat: true,
                    team: {
                        id: team._id,
                        name: team.name,
                        description: team.description,
                        picture: team.picture,
                        createdAt: team.createdAt,
                        updatedAt: team.updatedAt,
                        createdBy: team.createdBy,
                        role: "admin",
                    },
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                team_update_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleTeamDelete(mesg) {
        try {
            const { teamId } = mesg.team_delete_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if user is admin of the team
            const memberCheck = await TeamMember.findOne({
                teamId,
                userId: userInfo._id,
                role: "admin",
            })

            if (!memberCheck) {
                throw new Error(
                    "Vous n'avez pas les droits pour supprimer cette équipe"
                )
            }

            // Delete team
            await Team.findByIdAndDelete(teamId)

            // Delete all team members
            await TeamMember.deleteMany({ teamId })

            // Get all channels for this team
            const channels = await Channel.find({ teamId })
            const channelIds = channels.map((channel) => channel._id)

            // Delete all channel members
            await ChannelMember.deleteMany({ channelId: { $in: channelIds } })

            // Delete all channels
            await Channel.deleteMany({ teamId })

            const message = {
                team_delete_response: {
                    etat: true,
                    teamId,
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                team_delete_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleTeamLeave(mesg) {
        try {
            const { teamId } = mesg.team_leave_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if user is a member
            const member = await TeamMember.findOne({
                teamId,
                userId: userInfo._id,
            })

            if (!member) {
                throw new Error("Vous n'êtes pas membre de cette équipe")
            }

            // Check if user is the only admin
            if (member.role === "admin") {
                const adminCount = await TeamMember.countDocuments({
                    teamId,
                    role: "admin",
                })

                if (adminCount === 1) {
                    throw new Error(
                        "Vous ne pouvez pas quitter l'équipe car vous êtes le seul administrateur"
                    )
                }
            }

            // Remove user from team
            await TeamMember.findByIdAndDelete(member._id)

            // Remove user from all channels in the team
            const channels = await Channel.find({ teamId })
            const channelIds = channels.map((channel) => channel._id)

            await ChannelMember.deleteMany({
                channelId: { $in: channelIds },
                userId: userInfo._id,
            })

            const message = {
                team_leave_response: {
                    etat: true,
                    teamId,
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                team_leave_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleTeamMembers(mesg) {
        try {
            const { teamId } = mesg.team_members_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if team exists
            const team = await Team.findById(teamId)

            if (!team) {
                throw new Error("Équipe non trouvée")
            }

            // Check if user is a member
            const isMember = await TeamMember.findOne({
                teamId,
                userId: userInfo._id,
            })

            if (!isMember) {
                throw new Error("Vous n'avez pas accès à cette équipe")
            } // Get all members with user information
            const members = await TeamMember.find({ teamId }).populate(
                "userId",
                "firstname lastname picture uuid"
            )

            const formattedMembers = members.map((member) => ({
                id: member._id,
                teamId: member.teamId,
                userId: member.userId.uuid, // Use UUID instead of ObjectId
                firstname: member.userId.firstname,
                lastname: member.userId.lastname,
                picture: member.userId.picture,
                role: member.role,
                joinedAt: member.joinedAt,
            }))

            const message = {
                team_members_response: {
                    etat: true,
                    teamId,
                    members: formattedMembers,
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                team_members_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleTeamAddMember(mesg) {
        try {
            const { teamId, userId } = mesg.team_add_member_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if team exists
            const team = await Team.findById(teamId)

            if (!team) {
                throw new Error("Équipe non trouvée")
            }

            // Check if requester is admin of the team
            const isAdmin = await TeamMember.findOne({
                teamId,
                userId: userInfo._id,
                role: "admin",
            })

            if (!isAdmin) {
                throw new Error(
                    "Vous n'avez pas les droits pour ajouter des membres à cette équipe"
                )
            } // Check if user exists - handle both ObjectId and UUID
            let user = null

            // Try to find by ObjectId first (if userId looks like ObjectId)
            if (
                userId &&
                userId.length === 24 &&
                /^[0-9a-fA-F]{24}$/.test(userId)
            ) {
                user = await User.findById(userId)
            }

            // If not found by ObjectId, try by UUID
            if (!user) {
                user = await User.findOne({ uuid: userId })
            }

            if (!user) {
                throw new Error("Utilisateur non trouvé")
            } // Check if user is already a member
            const existingMember = await TeamMember.findOne({
                teamId,
                userId: user._id, // Use ObjectId for consistency
            })

            if (existingMember) {
                throw new Error("Cet utilisateur est déjà membre de l'équipe")
            }

            // Add user as member
            const member = new TeamMember({
                teamId,
                userId: user._id, // Use ObjectId for consistency
                role: "member",
                joinedAt: new Date(),
            })

            await member.save()

            // Add user to all public channels in the team
            const publicChannels = await Channel.find({
                teamId,
                isPublic: true,
            })

            for (const channel of publicChannels) {
                const channelMember = new ChannelMember({
                    channelId: channel._id,
                    userId: user._id, // Use ObjectId for consistency
                    role: "member",
                    joinedAt: new Date(),
                })

                await channelMember.save()
            }
            const message = {
                team_add_member_response: {
                    etat: true,
                    teamId,
                    member: {
                        id: member._id,
                        teamId: member.teamId,
                        userId: user.uuid, // Return UUID for frontend consistency
                        role: member.role,
                        joinedAt: member.joinedAt,
                    },
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                team_add_member_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleTeamRemoveMember(mesg) {
        try {
            const { teamId, userId } = mesg.team_remove_member_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if requester is admin of the team
            const isAdmin = await TeamMember.findOne({
                teamId,
                userId: userInfo._id,
                role: "admin",
            })

            if (!isAdmin) {
                throw new Error(
                    "Vous n'avez pas les droits pour retirer des membres de cette équipe"
                )
            } // Find the user first to get their ObjectId
            let user = null

            // Try to find by ObjectId first (if userId looks like ObjectId)
            if (
                userId &&
                userId.length === 24 &&
                /^[0-9a-fA-F]{24}$/.test(userId)
            ) {
                user = await User.findById(userId)
            }

            // If not found by ObjectId, try by UUID
            if (!user) {
                user = await User.findOne({ uuid: userId })
            }

            if (!user) {
                throw new Error("Utilisateur non trouvé")
            }

            // Check if user is a member using ObjectId
            const member = await TeamMember.findOne({
                teamId,
                userId: user._id, // Use ObjectId for consistency
            })

            if (!member) {
                throw new Error("Cet utilisateur n'est pas membre de l'équipe")
            }

            // Cannot remove another admin (compare using ObjectId)
            if (
                member.role === "admin" &&
                userInfo._id.toString() !== user._id.toString()
            ) {
                throw new Error(
                    "Vous ne pouvez pas retirer un autre administrateur"
                )
            }

            // Remove user from team
            await TeamMember.findByIdAndDelete(member._id) // Remove user from all channels in the team
            const channels = await Channel.find({ teamId })
            const channelIds = channels.map((channel) => channel._id)

            await ChannelMember.deleteMany({
                channelId: { $in: channelIds },
                userId: user._id, // Use ObjectId for consistency
            })

            const message = {
                team_remove_member_response: {
                    etat: true,
                    teamId,
                    userId: user.uuid, // Return UUID for frontend consistency
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                team_remove_member_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async getAllTeams(mesg) {
        try {
            const teams = await Team.aggregate([
                {
                    $lookup: {
                        from: "teammembers",
                        localField: "_id",
                        foreignField: "teamId",
                        as: "members",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        numberOfParticipants: { $size: "$members" },
                    },
                },
            ])

            const message = {
                all_teams_response: {
                    etat: true,
                    teams,
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                all_teams_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }
}

export default TeamsService
