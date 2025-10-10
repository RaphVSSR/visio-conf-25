import mongoose from "mongoose"
import { v4 as uuidv4 } from "uuid"
import { sha256 } from "js-sha256"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import User from "./models/user.js"
import Role from "./models/role.js"
import Permission from "./models/permission.js"
import Discussion from "./models/discussion.js"
import Team from "./models/team.js"
import Channel from "./models/channel.js"
import ChannelPost from "./models/channelPost.js"
import ChannelPostResponse from "./models/channelPostResponse.js"
import File from "./models/file.js"
import TeamMember from "./models/teamMember.js"
import ChannelMember from "./models/channelMember.js"

dotenv.config()

// Configuration des chemins pour ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

// Fonction utilitaire pour copier les fichiers seed
const copySeedFile = async (seedFileName, targetPath) => {
    try {
        const seedFilePath = path.join(
            __dirname,
            "uploads",
            "seed-files",
            seedFileName
        )
        const targetDir = path.dirname(targetPath)

        // Créer le dossier de destination s'il n'existe pas
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
        }

        // Copier le fichier
        if (fs.existsSync(seedFilePath)) {
            fs.copyFileSync(seedFilePath, targetPath)
            console.log(`✓ Fichier copié: ${seedFileName} -> ${targetPath}`)
            return true
        } else {
            console.warn(`⚠️  Fichier seed non trouvé: ${seedFilePath}`)
            return false
        }
    } catch (error) {
        console.error(`❌ Erreur lors de la copie de ${seedFileName}:`, error)
        return false
    }
}

// Fonction pour obtenir la taille d'un fichier
const getFileSize = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath)
            return stats.size
        }
    } catch (error) {
        console.error(
            `Erreur lors de la lecture de la taille du fichier ${filePath}:`,
            error
        )
    }
    return 0
}

// Utilisateurs de test
const usersToInsert = [
    {
        uuid: uuidv4(),
        firstname: "John",
        lastname: "Doe",
        email: "john.doe@example.com",
        phone: "06.12.34.56.78",
        job: "Responsable RH",
        desc: "Chef de département MMI à l'université de Toulon. Également professeur de développement web.",
        status: "active",
        password:
            "f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
    },
    {
        uuid: uuidv4(),
        firstname: "Janny",
        lastname: "Doey",
        email: "janny.doey@example.com",
        phone: "06.23.45.67.89",
        job: "Professeur",
        desc: "Professeur de design graphique à l'université de Toulon.",
        status: "active",
        password:
            "f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
    },
    {
        uuid: uuidv4(),
        firstname: "Jean",
        lastname: "Deau",
        email: "jean.deau@example.com",
        phone: "06.34.56.78.90",
        job: "Responsable Technique",
        desc: "Responsable technique du département informatique. Expert en réseaux et systèmes.",
        status: "active",
        password:
            "f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
    },
    {
        uuid: uuidv4(),
        firstname: "Hélios",
        lastname: "Martin",
        email: "heliosmartin.hm@gmail.com",
        phone: "06.45.67.89.01",
        job: "Étudiant",
        desc: "Étudiant en Master 2 à l'université de Toulon. Développeur web full-stack.",
        password:
            "f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
        status: "active",
    },
    {
        uuid: uuidv4(),
        firstname: "Sophie",
        lastname: "Durand",
        email: "sophie.durand@example.com",
        phone: "06.56.78.90.12",
        job: "Professeur",
        desc: "Professeur de communication à l'université de Toulon.",
        password:
            "f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
        status: "active",
    },
    {
        uuid: uuidv4(),
        firstname: "Thomas",
        lastname: "Petit",
        email: "thomas.petit@example.com",
        phone: "06.67.89.01.23",
        job: "Étudiant",
        desc: "Étudiant en Licence 3 à l'université de Toulon. Spécialité développement mobile.",
        password:
            "f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
        status: "active",
    },
    {
        uuid: uuidv4(),
        firstname: "Marie",
        lastname: "Leroy",
        email: "marie.leroy@example.com",
        phone: "06.78.90.12.34",
        job: "Assistante Administrative",
        desc: "Assistante administrative du département MMI. Gestion des plannings et des inscriptions.",
        password:
            "f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
        status: "active",
    },
    {
        uuid: uuidv4(),
        firstname: "Lucas",
        lastname: "Moreau",
        email: "lucas.moreau@example.com",
        phone: "06.89.01.23.45",
        job: "Technicien",
        desc: "Technicien audiovisuel à l'université de Toulon. Responsable du matériel de tournage.",
        password:
            "f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17", // Mot de passe : 'mdp'
        status: "active",
    },
]

