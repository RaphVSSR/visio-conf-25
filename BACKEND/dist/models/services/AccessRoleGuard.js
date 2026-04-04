import SessionManager from "./authentication/SessionManager.js";
import User from "../User.js";
export default class AccessRoleGuard {
    static async resolveUser(socketId) {
        const userId = SessionManager.getUserId(socketId);
        if (!userId)
            return null;
        return User.model.findById(userId).select("-password").lean();
    }
    static async hasRole(socketId, roleUuid) {
        const user = await this.resolveUser(socketId);
        if (!user)
            return false;
        return !!user.roles?.includes(roleUuid);
    }
    static async requireAuth(socketId) {
        const user = await this.resolveUser(socketId);
        if (!user)
            return { authorized: false, reason: "not_authenticated" };
        return { authorized: true, user };
    }
    static async requireRole(socketId, roleUuid) {
        const user = await this.resolveUser(socketId);
        if (!user)
            return { authorized: false, reason: "not_authenticated" };
        if (!user.roles?.includes(roleUuid))
            return { authorized: false, reason: "insufficient_role" };
        return { authorized: true, user };
    }
}
//# sourceMappingURL=AccessRoleGuard.js.map