import mongoose from "mongoose"
import { v4 as uuidv4 } from "uuid"
import dotenv from "dotenv"
import path from "path"
//import User from "./models/user.js"
//import Role from "./models/role.js"
//import Permission from "./models/permission.js"
//import Discussion from "./models/discussion.js"
//import Team from "./models/team.js"
//import Channel from "./models/channel.js"
//import ChannelPost from "./models/channelPost.js"
//import ChannelPostResponse from "./models/channelPostResponse.js"
//import File from "./models/file.js"
//import TeamMember from "./models/teamMember.js"
//import ChannelMember from "./models/channelMember.js"

// Nouvelle fonction pour initialiser les équipes
const initializeTeams = async (users) => {
    if (!users || users.length < 2) {
        console.error("Pas assez d'utilisateurs pour créer des équipes")
        return []
    }

    await Team.deleteMany({})

    // Définition des équipes à créer
    const teamsToCreate = [
        {
            name: "Département MMI",
            description:
                "Équipe des enseignants et personnels du département MMI",
            createdBy: users[0]._id,
            members: [
                { userId: users[0]._id, role: "admin", joinedAt: new Date() },
                { userId: users[1]._id, role: "member", joinedAt: new Date() },
                { userId: users[2]._id, role: "member", joinedAt: new Date() },
                { userId: users[4]._id, role: "member", joinedAt: new Date() },
                { userId: users[6]._id, role: "member", joinedAt: new Date() },
            ],
        },
        {
            name: "Projet Web Avancé",
            description: "Équipe de développement pour le projet web avancé",
            createdBy: users[2]._id,
            members: [
                { userId: users[2]._id, role: "admin", joinedAt: new Date() },
                { userId: users[3]._id, role: "member", joinedAt: new Date() },
                { userId: users[5]._id, role: "member", joinedAt: new Date() },
                { userId: users[7]._id, role: "member", joinedAt: new Date() },
            ],
        },
        {
            name: "Administration",
            description: "Équipe administrative de l'université",
            createdBy: users[6]._id,
            members: [
                { userId: users[6]._id, role: "admin", joinedAt: new Date() },
                { userId: users[0]._id, role: "member", joinedAt: new Date() },
                { userId: users[4]._id, role: "member", joinedAt: new Date() },
            ],
        },
    ]

    const insertedTeams = []

    // Création des équipes
    for (const teamData of teamsToCreate) {
        const team = new Team({
            name: teamData.name,
            description: teamData.description,
            createdBy: teamData.createdBy,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        await team.save()

        // Ajout des informations de membres pour l'utilisation ultérieure
        team.members = teamData.members.map((member) => ({
            ...member,
            teamId: team._id,
        }))

        insertedTeams.push(team)
        console.log(`Équipe "${teamData.name}" créée`)
    }

    return insertedTeams
}

// Fonction pour initialiser les membres d'équipe
const initializeTeamMembers = async (teams) => {
    if (!teams || teams.length === 0) {
        console.error("Aucune équipe disponible pour créer des membres")
        return
    }

    await TeamMember.deleteMany({})

    for (const team of teams) {
        if (team.members && team.members.length > 0) {
            for (const member of team.members) {
                const teamMember = new TeamMember({
                    teamId: team._id,
                    userId: member.userId,
                    role: member.role,
                    joinedAt: member.joinedAt || new Date(),
                })

                await teamMember.save()
            }
        }
    }

    console.log("Membres d'équipes insérés dans TeamMember")
}

// Nouvelle fonction pour initialiser les canaux
const initializeChannels = async (teams, users) => {
    if (!teams || teams.length === 0) {
        console.error("Aucune équipe disponible pour créer des canaux")
        return []
    }

    await Channel.deleteMany({})

    const insertedChannels = []

    // Pour chaque équipe, créer des canaux
    for (const team of teams) {
        // Canal général (toujours présent)
        const generalChannel = new Channel({
            name: "Général",
            teamId: team._id,
            isPublic: true,
            createdBy: team.createdBy,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        await generalChannel.save()

        // Ajouter tous les membres de l'équipe au canal général
        generalChannel.members = team.members.map((member) => ({
            userId: member.userId,
            role: member.role,
            channelId: generalChannel._id,
            joinedAt: new Date(),
        }))

        insertedChannels.push(generalChannel)

        // Canaux supplémentaires selon l'équipe
        const additionalChannels = []

        if (team.name === "Département MMI") {
            additionalChannels.push(
                {
                    name: "Réunions",
                    isPublic: true,
                    createdBy: team.createdBy,
                },
                {
                    name: "Événements",
                    isPublic: true,
                    createdBy: team.createdBy,
                },
                {
                    name: "Direction",
                    isPublic: false, // Canal privé
                    createdBy: team.createdBy,
                    // Seulement certains membres
                    members: team.members.filter((m) => m.role === "admin"),
                }
            )
        } else if (team.name === "Projet Web Avancé") {
            additionalChannels.push(
                {
                    name: "Frontend",
                    isPublic: true,
                    createdBy: team.createdBy,
                },
                {
                    name: "Backend",
                    isPublic: true,
                    createdBy: team.createdBy,
                },
                {
                    name: "Design",
                    isPublic: true,
                    createdBy: team.createdBy,
                }
            )
        } else if (team.name === "Administration") {
            additionalChannels.push(
                {
                    name: "Plannings",
                    isPublic: true,
                    createdBy: team.createdBy,
                },
                {
                    name: "Budget",
                    isPublic: false,
                    createdBy: team.createdBy,
                    members: team.members.filter((m) => m.role === "admin"),
                }
            )
        }

        // Créer les canaux supplémentaires
        for (const channelData of additionalChannels) {
            const channel = new Channel({
                name: channelData.name,
                teamId: team._id,
                isPublic: channelData.isPublic,
                createdBy: channelData.createdBy,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await channel.save()

            // Définir les membres du canal
            if (channelData.members) {
                channel.members = channelData.members.map((member) => ({
                    userId: member.userId,
                    role: member.role,
                    channelId: channel._id,
                    joinedAt: new Date(),
                }))
            } else if (channelData.isPublic) {
                // Si public, tous les membres de l'équipe sont membres du canal
                channel.members = team.members.map((member) => ({
                    userId: member.userId,
                    role: member.role,
                    channelId: channel._id,
                    joinedAt: new Date(),
                }))
            }

            insertedChannels.push(channel)
            console.log(
                `Canal "${channelData.name}" créé pour l'équipe "${team.name}"`
            )
        }
    }

    return insertedChannels
}

// Fonction pour initialiser les membres des canaux
const initializeChannelMembers = async (channels) => {
    if (!channels || channels.length === 0) {
        console.error("Aucun canal disponible pour créer des membres")
        return
    }

    await ChannelMember.deleteMany({})

    for (const channel of channels) {
        if (channel.members && channel.members.length > 0) {
            for (const member of channel.members) {
                const channelMember = new ChannelMember({
                    channelId: channel.channelId || channel._id,
                    userId: member.userId,
                    role: member.role,
                    joinedAt: member.joinedAt || new Date(),
                })

                await channelMember.save()
            }
        }
    }

    console.log("Membres de canaux insérés dans ChannelMember")
}

// Ajout de posts et réponses par défaut dans les channels
const initializeChannelPosts = async (channels, users) => {
    if (!channels || !users) {
        console.error("Canaux ou utilisateurs manquants")
        return
    }

    await ChannelPost.deleteMany({})
    await ChannelPostResponse.deleteMany({})

    const insertedPosts = []

    for (const channel of channels) {
        // On prend les membres du channel pour choisir les auteurs
        const channelMembers = channel.members || []
        const memberUserIds = channelMembers.map((m) => m.userId.toString())
        const eligibleUsers = users.filter((u) =>
            memberUserIds.includes(u._id.toString())
        )

        // Trouver le propriétaire du channel (createdBy)
        const owner = users.find(
            (u) => u._id.toString() === channel.createdBy.toString()
        )
        if (!owner) continue

        // Les autres membres (pour les réponses)
        const responders = eligibleUsers.filter(
            (u) => u._id.toString() !== owner._id.toString()
        )
        if (eligibleUsers.length === 0 || responders.length === 0) continue

        // 2 posts par channel, tous du propriétaire
        for (let i = 0; i < 2; i++) {
            const postData = {
                channelId: channel._id,
                content: `Message ${i + 1} dans le canal ${channel.name}`,
                authorId: owner._id,
                createdAt: new Date(Date.now() - (2 - i) * 86400000),
                updatedAt: new Date(Date.now() - (2 - i) * 86400000),
            }

            const newPost = new ChannelPost(postData)
            await newPost.save()
            insertedPosts.push(newPost)

            // 1 réponse par post, jamais du propriétaire
            const responder =
                responders[Math.floor(Math.random() * responders.length)]
            const responseData = {
                postId: newPost._id,
                content: `Réponse à "${postData.content}"`,
                authorId: responder._id,
                createdAt: new Date(postData.createdAt.getTime() + 3600000),
                updatedAt: new Date(postData.createdAt.getTime() + 3600000),
            }
            const newResponse = new ChannelPostResponse(responseData)
            await newResponse.save()
        }
        console.log(`2 posts créés dans le canal ${channel.name}`)
    }
}