const initializeRoles = async () => {
    const permissionIds = await initializePermissions()
    const rolesToInsert = [
        {
            role_uuid: "admin",
            role_label: "Administrateur",
            role_permissions: Object.values(permissionIds),
            role_default: true,
        },
        {
            role_uuid: "user",
            role_label: "Utilisateur",
            role_permissions: Object.values(permissionIds),
            role_default: true,
        },
    ]
    await Role.deleteMany({})
    for (const roleData of rolesToInsert) {
        const roleExists = await Role.findOne({
            role_label: roleData.role_label,
        })
        if (!roleExists) {
            const newRole = new Role(roleData)
            await newRole.save()
            console.log(`Role '${roleData.role_label}' inséré`)
        } else {
            console.log(`Role '${roleData.role_label}' existe déjà`)
        }
    }
}

const initializePermissions = async () => {
    const permissions = [
        {
            permission_uuid: "naviguer_vers",
            permission_label: "Naviguer vers",
            permission_default: true,
        },
        {
            permission_uuid: "admin_demande_liste_utilisateurs",
            permission_label: "Lister les utilisateurs",
        },
        {
            permission_uuid: "admin_ajouter_utilisateur",
            permission_label: "Ajouter un utilisateur",
        },
        {
            permission_uuid: "admin_desactiver_utilisateur",
            permission_label: "Désactive un utilisateur",
        },
        {
            permission_uuid: "admin_demande_utilisateur_details",
            permission_label: "Détails de l'utilisateur",
        },
        {
            permission_uuid: "admin_supprimer_utilisateur",
            permission_label: "Supprimer un utilisateur",
        },
        {
            permission_uuid: "admin_modifier_utilisateur",
            permission_label: "Modifier un utilisateur",
        },
        {
            permission_uuid: "admin_demande_liste_roles",
            permission_label: "Lister les rôles",
        },
        {
            permission_uuid: "admin_modifier_role",
            permission_label: "Modifier un rôle",
        },
        {
            permission_uuid: "admin_supprimer_role",
            permission_label: "Supprimer un rôle",
        },
        {
            permission_uuid: "admin_demande_liste_permissions",
            permission_label: "Lister les permissions",
        },
        {
            permission_uuid: "admin_ajouter_permission",
            permission_label: "Créer les permissions",
        },
        {
            permission_uuid: "admin_modifier_permission",
            permission_label: "Modifier les permissions",
        },
        {
            permission_uuid: "admin_demande_liste_equipes",
            permission_label: "Lister les équipes",
        },
        {
            permission_uuid: "admin_ajouter_equipe",
            permission_label: "Créer les équipes",
        },
        {
            permission_uuid: "admin_modifier_equipe",
            permission_label: "Modifier les équipes",
        },
        {
            permission_uuid: "admin_supprimer_equipe",
            permission_label: "Supprimer les équipes",
        },
        {
            permission_uuid: "admin_ajouter_role",
            permission_label: "Ajouter un rôle",
        },
        {
            permission_uuid: "admin_dupliquer_role",
            permission_label: "Dupliquer un rôle",
        },
        {
            permission_uuid: "admin_demande_role_details",
            permission_label: "Détails du rôle",
        },
        {
            permission_uuid: "demande_liste_utilisateurs",
            permission_label: "Lister les utilisateurs",
        },
        { permission_uuid: "demande_annuaire", permission_label: "Annuaire" },
        {
            permission_uuid: "demande_info_utilisateur",
            permission_label: "Information sur un utilisateur",
        },
        {
            permission_uuid: "envoie_message",
            permission_label: "Envoyer un message",
        },
        {
            permission_uuid: "demande_liste_discussions",
            permission_label: "Lister les discussions",
        },
        {
            permission_uuid: "demande_historique_discussion",
            permission_label: "Historique des discussions",
        },
        {
            permission_uuid: "demande_notifications",
            permission_label: "Notifications",
        },
        {
            permission_uuid: "demande_changement_status",
            permission_label: "Changement de status",
        },
        {
            permission_uuid: "update_notifications",
            permission_label: "Mise à jour des notifications",
        },
        {
            permission_uuid: "update_profil",
            permission_label: "Mise à jour du profil",
        },
        {
            permission_uuid: "update_picture",
            permission_label: "Mise à jour de la photo de profil",
        },
        {
            permission_uuid: "demande_creation_discussion",
            permission_label: "Création d'une discussion",
        },
        {
            permission_uuid: "demande_discussion_info",
            permission_label: "Information sur une discussion",
        },
        {
            permission_uuid: "new_call",
            permission_label: "Nouvel appel",
            permission_default: true,
        },
        {
            permission_uuid: "send_ice_candidate",
            permission_label: "Envoi de candidat ICE",
            permission_default: true,
        },
        {
            permission_uuid: "send_offer",
            permission_label: "Envoi d'offre",
            permission_default: true,
        },
        {
            permission_uuid: "send_answer",
            permission_label: "Envoi de réponse",
            permission_default: true,
        },
        {
            permission_uuid: "reject_offer",
            permission_label: "Rejet d'offre",
            permission_default: true,
        },
        {
            permission_uuid: "hang_up",
            permission_label: "Raccrocher",
            permission_default: true,
        },
        {
            permission_uuid: "receive_offer",
            permission_label: "Réception d'offre",
            permission_default: true,
        },
        {
            permission_uuid: "receive_answer",
            permission_label: "Réception de réponse",
            permission_default: true,
        },
        {
            permission_uuid: "receive_ice_candidate",
            permission_label: "Réception de candidat ICE",
            permission_default: true,
        },
        {
            permission_uuid: "offer_rejected",
            permission_label: "Offre rejetée",
            permission_default: true,
        },
        {
            permission_uuid: "call_created",
            permission_label: "Appel créé",
            permission_default: true,
        },
        {
            permission_uuid: "hung_up",
            permission_label: "Raccroché",
            permission_default: true,
        },
        {
            permission_uuid: "call_connected_users",
            permission_label: "Utilisateurs connectés",
            permission_default: true,
        },
    ];
    await Permission.deleteMany({})
    const permissionIds = {}
    for (const permission of permissions) {
        const newPermission = new Permission(permission)
        await newPermission.save()
        permissionIds[permission.permission_uuid] = newPermission._id
        console.log(`Permission '${permission.permission_label}' insérée`)
    }
    return permissionIds
}

