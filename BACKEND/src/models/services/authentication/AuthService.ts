import { sha256 } from "js-sha256";
import User from "../../User.ts";
import SessionManager from "./SessionManager.ts";
import Controleur from "../../../Controller/controleur";
import { Message } from "../../ListeMessages.ts";

export default class AuthService {
	controleur: Controleur;
	nomDInstance: string;

	msgEmitted: string[] = ["login_response", "authenticate_response", "register_response"];
	msgReceived: string[] = ["login", "authenticate", "register", "socket_disconnect"];

	constructor(controleur: any, name: string) {
		this.controleur = controleur;
		this.nomDInstance = name;
	}

	private send(socketIds: string | string[], messageName: string, payload: unknown) {
		const ids = Array.isArray(socketIds) ? socketIds : [socketIds];
		this.controleur.envoie(this, { [messageName]: payload, id: ids });
	}

	traitementMessage(message: Message) {
		const action = Object.keys(message).find((prop) => prop !== "id");
		if (!action) return;

		switch (action) {
			case "login":
				return this.login(message.id!, message.login);
			case "authenticate":
				return this.authenticate(message.id!);
			case "register":
				return this.handleRegister(message.id!, message.register);
			case "socket_disconnect":
				return this.socketDisconnect(message.socket_disconnect);
		}
	}

	register() {
		this.controleur.inscription(this, this.msgEmitted, this.msgReceived);
	}

	private login = async (socketId: string, payload: { email: string; password: string }) => {
		const { email, password } = payload;

		const user = await User.getUser(email);
		if (!user) return this.send(socketId, "login_response", { status: "failure", reason: "user_not_found" });

		if (!AuthService.verifyPassword(password, user.password))
			return this.send(socketId, "login_response", { status: "failure", reason: "wrong_password" });

		const userDetails = AuthService.sanitizeUser(user.toObject());
		const userId = user._id!.toString();

		const expiresAt = AuthService.bindSession(socketId, userId, user.roles ?? []);
		this.send(socketId, "login_response", { status: "success", user: userDetails, expiresAt });
	};

	private authenticate = async (socketId: string) => {
		const userId = SessionManager.getUserId(socketId);
		if (!userId) return this.send(socketId, "authenticate_response", { status: "failure", reason: "session_expired" });

		const user = await User.model.findById(userId).select("-password").lean();
		if (!user) return this.send(socketId, "authenticate_response", { status: "failure", reason: "user_not_found" });

		const expiresAt = AuthService.bindSession(socketId, userId, (user as any).roles ?? []);
		this.send(socketId, "authenticate_response", { status: "success", user, expiresAt });
	};

	private handleRegister = async (
		socketId: string,
		payload: { password: string; firstname: string; lastname: string; email: string; phone: string },
	) => {
		const { password, firstname, lastname, email, phone } = payload;

		const existingUser = await User.getUser(email);
		if (existingUser)
			return this.send(socketId, "register_response", { status: "failure", reason: "email_already_exists" });

		try {
			const newUser = new User({
				firstname,
				lastname,
				email,
				phone,
				password: AuthService.hashPassword(password),
				roles: ["user"],
			} as any);
			await newUser.save();

			const userId = newUser.modelInstance._id!.toString();
			const expiresAt = AuthService.bindSession(socketId, userId, newUser.modelInstance.roles ?? []);
			const userDetails = AuthService.sanitizeUser(newUser.modelInstance.toObject());

			this.send(socketId, "register_response", { status: "success", user: userDetails, expiresAt });
		} catch (error: any) {
			this.send(socketId, "register_response", { status: "failure", reason: error.message });
		}
	};

	private socketDisconnect = async (socketId: string) => {
		const userId = SessionManager.getUserId(socketId);
		SessionManager.unbind(socketId);

		if (!userId) return;

		if (!SessionManager.hasActiveSessions(userId)) {
			await User.model.updateOne({ _id: userId }, { is_online: false });
		} else {
			await User.model.updateOne({ _id: userId, disturb_status: "offline" }, { disturb_status: "available" });
		}
	};

	private static bindSession(socketId: string, userId: string, roles: string[] = []): number {
		const expiresAt = Date.now() + SessionManager.getSessionDurationMs();
		SessionManager.bind(socketId, userId, roles);
		User.model.updateOne({ _id: userId }, { is_online: true }).catch(() => {});
		User.model.updateOne({ _id: userId, disturb_status: "offline" }, { disturb_status: "available" }).catch(() => {});
		return expiresAt;
	}

	private static sanitizeUser(user: Record<string, any>) {
		const { password, ...sanitized } = user;
		return sanitized;
	}

	private static hashPassword(password: string): string {
		return sha256(password);
	}

	private static verifyPassword(password: string, hash: string): boolean {
		return sha256(password) === hash;
	}
}
