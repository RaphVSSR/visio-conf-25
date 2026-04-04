import { sha256 } from "js-sha256";
import User from "../../User.js";
import SessionManager from "./SessionManager.js";
import { getMessagesByDomain } from "../../ListeMessages.js";
export default class AuthService {
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
        this.registerHandler("login", this.login);
        this.registerHandler("authenticate", this.authenticate);
        this.registerHandler("register", this.handleRegister);
        this.registerHandler("socket_disconnect", this.socketDisconnect);
        const outgoing = [...getMessagesByDomain("auth").received, ...getMessagesByDomain("socket").received];
        this.controleur.inscription(this, outgoing, [...this.handlers.keys()]);
    }
    login = async (socketId, payload) => {
        const { email, password } = payload;
        const user = await User.getUser(email);
        if (!user)
            return this.send(socketId, "login_response", { status: "failure", reason: "user_not_found" });
        if (!AuthService.verifyPassword(password, user.password))
            return this.send(socketId, "login_response", { status: "failure", reason: "wrong_password" });
        const userDetails = AuthService.sanitizeUser(user.toObject());
        const userId = user._id.toString();
        const expiresAt = AuthService.bindSession(socketId, userId);
        this.send(socketId, "login_response", { status: "success", user: userDetails, expiresAt });
    };
    authenticate = async (socketId) => {
        const userId = SessionManager.getUserId(socketId);
        if (!userId)
            return this.send(socketId, "authenticate_response", { status: "failure", reason: "session_expired" });
        const user = await User.model.findById(userId).select("-password").lean();
        if (!user)
            return this.send(socketId, "authenticate_response", { status: "failure", reason: "user_not_found" });
        const expiresAt = AuthService.bindSession(socketId, userId);
        this.send(socketId, "authenticate_response", { status: "success", user, expiresAt });
    };
    handleRegister = async (socketId, payload) => {
        const { password, firstname, lastname, email, phone } = payload;
        const existingUser = await User.getUser(email);
        if (existingUser)
            return this.send(socketId, "register_response", { status: "failure", reason: "email_already_exists" });
        try {
            const newUser = new User({
                firstname, lastname, email, phone, desc: "",
                password: AuthService.hashPassword(password),
                roles: ["user"],
            });
            await newUser.save();
            const userId = newUser.modelInstance._id.toString();
            const expiresAt = AuthService.bindSession(socketId, userId);
            const userDetails = AuthService.sanitizeUser(newUser.modelInstance.toObject());
            this.send(socketId, "register_response", { status: "success", user: userDetails, expiresAt });
        }
        catch (error) {
            this.send(socketId, "register_response", { status: "failure", reason: error.message });
        }
    };
    socketDisconnect = (socketId) => {
        SessionManager.unbind(socketId);
    };
    static bindSession(socketId, userId) {
        const expiresAt = Date.now() + SessionManager.getSessionDurationMs();
        SessionManager.bind(socketId, userId);
        return expiresAt;
    }
    static sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }
    static hashPassword(password) {
        return sha256(password);
    }
    static verifyPassword(password, hash) {
        return sha256(password) === hash;
    }
}
//# sourceMappingURL=AuthService.js.map