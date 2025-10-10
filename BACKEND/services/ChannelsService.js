import Channel from "../models/channel.js"
import ChannelMember from "../models/channelMember.js"
import ChannelPost from "../models/channelPost.js"
import ChannelPostResponse from "../models/channelPostResponse.js"
import User from "../models/user.js"
import SocketIdentificationService from "./SocketIdentification.js"
import TeamMember from "../models/teamMember.js" // Ajout de l'import TeamMember

class ChannelsService {
    controleur
    verbose = false
    listeDesMessagesEmis = [
        "channels_list_response",
        "channel_create_response",
        "channel_update_response",
        "channel_delete_response",
        "channel_leave_response",
        "channel_members_response",
        "channel_add_member_response",
        "channel_remove_member_response",
        "channel_posts_response",
        "channel_post_create_response",
        "channel_post_response_create_response",
    ]
    listeDesMessagesRecus = [
        "channels_list_request",
        "channel_create_request",
        "channel_update_request",
        "channel_delete_request",
        "channel_leave_request",
        "channel_members_request",
        "channel_add_member_request",
        "channel_remove_member_request",
        "channel_posts_request",
        "channel_post_create_request",
        "channel_post_response_create_request",
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

        if (mesg.channels_list_request) {
            await this.handleChannelsList(mesg)
        }

        if (mesg.channel_create_request) {
            await this.handleChannelCreate(mesg)
        }

        if (mesg.channel_update_request) {
            await this.handleChannelUpdate(mesg)
        }

        if (mesg.channel_delete_request) {
            await this.handleChannelDelete(mesg)
        }

        if (mesg.channel_leave_request) {
            await this.handleChannelLeave(mesg)
        }

        if (mesg.channel_members_request) {
            await this.handleChannelMembers(mesg)
        }

        if (mesg.channel_add_member_request) {
            await this.handleChannelAddMember(mesg)
        }

        if (mesg.channel_remove_member_request) {
            await this.handleChannelRemoveMember(mesg)
        }

        // Gestionnaires pour les posts et les réponses
        if (mesg.channel_posts_request) {
            await this.handleChannelPosts(mesg)
        }

        if (mesg.channel_post_create_request) {
            await this.handleChannelPostCreate(mesg)
        }

        if (mesg.channel_post_response_create_request) {
            await this.handleChannelPostResponseCreate(mesg)
        }
    }

