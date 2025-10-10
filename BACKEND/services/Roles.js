/* Authors: Matthieu BIVILLE */

import Role from "../models/role.js"
import { v4 as uuidv4 } from "uuid"
import User from "../models/user.js"
import SocketIdentificationService from "./SocketIdentification.js"

class RolesService {
    controleur
    verbose = false
    listeDesMessagesEmis = [
        "roles_list_response",
        "one_role_response",
        "created_role",
        "role_already_exists",
        "updated_role",
        "deleted_role",
    ]
    listeDesMessagesRecus = [
        "roles_list_request",
        "one_role_request",
        "create_role_request",
        "update_role_request",
        "delete_role_request",
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

        if (typeof mesg.create_role_request != "undefined") {
            var role = await Role.findOne({
                role_label: mesg.create_role_request.name,
            })
            if (role == null) {
                var newRole = new Role({
                    role_uuid: mesg.create_role_request.name
                        .toLowerCase()
                        .replace(" ", "_"),
                    role_label: mesg.create_role_request.name,
                    role_permissions: mesg.create_role_request.perms,
                })
                var r = await newRole.save()
                if (r != null) {
                    this.controleur.envoie(this, {
                        created_role: {
                            role_id: r._id,
                            action: mesg.create_role_request.action,
                        },
                        id: [mesg.id],
                    })
                }
            } else {
                this.controleur.envoie(this, {
                    role_already_exists: { role_id: role._id },
                    id: [mesg.id],
                })
            }
        }
        if (typeof mesg.roles_list_request != "undefined") {
            var roles = await Role.find()
            this.controleur.envoie(this, {
                roles_list_response: roles,
                id: [mesg.id],
            })
        }
        if (typeof mesg.one_role_request != "undefined") {
            var role = await Role.findOne({
                _id: mesg.one_role_request.role_id,
            })
            this.controleur.envoie(this, {
                one_role_response: { role: role },
                id: [mesg.id],
            })
        }
        if (typeof mesg.update_role_request != "undefined") {
            await Role.updateOne(
                { _id: mesg.update_role_request.role_id },
                { $set: { role_permissions: mesg.update_role_request.perms } }
            )

            const usersToNotify = await User.find({
                roles: mesg.update_role_request.role_id,
            })
            // Utiliser SocketIdentificationService pour obtenir les socket ids
            const socketIdPromises = usersToNotify.map(async (user) => {
                return SocketIdentificationService.getUserSocketId(
                    user._id?.toString()
                )
            })
            const socketToNotify = (await Promise.all(socketIdPromises)).filter(
                Boolean
            )

            this.controleur.envoie(this, {
                updated_role: { state: true },
                id: [mesg.id, ...socketToNotify],
            })
        }
        if (typeof mesg.delete_role_request != "undefined") {
            await Role.deleteOne({ _id: mesg.delete_role_request.role_id })
            this.controleur.envoie(this, {
                deleted_role: { state: true },
                id: [mesg.id],
            })
        }
    }
}
export default RolesService