const initializeUsers = async () => {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.log(
            "Les identifiants de l'administrateur ne sont pas définis dans le .env"
        )
        return
    }
    const adminPasswordHash = sha256(ADMIN_PASSWORD)
    const adminRole = await Role.findOne({ role_uuid: "admin" })
    const userRole = await Role.findOne({ role_uuid: "user" })

    if (adminRole && userRole) {
        // Ajout de l'administrateur
        usersToInsert.push({
            uuid: uuidv4(),
            firstname: "Admin",
            lastname: "Admin",
            email: ADMIN_EMAIL,
            phone: "06.00.00.00.00",
            job: "Administrateur Système",
            desc: "Administrateur principal de la plateforme VisioConf.",
            password: adminPasswordHash,
            status: "active",
            roles: [adminRole._id, userRole._id],
        })

        // Attribution des rôles aux utilisateurs
        for (const user of usersToInsert) {
            if (!user.roles || user.roles.length === 0) {
                user.roles = [userRole._id]
            }
        }
    } else {
        console.error("Un ou plusieurs rôles n'ont pas été trouvés")
        return
    }

    await User.deleteMany({})
    const insertedUsers = []
    for (const userData of usersToInsert) {
        const userExists = await User.findOne({
            email: userData.email,
        })

        if (!userExists) {
            const newUser = new User(userData)
            await newUser.save()
            insertedUsers.push(newUser)
            console.log(`Utilisateur ${userData.email} inséré`)
        } else {
            console.log(`Utilisateur ${userData.email} existe déjà`)
        }
    }
    return insertedUsers
}