    // Méthodes existantes...
    async handleChannelsList(mesg) {
        try {
            const { teamId } = mesg.channels_list_request || {}

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            const query = {}
            if (teamId) {
                query.teamId = teamId
            }

            // Get all channels that are either public or where the user is a member
            const publicChannels = await Channel.find({
                ...query,
                isPublic: true,
            })

            // Get channels where user is a member
            const memberChannelIds = await ChannelMember.find({
                userId: userInfo._id,
            }).distinct("channelId")

            const privateChannels = await Channel.find({
                ...query,
                isPublic: false,
                _id: { $in: memberChannelIds },
            })

            const channels = [...publicChannels, ...privateChannels]

            const message = {
                channels_list_response: {
                    etat: true,
                    channels: channels.map((channel) => {
                        const isMember = memberChannelIds.includes(
                            channel._id.toString()
                        )
                        return {
                            id: channel._id,
                            _id: channel._id,
                            name: channel.name,
                            teamId: channel.teamId,
                            isPublic: channel.isPublic,
                            createdAt: channel.createdAt,
                            updatedAt: channel.updatedAt,
                            createdBy: channel.createdBy,
                            isMember: isMember,
                        }
                    }),
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                channels_list_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleChannelCreate(mesg) {
        try {
            const { name, teamId, isPublic, members } =
                mesg.channel_create_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Create new channel
            const channel = new Channel({
                name,
                teamId,
                isPublic,
                createdBy: userInfo._id,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await channel.save()

            // Add creator as admin member
            const creatorMember = new ChannelMember({
                channelId: channel._id,
                userId: userInfo._id,
                role: "admin",
                joinedAt: new Date(),
            })

            await creatorMember.save()

            if (isPublic) {
                // Utiliser TeamMember pour récupérer les userIds de la team
                const teamMembers = await TeamMember.find({ teamId })
                const userIds = teamMembers
                    .map((tm) => tm.userId.toString())
                    .filter((id) => id !== userInfo._id.toString())

                const memberPromises = userIds.map((userId) => {
                    const member = new ChannelMember({
                        channelId: channel._id,
                        userId,
                        role: "member",
                        joinedAt: new Date(),
                    })
                    return member.save()
                })
                await Promise.all(memberPromises)
            } else if (!isPublic && members && members.length > 0) {
                const memberPromises = members.map((userId) => {
                    if (userId !== userInfo._id.toString()) {
                        const member = new ChannelMember({
                            channelId: channel._id,
                            userId,
                            role: "member",
                            joinedAt: new Date(),
                        })
                        return member.save()
                    }
                    return Promise.resolve()
                })

                await Promise.all(memberPromises)
            }

            const message = {
                channel_create_response: {
                    etat: true,
                    channel: {
                        id: channel._id,
                        _id: channel._id,
                        name: channel.name,
                        teamId: channel.teamId,
                        isPublic: channel.isPublic,
                        createdAt: channel.createdAt,
                        updatedAt: channel.updatedAt,
                        createdBy: channel.createdBy,
                    },
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                channel_create_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleChannelUpdate(mesg) {
        try {
            const { id, name, isPublic } = mesg.channel_update_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if user is admin of the channel
            const memberCheck = await ChannelMember.findOne({
                channelId: id,
                userId: userInfo._id,
                role: "admin",
            })

            if (!memberCheck) {
                throw new Error(
                    "Vous n'avez pas les droits pour modifier ce canal"
                )
            }

            // Update channel
            const updateData = {}
            if (name) updateData.name = name
            if (isPublic !== undefined) updateData.isPublic = isPublic
            updateData.updatedAt = new Date()

            const channel = await Channel.findByIdAndUpdate(id, updateData, {
                new: true,
            })

            if (!channel) {
                throw new Error("Canal non trouvé")
            }

            const message = {
                channel_update_response: {
                    etat: true,
                    channel: {
                        id: channel._id,
                        _id: channel._id,
                        name: channel.name,
                        teamId: channel.teamId,
                        isPublic: channel.isPublic,
                        createdAt: channel.createdAt,
                        updatedAt: channel.updatedAt,
                        createdBy: channel.createdBy,
                    },
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                channel_update_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleChannelDelete(mesg) {
        try {
            const { channelId } = mesg.channel_delete_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if user is admin of the channel
            const memberCheck = await ChannelMember.findOne({
                channelId,
                userId: userInfo._id,
                role: "admin",
            })

            if (!memberCheck) {
                throw new Error(
                    "Vous n'avez pas les droits pour supprimer ce canal"
                )
            }

            // Delete channel
            await Channel.findByIdAndDelete(channelId)

            // Delete all channel members
            await ChannelMember.deleteMany({ channelId })

            // Delete all channel posts and responses
            const posts = await ChannelPost.find({ channelId })
            const postIds = posts.map((post) => post._id)

            await ChannelPostResponse.deleteMany({ postId: { $in: postIds } })
            await ChannelPost.deleteMany({ channelId })

            const message = {
                channel_delete_response: {
                    etat: true,
                    channelId,
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                channel_delete_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleChannelLeave(mesg) {
        try {
            const { channelId } = mesg.channel_leave_request

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
            const member = await ChannelMember.findOne({
                channelId,
                userId: userInfo._id,
            })

            if (!member) {
                throw new Error("Vous n'êtes pas membre de ce canal")
            }

            // Check if user is the only admin
            if (member.role === "admin") {
                const adminCount = await ChannelMember.countDocuments({
                    channelId,
                    role: "admin",
                })

                if (adminCount === 1) {
                    throw new Error(
                        "Vous ne pouvez pas quitter le canal car vous êtes le seul administrateur"
                    )
                }
            }

            // Remove user from channel
            await ChannelMember.findByIdAndDelete(member._id)

            const message = {
                channel_leave_response: {
                    etat: true,
                    channelId,
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                channel_leave_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleChannelMembers(mesg) {
        try {
            const { channelId } = mesg.channel_members_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if channel exists
            const channel = await Channel.findById(channelId)

            if (!channel) {
                throw new Error("Canal non trouvé")
            }

            // If channel is private, check if user is a member
            if (!channel.isPublic) {
                const isMember = await ChannelMember.findOne({
                    channelId,
                    userId: userInfo._id,
                })

                if (!isMember) {
                    throw new Error("Vous n'avez pas accès à ce canal")
                }
            } // Get all members with user information
            const members = await ChannelMember.find({ channelId }).populate(
                "userId",
                "firstname lastname picture uuid"
            )

            const formattedMembers = members.map((member) => ({
                _id: member._id,
                id: member._id,
                channelId: member.channelId,
                userId: member.userId.uuid, // Use UUID instead of ObjectId
                firstname: member.userId.firstname,
                lastname: member.userId.lastname,
                picture: member.userId.picture,
                role: member.role,
                joinedAt: member.joinedAt,
            }))

            const message = {
                channel_members_response: {
                    etat: true,
                    channelId,
                    members: formattedMembers,
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                channel_members_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleChannelAddMember(mesg) {
        try {
            const { channelId, userId } = mesg.channel_add_member_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if channel exists
            const channel = await Channel.findById(channelId)

            if (!channel) {
                throw new Error("Canal non trouvé")
            }

            // Check if requester is admin of the channel
            const isAdmin = await ChannelMember.findOne({
                channelId,
                userId: userInfo._id,
                role: "admin",
            })

            if (!isAdmin && !channel.isPublic) {
                throw new Error(
                    "Vous n'avez pas les droits pour ajouter des membres à ce canal"
                )
            }

            // Check if user is already a member
            const existingMember = await ChannelMember.findOne({
                channelId,
                userId,
            })

            if (existingMember) {
                throw new Error("Cet utilisateur est déjà membre du canal")
            }

            // Add user as member
            const member = new ChannelMember({
                channelId,
                userId,
                role: "member",
                joinedAt: new Date(),
            })

            await member.save()

            const message = {
                channel_add_member_response: {
                    etat: true,
                    channelId,
                    member: {
                        id: member._id,
                        _id: member._id,
                        channelId: member.channelId,
                        userId: member.userId,
                        role: member.role,
                        joinedAt: member.joinedAt,
                    },
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                channel_add_member_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleChannelRemoveMember(mesg) {
        try {
            const { channelId, userId } = mesg.channel_remove_member_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if requester is admin of the channel
            const isAdmin = await ChannelMember.findOne({
                channelId,
                userId: userInfo._id,
                role: "admin",
            })

            if (!isAdmin) {
                throw new Error(
                    "Vous n'avez pas les droits pour retirer des membres de ce canal"
                )
            }

            // Check if user is a member
            const member = await ChannelMember.findOne({
                channelId,
                userId,
            })

            if (!member) {
                throw new Error("Cet utilisateur n'est pas membre du canal")
            }

            // Cannot remove another admin
            if (member.role === "admin" && userInfo._id.toString() !== userId) {
                throw new Error(
                    "Vous ne pouvez pas retirer un autre administrateur"
                )
            }

            // Remove user from channel
            await ChannelMember.findByIdAndDelete(member._id)

            const message = {
                channel_remove_member_response: {
                    etat: true,
                    channelId,
                    userId,
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                channel_remove_member_response: {
                    etat: false,
                    error: error.message,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    // Nouvelles méthodes pour gérer les posts et les réponses
    async handleChannelPosts(mesg) {
        try {
            const { channelId } = mesg.channel_posts_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if channel exists
            const channel = await Channel.findById(channelId)

            if (!channel) {
                throw new Error("Canal non trouvé")
            }

            // If channel is private, check if user is a member
            if (!channel.isPublic) {
                const isMember = await ChannelMember.findOne({
                    channelId,
                    userId: userInfo._id,
                })

                if (!isMember) {
                    throw new Error("Vous n'avez pas accès à ce canal")
                }
            }

            // Get all posts for the channel
            const posts = await ChannelPost.find({ channelId })
                .sort({
                    createdAt: -1,
                })
                .populate("authorId", "firstname lastname picture")

            // Get responses for each post
            const postsWithResponses = await Promise.all(
                posts.map(async (post) => {
                    const responses = await ChannelPostResponse.find({
                        postId: post._id,
                    })
                        .sort({ createdAt: 1 })
                        .populate("authorId", "firstname lastname picture")
                        .limit(5) // Limiter à 5 réponses par défaut

                    const formattedResponses = responses.map((response) => ({
                        _id: response._id,
                        id: response._id,
                        postId: response.postId,
                        content: response.content,
                        authorId: response.authorId._id,
                        authorName: `${response.authorId.firstname} ${response.authorId.lastname}`,
                        authorAvatar: response.authorId.picture,
                        createdAt: response.createdAt,
                        updatedAt: response.updatedAt,
                    }))

                    return {
                        _id: post._id,
                        id: post._id,
                        channelId: post.channelId,
                        content: post.content,
                        authorId: post.authorId,
                        authorName: `${post.authorId.firstname} ${post.authorId.lastname}`,
                        authorAvatar: post.authorId.picture,
                        createdAt: post.createdAt,
                        updatedAt: post.updatedAt,
                        responseCount: await ChannelPostResponse.countDocuments(
                            { postId: post._id }
                        ),
                        responses: formattedResponses,
                    }
                })
            )

            const message = {
                channel_posts_response: {
                    etat: true,
                    channelId,
                    posts: postsWithResponses,
                },
                id: [mesg.id],
            }

            this.controleur.envoie(this, message)
        } catch (error) {
            const message = {
                channel_posts_response: {
                    etat: false,
                    error: error.message,
                    channelId: mesg.channel_posts_request?.channelId,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleChannelPostCreate(mesg) {
        try {
            const { channelId, content } = mesg.channel_post_create_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if channel exists
            const channel = await Channel.findById(channelId)

            if (!channel) {
                throw new Error("Canal non trouvé")
            }

            // Check if user is a member of the channel
            const isMember = await ChannelMember.findOne({
                channelId,
                userId: userInfo._id,
            })

            if (!channel.isPublic && !isMember) {
                throw new Error("Vous n'avez pas accès à ce canal")
            }

            // Create new post
            const post = new ChannelPost({
                channelId,
                content,
                authorId: userInfo._id,
                createdAt: new Date(),
                updatedAt: new Date(),
                responseCount: 0,
            })

            await post.save()

            // Get author information
            const author = await User.findById(
                userInfo._id,
                "firstname lastname picture"
            )

            const newPost = {
                _id: post._id,
                id: post._id,
                channelId: post.channelId,
                content: post.content,
                authorId: post.authorId,
                authorName: `${author.firstname} ${author.lastname}`,
                authorAvatar: author.picture,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
                responseCount: 0,
                responses: [],
            }

            // Récupérer tous les membres du channel pour envoyer la réponse à tous les sockets concernés
            const channelMembers = await ChannelMember.find({ channelId })
            const userIds = channelMembers.map((m) => m.userId.toString())

            // Utiliser SocketIdentificationService pour obtenir les socket ids connectés
            const socketIdPromises = userIds.map(async (userId) => {
                const socketId =
                    SocketIdentificationService.getUserSocketId(userId)
                return socketId
            })
            const socketIds = (await Promise.all(socketIdPromises)).filter(
                Boolean
            )

            // Réponse à tous les membres connectés du channel
            const responseMessage = {
                channel_post_create_response: {
                    etat: true,
                    post: newPost,
                },
                id: socketIds,
            }
            this.controleur.envoie(this, responseMessage)
        } catch (error) {
            const message = {
                channel_post_create_response: {
                    etat: false,
                    error: error.message,
                    channelId: mesg.channel_post_create_request?.channelId,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }

    async handleChannelPostResponseCreate(mesg) {
        try {
            const { postId, content } =
                mesg.channel_post_response_create_request

            // Get user info from socket ID
            const socketId = mesg.id
            const userInfo =
                await SocketIdentificationService.getUserInfoBySocketId(
                    socketId
                )

            if (!userInfo) {
                throw new Error("Utilisateur non authentifié")
            }

            // Check if post exists
            const post = await ChannelPost.findById(postId)

            if (!post) {
                throw new Error("Message non trouvé")
            }

            // Check if channel exists
            const channel = await Channel.findById(post.channelId)

            if (!channel) {
                throw new Error("Canal non trouvé")
            }

            // Check if user is a member of the channel
            const isMember = await ChannelMember.findOne({
                channelId: post.channelId,
                userId: userInfo._id,
            })

            if (!channel.isPublic && !isMember) {
                throw new Error("Vous n'avez pas accès à ce canal")
            }

            // Create new response
            const response = new ChannelPostResponse({
                postId,
                content,
                authorId: userInfo._id,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await response.save()

            // Increment response count on the post
            await ChannelPost.findByIdAndUpdate(postId, {
                $inc: { responseCount: 1 },
            })

            // Get author information
            const author = await User.findById(
                userInfo._id,
                "firstname lastname picture"
            )

            const newResponse = {
                _id: response._id,
                id: response._id,
                postId: response.postId,
                content: response.content,
                authorId: response.authorId,
                authorName: `${author.firstname} ${author.lastname}`,
                authorAvatar: author.picture,
                createdAt: response.createdAt,
                updatedAt: response.updatedAt,
            }

            // Récupérer tous les membres du channel pour envoyer la réponse à tous les sockets concernés
            const channelMembers = await ChannelMember.find({
                channelId: post.channelId,
            })
            const userIds = channelMembers.map((m) => m.userId.toString())

            // Utiliser SocketIdentificationService pour obtenir les socket ids connectés
            const socketIdPromises = userIds.map(async (userId) => {
                const socketId =
                    await SocketIdentificationService.getUserSocketId(userId)
                return socketId
            })
            const socketIds = (await Promise.all(socketIdPromises)).filter(
                Boolean
            )

            // Réponse à tous les membres connectés du channel
            const responseMessage = {
                channel_post_response_create_response: {
                    etat: true,
                    postId,
                    response: newResponse,
                },
                id: socketIds,
            }
            this.controleur.envoie(this, responseMessage)
        } catch (error) {
            const message = {
                channel_post_response_create_response: {
                    etat: false,
                    error: error.message,
                    postId: mesg.channel_post_response_create_request?.postId,
                },
                id: [mesg.id],
            }
            this.controleur.envoie(this, message)
        }
    }
}

export default ChannelsService
