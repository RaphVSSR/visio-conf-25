import type { Server } from "socket.io"

export default class SessionManager {

	private static io: Server

	static bindToServer(io: Server) {
		this.io = io
	}

	static bind(socketId: string, userId: string) {
		const socket = this.io.sockets.sockets.get(socketId)
		if (!socket) return

		;(socket.request as any).session.userId = userId
		;(socket.request as any).session.save()
		socket.join(userId)
	}

	static unbind(socketId: string) {
		const socket = this.io.sockets.sockets.get(socketId)
		if (!socket) return

		const userId = (socket.request as any).session?.userId
		if (userId) {
			socket.leave(userId)
			delete (socket.request as any).session.userId
			;(socket.request as any).session.save()
		}
	}

	static getUserId(socketId: string): string | null {
		const socket = this.io.sockets.sockets.get(socketId)
		return (socket?.request as any)?.session?.userId ?? null
	}

	static getUserSocketIds(userId: string): string[] {
		const room = this.io.sockets.adapter.rooms.get(userId)
		return room ? [...room] : []
	}

	static refreshSession(socketId: string) {
		const socket = this.io.sockets.sockets.get(socketId)
		if (!socket) return

		const session = (socket.request as any).session
		if (session) {
			session.cookie.maxAge = this.getSessionDurationMs()
			session.save()
		}
	}

	static hasActiveSessions(userId: string): boolean {
		const room = this.io.sockets.adapter.rooms.get(userId)
		return !!room && room.size > 0
	}

	static getSessionDurationMs(): number {
		return this.parseExpiryToMs(process.env.SESSION_DURATION || "24h")
	}

	private static parseExpiryToMs(expiry: string): number {
		const match = expiry.match(/^(\d+)(s|m|h|d)$/)
		if (!match) return 24 * 60 * 60 * 1000

		const value = parseInt(match[1]!)
		const unit = match[2]!

		switch (unit) {
			case "s": return value * 1000
			case "m": return value * 60 * 1000
			case "h": return value * 60 * 60 * 1000
			case "d": return value * 24 * 60 * 60 * 1000
			default: return 24 * 60 * 60 * 1000
		}
	}
}