const initializeDiscussions = async (users) => {
    if (!users || users.length < 2) {
        console.error("Pas assez d'utilisateurs pour créer des discussions")
        return
    }

    const discussionsToInsert = [
        {
            discussion_uuid: uuidv4(),
            discussion_creator: users[0]._id,
            discussion_members: [users[0]._id, users[1]._id],
            discussion_name: "Discussion John et Janny",
            discussion_messages: [
                {
                    message_uuid: uuidv4(),
                    message_content: "Salut Janny, comment vas-tu ?",
                    message_sender: users[0]._id,
                    message_date_create: new Date(),
                },
                {
                    message_uuid: uuidv4(),
                    message_content: "Très bien John, merci !",
                    message_sender: users[1]._id,
                    message_date_create: new Date(),
                },
            ],
        },
        {
            discussion_uuid: uuidv4(),
            discussion_creator: users[2]._id,
            discussion_members: [users[2]._id, users[3]._id],
            discussion_name: "Discussion Jean et Hélios",
            discussion_messages: [
                {
                    message_uuid: uuidv4(),
                    message_content: "Hélios, tu as avancé sur le projet ?",
                    message_sender: users[2]._id,
                    message_date_create: new Date(),
                },
                {
                    message_uuid: uuidv4(),
                    message_content: "Oui Jean, je t'envoie ça ce soir.",
                    message_sender: users[3]._id,
                    message_date_create: new Date(),
                },
            ],
        },
        {
            discussion_uuid: uuidv4(),
            discussion_creator: users[0]._id,
            discussion_members: [users[0]._id, users[2]._id, users[4]._id],
            discussion_name: "Équipe pédagogique",
            discussion_isGroup: true,
            discussion_messages: [
                {
                    message_uuid: uuidv4(),
                    message_content: "Réunion demain à 10h.",
                    message_sender: users[0]._id,
                    message_date_create: new Date(),
                },
            ],
        },
        {
            discussion_uuid: uuidv4(),
            discussion_creator: users[3]._id,
            discussion_members: [users[3]._id, users[5]._id, users[7]._id],
            discussion_name: "Projet étudiant",
            discussion_isGroup: true,
            discussion_messages: [
                {
                    message_uuid: uuidv4(),
                    message_content: "On commence le projet aujourd'hui !",
                    message_sender: users[3]._id,
                    message_date_create: new Date(),
                },
            ],
        },
        {
            discussion_uuid: uuidv4(),
            discussion_creator: users[4]._id,
            discussion_members: [users[4]._id, users[6]._id],
            discussion_name: "Discussion Sophie et Marie",
            discussion_messages: [
                {
                    message_uuid: uuidv4(),
                    message_content: "Marie, peux-tu m'envoyer le planning ?",
                    message_sender: users[4]._id,
                    message_date_create: new Date(),
                },
            ],
        },
    ]

    await Discussion.deleteMany({})
    const insertedDiscussions = []
    for (const discussionData of discussionsToInsert) {
        const newDiscussion = new Discussion(discussionData)
        await newDiscussion.save()
        insertedDiscussions.push(newDiscussion)
        console.log(`Discussion ${discussionData.discussion_name} insérée`)
    }
    return insertedDiscussions
}

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

