import SessionManager from "./authentication/SessionManager.ts"
import User, { type UserType } from "../User.ts"

type AuthorizedResult = { authorized: true, user: UserType }
type UnauthorizedResult = { authorized: false, reason: string }
type AuthResult = AuthorizedResult | UnauthorizedResult

export default class AccessRoleGuard {

	static async resolveUser(socketId: string): Promise<UserType | null> {

		const userId = SessionManager.getUserId(socketId)
		if (!userId) return null

		return User.model.findById(userId).select("-password").lean()
	}

	static async hasRole(socketId: string, roleUuid: string): Promise<boolean> {

		const user = await this.resolveUser(socketId)
		if (!user) return false

		return !!user.roles?.includes(roleUuid)
	}

	static async requireAuth(socketId: string): Promise<AuthResult> {

		const user = await this.resolveUser(socketId)
		if (!user) return { authorized: false, reason: "not_authenticated" }

		return { authorized: true, user }
	}

	static async requireRole(socketId: string, roleUuid: string): Promise<AuthResult> {

		const user = await this.resolveUser(socketId)
		if (!user) return { authorized: false, reason: "not_authenticated" }

		if (!user.roles?.includes(roleUuid)) return { authorized: false, reason: "insufficient_role" }

		return { authorized: true, user }
	}
}
