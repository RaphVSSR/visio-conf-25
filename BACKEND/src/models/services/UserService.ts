import { getMessagesByDomain } from "../ListeMessages.ts"
import AccessRoleGuard from "./AccessRoleGuard.ts"
import User from "../User.ts"
import { sha256 } from "js-sha256"

type MessageHandler = (socketId: string, payload: any) => void

export default class UserService {
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
        this.registerHandler("edit_user_request", this.handleEditUserRequest)

        this.controleur.inscription(
            this,
            getMessagesByDomain("user").received,
            [...this.handlers.keys()]
        )
    }

    private formatUserForAdmin = (user: any) => {
        if (!user) return null

        return {
            _id: (user._id?.toString?.() ?? user._id) as string,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
            status: user.status,
            roles: Array.isArray(user.roles) ? user.roles : [],
            desc: user.desc ?? "",
            picture: user.picture,
        }
    }

    private handleEditUserRequest = async (socketId: string, payload: any) => {
        const request = payload?.request

        const guard = await AccessRoleGuard.requireRole(socketId, "admin")
        if (!guard.authorized) {
            return this.send(socketId, "edit_user_answer", {
                request,
                etat: false,
                error: guard.reason
            })
        }

        try {
            switch (request) {
                case "list":
                    return this.handleAdminUsersList(socketId)
                case "add":
                    return this.handleAdminUserAdd(socketId, payload)
                case "delete":
                    return this.handleAdminUserDelete(socketId, payload)
                case "edit":
                    return this.handleAdminUserEdit(socketId, payload)
                default:
                    return this.send(socketId, "edit_user_answer", {
                        request,
                        etat: false,
                        error: "invalid_request"
                    })
            }
        } catch (error: any) {
            return this.send(socketId, "edit_user_answer", {
                request,
                etat: false,
                error: error?.message ?? "server_error"
            })
        }
    }

    private handleAdminUsersList = async (socketId: string) => {
        const users = await User.model.find({})
            .select("firstname lastname email picture phone status roles desc")
            .lean()

        const formatted = users
            .map((u: any) => this.formatUserForAdmin(u))
            .filter(Boolean)

        return this.send(socketId, "edit_user_answer", {
            request: "list",
            etat: true,
            users: formatted
        })
    }

    private handleAdminUserAdd = async (socketId: string, payload: any) => {
        const { firstname, lastname, email, phone, password, desc, status, roles } = payload ?? {}

        if (!firstname || !lastname || !email || !phone || !password) {
            return this.send(socketId, "edit_user_answer", {
                request: "add",
                etat: false,
                error: "missing_fields"
            })
        }

        const existingUser = await User.getUser(email)
        if (existingUser) {
            return this.send(socketId, "edit_user_answer", {
                request: "add",
                etat: false,
                error: "email_already_exists"
            })
        }

        const newUser = new User({
            firstname,
            lastname,
            email,
            phone,
            password: sha256(password),
            desc: desc ?? "",
            status: status ?? "waiting",
            roles: Array.isArray(roles) && roles.length > 0 ? roles : ["user"],
        } as any)

        await newUser.save()

        const created = await User.model.findById(newUser.modelInstance._id)
            .select("firstname lastname email picture phone status roles desc")
            .lean()

        const formatted = this.formatUserForAdmin(created)
        if (!formatted) {
            return this.send(socketId, "edit_user_answer", {
                request: "add",
                etat: false,
                error: "user_creation_failed"
            })
        }

        return this.send(socketId, "edit_user_answer", {
            request: "add",
            etat: true,
            user: formatted
        })
    }

    private handleAdminUserDelete = async (socketId: string, payload: any) => {
        const { id } = payload ?? {}

        if (!id) {
            return this.send(socketId, "edit_user_answer", {
                request: "delete",
                etat: false,
                error: "missing_id"
            })
        }

        const userToDelete = await User.model.findById(id)
            .select("firstname lastname email picture phone status roles desc")
            .lean()

        if (!userToDelete) {
            return this.send(socketId, "edit_user_answer", {
                request: "delete",
                etat: false,
                error: "user_not_found"
            })
        }

        await User.model.findByIdAndDelete(id)

        return this.send(socketId, "edit_user_answer", {
            request: "delete",
            etat: true,
            user: this.formatUserForAdmin(userToDelete)
        })
    }

    private handleAdminUserEdit = async (socketId: string, payload: any) => {
        const { id, firstname, lastname, email, phone, password, desc, status, roles } = payload ?? {}

        if (!id) {
            return this.send(socketId, "edit_user_answer", {
                request: "edit",
                etat: false,
                error: "missing_id"
            })
        }

        if (!firstname || !lastname || !email || !phone || !status) {
            return this.send(socketId, "edit_user_answer", {
                request: "edit",
                etat: false,
                error: "missing_fields"
            })
        }

        const existing = await User.getUser(email)
        if (existing && existing._id?.toString() !== id) {
            return this.send(socketId, "edit_user_answer", {
                request: "edit",
                etat: false,
                error: "email_already_exists"
            })
        }

        const updateData: Record<string, any> = {
            firstname,
            lastname,
            email,
            phone,
            desc: desc ?? "",
            status,
            roles: Array.isArray(roles) && roles.length > 0 ? roles : ["user"],
        }

        if (password) {
            updateData.password = sha256(password)
        }

        await User.model.updateOne({ _id: id }, { $set: updateData })

        const updated = await User.model.findById(id)
            .select("firstname lastname email picture phone status roles desc")
            .lean()

        const formatted = this.formatUserForAdmin(updated)
        if (!formatted) {
            return this.send(socketId, "edit_user_answer", {
                request: "edit",
                etat: false,
                error: "user_update_failed"
            })
        }

        return this.send(socketId, "edit_user_answer", {
            request: "edit",
            etat: true,
            user: formatted
        })
    }
}