const initializeFiles = async (users) => {
    if (!users) {
        console.error("Utilisateurs manquants")
        return
    }

    await File.deleteMany({})

    // Création de dossiers et fichiers pour chaque utilisateur
    for (const user of users) {
        // Dossiers racine
        const rootFolders = [
            {
                id: uuidv4(),
                name: "Documents",
                type: "folder",
                ownerId: user.uuid,
                parentId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: "Images",
                type: "folder",
                ownerId: user.uuid,
                parentId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: "Projets",
                type: "folder",
                ownerId: user.uuid,
                parentId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]

        // Insertion des dossiers racine
        for (const folder of rootFolders) {
            const newFolder = new File(folder)
            await newFolder.save()
            console.log(
                `Dossier ${folder.name} créé pour ${user.firstname} ${user.lastname}`
            )

            // Sous-dossiers et fichiers
            if (folder.name === "Documents") {
                // Sous-dossier Cours
                const coursFolder = new File({
                    id: uuidv4(),
                    name: "Cours",
                    type: "folder",
                    ownerId: user.uuid,
                    parentId: folder.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                await coursFolder.save() // Fichiers dans Cours
                const coursFiles = [
                    {
                        id: uuidv4(),
                        name: "cours_web.txt",
                        type: "file",
                        size: 0, // Sera calculé dynamiquement
                        mimeType: "text/plain",
                        extension: "txt",
                        ownerId: user.uuid,
                        parentId: coursFolder.id,
                        path: `files/${user.uuid}/${uuidv4()}/cours_web.txt`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: uuidv4(),
                        name: "notes_cours.txt",
                        type: "file",
                        size: 0, // Sera calculé dynamiquement
                        mimeType: "text/plain",
                        extension: "txt",
                        ownerId: user.uuid,
                        parentId: coursFolder.id,
                        path: `files/${user.uuid}/${uuidv4()}/notes_cours.txt`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ]

                for (const file of coursFiles) {
                    // Construire le chemin complet du fichier
                    const fullPath = path.join(__dirname, "uploads", file.path)

                    // Copier le fichier seed correspondant
                    const seedFileName = file.name
                    const copySuccess = await copySeedFile(
                        seedFileName,
                        fullPath
                    )

                    if (copySuccess) {
                        // Mettre à jour la taille du fichier avec la vraie taille
                        file.size = getFileSize(fullPath)
                    }

                    const newFile = new File(file)
                    await newFile.save()
                } // Fichiers dans Documents
                const docFiles = [
                    {
                        id: uuidv4(),
                        name: "rapport_annuel.txt",
                        type: "file",
                        size: 0, // Sera calculé dynamiquement
                        mimeType: "text/plain",
                        extension: "txt",
                        ownerId: user.uuid,
                        parentId: folder.id,
                        path: `files/${
                            user.uuid
                        }/${uuidv4()}/rapport_annuel.txt`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: uuidv4(),
                        name: "documentation_technique.txt",
                        type: "file",
                        size: 0, // Sera calculé dynamiquement
                        mimeType: "text/plain",
                        extension: "txt",
                        ownerId: user.uuid,
                        parentId: folder.id,
                        path: `files/${
                            user.uuid
                        }/${uuidv4()}/documentation_technique.txt`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: uuidv4(),
                        name: "guide_utilisateur.txt",
                        type: "file",
                        size: 0, // Sera calculé dynamiquement
                        mimeType: "text/plain",
                        extension: "txt",
                        ownerId: user.uuid,
                        parentId: folder.id,
                        path: `files/${
                            user.uuid
                        }/${uuidv4()}/guide_utilisateur.txt`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ]

                for (const file of docFiles) {
                    // Construire le chemin complet du fichier
                    const fullPath = path.join(__dirname, "uploads", file.path)

                    // Copier le fichier seed correspondant
                    const seedFileName = file.name
                    const copySuccess = await copySeedFile(
                        seedFileName,
                        fullPath
                    )

                    if (copySuccess) {
                        // Mettre à jour la taille du fichier avec la vraie taille
                        file.size = getFileSize(fullPath)
                    }

                    const newFile = new File(file)
                    await newFile.save()
                }
            } else if (folder.name === "Images") {
                // Fichiers dans Images
                const imageFiles = [
                    {
                        id: uuidv4(),
                        name: "default_profile_picture.png",
                        type: "file",
                        size: 0, // Sera calculé dynamiquement
                        mimeType: "image/png",
                        extension: "png",
                        ownerId: user.uuid,
                        parentId: folder.id,
                        path: `files/${
                            user.uuid
                        }/${uuidv4()}/default_profile_picture.png`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: uuidv4(),
                        name: "Logo_Univ.png",
                        type: "file",
                        size: 0, // Sera calculé dynamiquement
                        mimeType: "image/png",
                        extension: "png",
                        ownerId: user.uuid,
                        parentId: folder.id,
                        path: `files/${user.uuid}/${uuidv4()}/Logo_Univ.png`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ]

                for (const file of imageFiles) {
                    // Construire le chemin complet du fichier
                    const fullPath = path.join(__dirname, "uploads", file.path)

                    // Copier le fichier seed correspondant
                    const seedFileName = file.name
                    const copySuccess = await copySeedFile(
                        seedFileName,
                        fullPath
                    )

                    if (copySuccess) {
                        // Mettre à jour la taille du fichier avec la vraie taille
                        file.size = getFileSize(fullPath)
                    }

                    const newFile = new File(file)
                    await newFile.save()
                }
            } else if (folder.name === "Projets") {
                // Sous-dossier Projet Web
                const projetWebFolder = new File({
                    id: uuidv4(),
                    name: "Projet Web",
                    type: "folder",
                    ownerId: user.uuid,
                    parentId: folder.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                await projetWebFolder.save() // Fichiers dans Projet Web
                const projetWebFiles = [
                    {
                        id: uuidv4(),
                        name: "index.html",
                        type: "file",
                        size: 0, // Sera calculé dynamiquement
                        mimeType: "text/html",
                        extension: "html",
                        ownerId: user.uuid,
                        parentId: projetWebFolder.id,
                        path: `files/${user.uuid}/${uuidv4()}/index.html`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: uuidv4(),
                        name: "style.css",
                        type: "file",
                        size: 0, // Sera calculé dynamiquement
                        mimeType: "text/css",
                        extension: "css",
                        ownerId: user.uuid,
                        parentId: projetWebFolder.id,
                        path: `files/${user.uuid}/${uuidv4()}/style.css`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: uuidv4(),
                        name: "script.js",
                        type: "file",
                        size: 0, // Sera calculé dynamiquement
                        mimeType: "application/javascript",
                        extension: "js",
                        ownerId: user.uuid,
                        parentId: projetWebFolder.id,
                        path: `files/${user.uuid}/${uuidv4()}/script.js`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ]

                for (const file of projetWebFiles) {
                    // Construire le chemin complet du fichier
                    const fullPath = path.join(__dirname, "uploads", file.path)

                    // Copier le fichier seed correspondant
                    const seedFileName = file.name
                    const copySuccess = await copySeedFile(
                        seedFileName,
                        fullPath
                    )

                    if (copySuccess) {
                        // Mettre à jour la taille du fichier avec la vraie taille
                        file.size = getFileSize(fullPath)
                    }
                    const newFile = new File(file)
                    await newFile.save()
                }
            }
        }
    }
    console.log("Fichiers et dossiers créés pour tous les utilisateurs")
}

// Fonction principale d'initialisation
const initDb = async () => {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) {
        throw new Error(
            "MONGO_URI n'est pas défini dans les variables d'environnement"
        )
    }

    try {
        await mongoose.connect(mongoUri, {
            user: process.env.MONGO_USER,
            pass: process.env.MONGO_PASSWORD,
        })

        console.log("Connecté à MongoDB")

        // Initialisation des collections
        await User.init()
        await Role.init()
        await Permission.init()
        await Discussion.init()
        await Team.init()
        await Channel.init()
        await ChannelPost.init()
        await ChannelPostResponse.init()
        await File.init()
        await TeamMember.init()
        await ChannelMember.init()

        // Création des données
        await initializeRoles()
        const users = await initializeUsers()
        const discussions = await initializeDiscussions(users)

        // Initialisation des équipes et canaux avec les nouvelles fonctions
        const teams = await initializeTeams(users)
        await initializeTeamMembers(teams)
        const channels = await initializeChannels(teams, users)
        await initializeChannelMembers(channels)
        await initializeChannelPosts(channels, users)

        await initializeFiles(users)

        console.log("Initialisation de la base de données terminée avec succès")
        await mongoose.connection.close()
        console.log("Connexion à MongoDB fermée")

        return { success: true }
    } catch (err) {
        console.error(
            "Erreur lors de l'initialisation de la base de données:",
            err
        )
        return { success: false, error: err.message }
    }
}

initDb()
    .then((result) => {
        if (result.success) {
            console.log("Initialisation terminée avec succès")
            process.exit(0)
        } else {
            console.error("Échec de l'initialisation:", result.error)
            process.exit(1)
        }
    })
    .catch((err) => {
        console.error("Erreur non gérée:", err)
        process.exit(1)
    })

export default initDb
