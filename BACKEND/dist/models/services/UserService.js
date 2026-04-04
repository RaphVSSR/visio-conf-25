import { getMessagesByDomain } from "../ListeMessages.js";
import SessionManager from "./authentication/SessionManager.js";
import AccessRoleGuard from "./AccessRoleGuard.js";
import User from "../User.js";
export default class UserService {
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
        this.registerHandler("user_get", this.handleUserQuery);
        this.registerHandler("user_update", this.handleUserUpdate);
        this.controleur.inscription(this, getMessagesByDomain("user").received, [...this.handlers.keys()]);
    }
    resolveUserId(socketId) {
        return SessionManager.getUserId(socketId);
    }
    handleUserQuery = (socketId, payload) => {
        const dispatchers = {
            list: () => this.getUsersList(socketId),
            info: () => this.getUserInfo(socketId, payload),
            search: () => this.searchUsers(socketId, payload),
        };
        dispatchers[payload.type]?.();
    };
    handleUserUpdate = (socketId, payload) => {
        const dispatchers = {
            profile: () => this.updateUser(socketId, payload),
            status: () => this.updateUserStatus(socketId, payload),
            roles: () => this.updateUserRoles(socketId, payload),
        };
        dispatchers[payload.type]?.();
    };
    getUsersList = async (socketId) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "user_get_response", { type: "list", etat: false, error: "not_authenticated" });
        const users = await User.model.find({ status: "active" })
            .select("firstname lastname email picture is_online job")
            .lean();
        const formattedUsers = users.map(user => ({
            id: user._id.toString(),
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            picture: user.picture,
            isOnline: user.is_online,
            job: user.job,
        }));
        this.send(socketId, "user_get_response", { type: "list", etat: true, users: formattedUsers });
    };
    getUserInfo = async (socketId, payload) => {
        const requesterId = this.resolveUserId(socketId);
        if (!requesterId)
            return this.send(socketId, "user_get_response", { type: "info", etat: false, error: "not_authenticated" });
        const { userId } = payload;
        const user = await User.model.findById(userId)
            .select("firstname lastname email picture is_online job desc phone date_created")
            .lean();
        if (!user)
            return this.send(socketId, "user_get_response", { type: "info", etat: false, error: "user_not_found" });
        const formattedUser = {
            id: user._id.toString(),
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            picture: user.picture,
            isOnline: user.is_online,
            job: user.job,
            desc: user.desc,
            phone: user.phone,
            dateCreated: user.date_created,
        };
        this.send(socketId, "user_get_response", { type: "info", etat: true, user: formattedUser });
    };
    searchUsers = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "user_get_response", { type: "search", etat: false, error: "not_authenticated" });
        const { query } = payload;
        const regex = new RegExp(query, "i");
        const users = await User.model.find({
            status: "active",
            $or: [
                { firstname: regex },
                { lastname: regex },
                { email: regex },
            ],
        })
            .select("firstname lastname email picture is_online")
            .limit(20)
            .lean();
        const formattedUsers = users.map(user => ({
            id: user._id.toString(),
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            picture: user.picture,
            isOnline: user.is_online,
        }));
        this.send(socketId, "user_get_response", { type: "search", etat: true, users: formattedUsers });
    };
    updateUser = async (socketId, payload) => {
        const userId = this.resolveUserId(socketId);
        if (!userId)
            return this.send(socketId, "user_update_response", { type: "profile", etat: false, error: "not_authenticated" });
        const allowedFields = ["firstname", "lastname", "phone", "job", "desc", "picture"];
        const updateData = {};
        for (const field of allowedFields) {
            if (payload[field] !== undefined)
                updateData[field] = payload[field];
        }
        await User.model.updateOne({ _id: userId }, { $set: updateData });
        this.send(socketId, "user_update_response", { type: "profile", etat: true });
    };
    updateUserStatus = async (socketId, payload) => {
        const guard = await AccessRoleGuard.requireRole(socketId, "admin");
        if (!guard.authorized)
            return this.send(socketId, "user_update_response", { type: "status", etat: false, error: guard.reason });
        const { userId, status } = payload;
        await User.model.updateOne({ _id: userId }, { $set: { status } });
        this.send(socketId, "user_update_response", { type: "status", etat: true, userId, status });
    };
    updateUserRoles = async (socketId, payload) => {
        const guard = await AccessRoleGuard.requireRole(socketId, "admin");
        if (!guard.authorized)
            return this.send(socketId, "user_update_response", { type: "roles", etat: false, error: guard.reason });
        const { userId, roles } = payload;
        await User.model.updateOne({ _id: userId }, { $set: { roles } });
        this.send(socketId, "user_update_response", { type: "roles", etat: true, userId, roles });
    };
}
//# sourceMappingURL=UserService.js.map