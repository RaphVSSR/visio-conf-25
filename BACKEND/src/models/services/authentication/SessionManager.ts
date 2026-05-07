import type { Server } from "socket.io";

export default class SessionManager {
	private static socketServer: Server;
	private static adminSocketIds: Set<string> = new Set();

	static bindToServer(socketServer: Server) {
		this.socketServer = socketServer;
	}

	static bind(socketId: string, userId: string, roles: string[] = []) {
		const socket = this.socketServer.sockets.sockets.get(socketId);
		if (!socket) return;

		(socket.data as any).userId = userId;
		(socket.request as any).session.userId = userId;
		(socket.request as any).session.save();
		socket.join(userId);

		if (roles.includes("admin")) {
			this.adminSocketIds.add(socketId);
		} else {
			this.adminSocketIds.delete(socketId);
		}
	}

	static unbind(socketId: string) {
		this.adminSocketIds.delete(socketId);
		const socket = this.socketServer.sockets.sockets.get(socketId);
		if (!socket) return;

		const userId = (socket.data as any)?.userId;
		if (userId) socket.leave(userId);
	}

	static getUserId(socketId: string): string | null {
		const socket = this.socketServer.sockets.sockets.get(socketId);
		if (!socket) return null;
		return (socket.data as any)?.userId ?? (socket.request as any)?.session?.userId ?? null;
	}

	static getUserSocketIds(userId: string): string[] {
		const room = this.socketServer.sockets.adapter.rooms.get(userId);
		return room ? [...room] : [];
	}

	static isAdmin(socketId: string): boolean {
		return this.adminSocketIds.has(socketId);
	}

	static refreshUserRoles(userId: string, roles: string[]) {
		const socketIds = this.getUserSocketIds(userId);
		const isAdmin = roles.includes("admin");
		for (const socketId of socketIds) {
			if (isAdmin) this.adminSocketIds.add(socketId);
			else this.adminSocketIds.delete(socketId);
		}
	}

	static refreshSession(socketId: string) {
		const socket = this.socketServer.sockets.sockets.get(socketId);
		if (!socket) return;

		const session = (socket.request as any).session;
		if (session) {
			session.cookie.maxAge = this.getSessionDurationMs();
			session.save();
		}
	}

	static hasActiveSessions(userId: string): boolean {
		const room = this.socketServer.sockets.adapter.rooms.get(userId);
		return !!room && room.size > 0;
	}

	static getSessionDurationMs(): number {
		return this.parseExpiryToMs(process.env.SESSION_DURATION || "24h");
	}

	private static parseExpiryToMs(expiry: string): number {
		const match = expiry.match(/^(\d+)(s|m|h|d)$/);
		if (!match) return 24 * 60 * 60 * 1000;

		const value = parseInt(match[1]!);
		const unit = match[2]!;

		switch (unit) {
			case "s":
				return value * 1000;
			case "m":
				return value * 60 * 1000;
			case "h":
				return value * 60 * 60 * 1000;
			case "d":
				return value * 24 * 60 * 60 * 1000;
			default:
				return 24 * 60 * 60 * 1000;
		}
	}
}
