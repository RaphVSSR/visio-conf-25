import Discussion from "../models/discussion.js"
import User from "../models/user.js"
import { v4 as uuidv4 } from "uuid"
import SocketIdentificationService from "./SocketIdentification.js"

class MessagesService {
    controleur
    verbose = false
    listeDesMessagesEmis = [
        "messages_get_response",
        "message_send_response",
        "discuss_list_response",
        "users_search_response",
        "discuss_remove_member_response",
        "discuss_remove_message_response",
        "message_status_response",
    ]
    listeDesMessagesRecus = [
        "messages_get_request",
        "message_send_request",
        "discuss_list_request",
        "users_search_request",
        "discuss_remove_member_request",
        "discuss_remove_message_request",
        "message_status_request",
    ]

    constructor(c, nom) {
        this.controleur = c
        this.nomDInstance = nom
        if (this.controleur.verboseall || this.verbose)
            console.log(
                "INFO (" +
                    this.nomDInstance +
                    "):  s'enregistre aupres du controleur"
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
        // CAS : DEMANDE DE LA LISTE DES MESSAGES D'UNE DISCUSSION
        if (mesg.messages_get_request) {
            try {
                const { convId } = mesg.messages_get_request
                const discussions = await Discussion.find({
                    discussion_uuid: convId,
                }).populate({
                    path: "discussion_messages.message_sender",
                    model: "User",
                    select: "firstname lastname picture socket_id uuid",
                })

                const messages = discussions.flatMap(
                    (discussion) => discussion.discussion_messages
                )

                const message = {
                    messages_get_response: {
                        etat: true,
                        messages: messages,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    messages_get_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }

        if (mesg.message_send_request) {
            try {
                const {
                    userEmail,
                    otherUserEmail,
                    discussion_creator,
                    discussion_uuid,
                    message_content,
                    message_uuid,
                    message_date_create,
                } = mesg.message_send_request

                console.log("Message send request reçu:", {
                    userEmail,
                    otherUserEmail,
                    discussion_uuid,
                    message_content,
                })

                let members = []
                let socketIds = [] // Cas d'une nouvelle discussion
                if (otherUserEmail) {
                    const discussionEmails = [userEmail, ...otherUserEmail]
                    console.log(
                        "Recherche des utilisateurs avec les emails:",
                        discussionEmails
                    )

                    // Récupère tous les utilisateurs en une seule requête
                    const users = await User.find({
                        email: { $in: discussionEmails },
                    })
                    console.log(
                        "Résultat de la recherche d'utilisateurs:",
                        users
                    )

                    // Vérifier que la requête retourne bien quelque chose
                    if (!users || users.length === 0) {
                        // Essayons de trouver les utilisateurs un par un pour voir lesquels posent problème
                        console.log(
                            "Aucun utilisateur trouvé, recherche individuelle..."
                        )
                        for (const email of discussionEmails) {
                            const user = await User.findOne({ email })
                            console.log(`Recherche pour email ${email}:`, user)
                        }
                        throw new Error(
                            "Aucun utilisateur trouvé avec les emails fournis"
                        )
                    }

                    console.log("Utilisateurs trouvés:", users)
                    console.log("Emails de discussion:", discussionEmails)

                    // Vérifier que tous les utilisateurs ont été trouvés
                    if (users.length !== discussionEmails.length) {
                        throw new Error(
                            "Certains utilisateurs n'ont pas été trouvés"
                        )
                    }

                    // Trouver l'expéditeur
                    const sender = users.find((u) => u.email === userEmail)
                    if (!sender) {
                        throw new Error("L'expéditeur n'a pas été trouvé")
                    }
                    members = users.map((user) => user._id)

                    // NOUVELLE VÉRIFICATION : Empêcher les conversations privées en double
                    if (members.length === 2) {
                        // Pour les conversations privées (exactement 2 membres)
                        const existingDiscussion = await Discussion.findOne({
                            discussion_members: {
                                $all: members,
                                $size: 2,
                            },
                            discussion_type: { $ne: "group" },
                        })

                        if (existingDiscussion) {
                            console.log(
                                "Discussion privée existante trouvée:",
                                existingDiscussion.discussion_uuid
                            )

                            // Ajouter le message à la discussion existante au lieu de créer une nouvelle discussion
                            existingDiscussion.discussion_messages.push({
                                message_uuid: message_uuid,
                                message_sender: sender._id,
                                message_content: message_content,
                                message_date_create:
                                    message_date_create || new Date(),
                            })

                            await existingDiscussion.save()

                            // Utiliser l'ID de la discussion existante pour la réponse
                            members = existingDiscussion.discussion_members

                            // Utiliser SocketIdentificationService pour obtenir les socket ids
                            const socketIdPromises = members.map(
                                async (userId) => {
                                    return SocketIdentificationService.getUserSocketId(
                                        userId.toString()
                                    )
                                }
                            )
                            socketIds = (
                                await Promise.all(socketIdPromises)
                            ).filter(Boolean)

                            // Envoyer la réponse avec l'UUID de la discussion existante
                            const message = {
                                message_send_response: {
                                    etat: true,
                                    discussion_uuid:
                                        existingDiscussion.discussion_uuid, // UUID de la discussion existante
                                    message:
                                        "Message ajouté à la discussion existante",
                                },
                                id: socketIds,
                            }
                            this.controleur.envoie(this, message)
                            return // Sortir de la fonction car on a utilisé une discussion existante
                        }
                    }

                    // Utiliser SocketIdentificationService pour obtenir les socket ids
                    const socketIdPromises = members.map(async (userId) => {
                        return SocketIdentificationService.getUserSocketId(
                            userId.toString()
                        )
                    })
                    socketIds = (await Promise.all(socketIdPromises)).filter(
                        Boolean
                    )

                    // Créer une nouvelle discussion seulement si aucune discussion privée n'existe
                    const newDiscussion = {
                        discussion_uuid: discussion_uuid,
                        discussion_creator: sender._id, // Utiliser l'ID au lieu de l'email
                        discussion_type:
                            members.length === 2 ? "unique" : "group", // Définir le type de discussion
                        discussion_members: members,
                        discussion_messages: [
                            {
                                message_uuid: message_uuid,
                                message_sender: sender._id,
                                message_content: message_content,
                                message_date_create:
                                    message_date_create || new Date(),
                            },
                        ],
                    }

                    await Discussion.create(newDiscussion)
                }
                // Cas d'un message dans une discussion existante
                else {
                    const discussion = await Discussion.findOne({
                        discussion_uuid,
                    }).populate({
                        path: "discussion_members",
                        model: "User",
                        select: "_id email socket_id",
                    })

                    if (!discussion) {
                        throw new Error("Discussion non trouvée")
                    }

                    const user = await User.findOne({ email: userEmail })
                    if (!user) {
                        throw new Error("Utilisateur non trouvé")
                    }

                    const isMember = discussion.discussion_members.some(
                        (member) =>
                            member._id.toString() === user._id.toString()
                    )

                    if (!isMember) {
                        throw new Error(
                            "Utilisateur non autorisé à envoyer des messages dans cette discussion"
                        )
                    }

                    discussion.discussion_messages.push({
                        message_uuid,
                        message_sender: user._id,
                        message_content,
                        message_date_create: message_date_create || new Date(),
                    })

                    await discussion.save()

                    members = discussion.discussion_members.map(
                        (member) => member._id
                    )

                    // Utiliser SocketIdentificationService pour obtenir les socket ids
                    const socketIdPromises = members.map(async (userId) => {
                        return await SocketIdentificationService.getUserSocketId(
                            userId.toString()
                        )
                    })
                    socketIds = (await Promise.all(socketIdPromises)).filter(
                        Boolean
                    )
                }

                const message = {
                    message_send_response: {
                        etat: true,
                    },
                    id: socketIds, // Liste des socket_id des utilisateurs de la discussion
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                console.error("Erreur lors de l'envoi du message:", error)
                const message = {
                    message_send_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }
        if (mesg.discuss_list_request) {
            try {
                const userId = mesg.discuss_list_request

                // D'abord, trouver l'utilisateur pour obtenir son ObjectId
                let user = null

                // Essayer d'abord avec ObjectId (si c'est un ObjectId MongoDB)
                if (
                    userId &&
                    userId.length === 24 &&
                    /^[0-9a-fA-F]{24}$/.test(userId)
                ) {
                    user = await User.findById(userId)
                }

                // Si pas trouvé, essayer avec UUID
                if (!user) {
                    user = await User.findOne({ uuid: userId })
                }

                if (!user) {
                    throw new Error(
                        `Utilisateur non trouvé avec l'ID: ${userId}`
                    )
                }

                // Maintenant utiliser l'ObjectId pour chercher les discussions
                const discussions = await Discussion.find({
                    discussion_members: user._id,
                }).populate({
                    path: "discussion_members",
                    model: "User",
                    select: "_id uuid firstname lastname picture is_online",
                })

                const formattedDiscussions = discussions.map((discussion) => {
                    // Récupérer le dernier message de la discussion
                    const lastMessage =
                        discussion.discussion_messages.length > 0
                            ? discussion.discussion_messages[
                                  discussion.discussion_messages.length - 1
                              ]
                            : null

                    return {
                        discussion_uuid: discussion.discussion_uuid,
                        discussion_name: discussion.discussion_name,
                        discussion_description:
                            discussion.discussion_description,
                        discussion_type: discussion.discussion_type,
                        discussion_date_create:
                            discussion.discussion_date_create,
                        discussion_members: discussion.discussion_members.map(
                            (member) => ({
                                _id: member._id.toString(),
                                id: member.uuid,
                                firstname: member.firstname,
                                lastname: member.lastname,
                                picture: member.picture,
                                is_online: member.is_online,
                            })
                        ),
                        // Ajouter le dernier message
                        last_message: lastMessage
                            ? {
                                  message_content: lastMessage.message_content,
                                  message_date_create:
                                      lastMessage.message_date_create,
                                  message_sender: lastMessage.message_sender,
                              }
                            : null,
                    }
                })

                const message = {
                    discuss_list_response: {
                        etat: true,
                        messages: formattedDiscussions,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            } catch (error) {
                console.error("Erreur dans discuss_list_request:", error)
                const message = {
                    discuss_list_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }

        if (mesg.users_search_request) {
            try {
                const searchQuery = mesg.users_search_request
                console.log("Recherche avec la requête:", searchQuery)

                const query = {
                    $or: [
                        { firstname: new RegExp(searchQuery, "i") },
                        { lastname: new RegExp(searchQuery, "i") },
                    ],
                }

                console.log("Query MongoDB:", query)

                // Assurez-vous que vous importez le bon modèle
                const users = await User.find(query).select(
                    "_id firstname lastname email picture"
                )
                console.log("Utilisateurs trouvés:", users)

                const formattedUsers = users.map((user) => ({
                    id: user._id.toString(), // Convertir l'ObjectId en string
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    picture: user.picture || "",
                }))

                console.log("Utilisateurs formatés:", formattedUsers)

                const message = {
                    users_search_response: {
                        etat: true,
                        users: formattedUsers,
                    },
                    id: [mesg.id],
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                console.error("Erreur lors de la recherche:", error)
                const message = {
                    users_search_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }
        // CAS : DEMANDE DE SUPPRESSION MEMBRE D'UNE DISCUSSION
        if (mesg.discuss_remove_member_request) {
            try {
                const [userId, discussId] = mesg.discuss_remove_member_request
                const discussion = await Discussion.findOneAndUpdate(
                    { discussion_uuid: discussId },
                    { $pull: { discussion_members: userId } },
                    { new: true }
                )
                if (discussion.discussion_members.length === 0) {
                    await Discussion.deleteOne({ discussion_uuid: discussId })
                }
                const message = {
                    discuss_remove_member_response: {
                        etat: true,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    discuss_remove_member_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }
        // CAS : DEMANDE DE SUPPRESSION DE MESSAGE
        if (mesg.discuss_remove_message_request) {
            try {
                const [messageId, convId] = mesg.discuss_remove_message_request

                const discussion = await Discussion.findOneAndUpdate(
                    { discussion_uuid: convId },
                    {
                        $pull: {
                            discussion_messages: { message_uuid: messageId },
                        },
                    },
                    { new: true }
                )

                const message = {
                    discuss_remove_message_response: {
                        etat: true,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    discuss_remove_message_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }
        // CAS : PASSAGE A LU DES MESSAGES
        if (mesg.message_status_request) {
            try {
                const convID = mesg.message_status_request

                // Marquer tous les messages comme "read"
                const conv = await Discussion.findOneAndUpdate(
                    { discussion_uuid: convID },
                    {
                        $set: {
                            "discussion_messages.$[elem].message_status":
                                "read",
                        },
                    },
                    {
                        arrayFilters: [
                            { "elem.message_status": { $ne: "read" } },
                        ],
                        new: true,
                    }
                ).populate({
                    path: "discussion_members",
                    model: "User",
                    select: "socket_id",
                })
                if (conv == null) throw new Error("Discussion non trouvée")

                // Extraire tous les socket_id des membres
                const socketIds = conv.discussion_members
                    .map((member) => member.socket_id)
                    .filter((id) => id && id !== "none") // Tu peux filtrer ceux qui n'ont pas de socket_id actif

                const message = {
                    message_status_response: {
                        etat: true,
                    },
                    id: socketIds,
                }

                this.controleur.envoie(this, message)
            } catch (error) {
                const message = {
                    message_status_response: {
                        etat: false,
                        error: error.message,
                    },
                    id: [mesg.id],
                }
                this.controleur.envoie(this, message)
            }
        }
    }
}

export default MessagesService
