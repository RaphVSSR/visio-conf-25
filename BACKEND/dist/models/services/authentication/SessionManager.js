export default class SessionManager {
    static io;
    static bindToServer(io) {
        this.io = io;
    }
    static bind(socketId, userId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (!socket)
            return;
        socket.request.session.userId = userId;
        socket.request.session.save();
        socket.join(userId);
    }
    static unbind(socketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (!socket)
            return;
        const userId = socket.request.session?.userId;
        if (userId) {
            socket.leave(userId);
            delete socket.request.session.userId;
            socket.request.session.save();
        }
    }
    static getUserId(socketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        return socket?.request?.session?.userId ?? null;
    }
    static getUserSocketIds(userId) {
        const room = this.io.sockets.adapter.rooms.get(userId);
        return room ? [...room] : [];
    }
    static refreshSession(socketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (!socket)
            return;
        const session = socket.request.session;
        if (session) {
            session.cookie.maxAge = this.getSessionDurationMs();
            session.save();
        }
    }
    static hasActiveSessions(userId) {
        const room = this.io.sockets.adapter.rooms.get(userId);
        return !!room && room.size > 0;
    }
    static getSessionDurationMs() {
        return this.parseExpiryToMs(process.env.SESSION_DURATION || "24h");
    }
    static parseExpiryToMs(expiry) {
        const match = expiry.match(/^(\d+)(s|m|h|d)$/);
        if (!match)
            return 24 * 60 * 60 * 1000;
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case "s": return value * 1000;
            case "m": return value * 60 * 1000;
            case "h": return value * 60 * 60 * 1000;
            case "d": return value * 24 * 60 * 60 * 1000;
            default: return 24 * 60 * 60 * 1000;
        }
    }
}
//# sourceMappingURL=SessionManager.js.map