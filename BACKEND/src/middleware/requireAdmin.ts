import type { NextFunction, Request, Response } from "express"
import User from "../models/User.ts"

const CSRF_GUARD_HEADER = "permissions-manager"

export async function requireAdmin(request: Request, response: Response, next: NextFunction) {

	const userId = (request.session as any)?.userId
	if (!userId) return response.status(401).json({ message: "Authentification requise." })

	try {
		const user = await User.model.findById(userId).select("roles").lean()
		if (!user?.roles?.includes("admin")) return response.status(403).json({ message: "Accès administrateur requis." })

		next()
	} catch (error) {
		console.error("Erreur pendant la vérification admin Permissions:", error)
		response.status(500).json({ message: "Impossible de vérifier les droits administrateur." })
	}
}

export function requirePermissionCsrfGuard(request: Request, response: Response, next: NextFunction) {

	if (request.method === "GET" || request.method === "HEAD") return next()

	if (request.get("X-CSRF-Guard") !== CSRF_GUARD_HEADER) {
		return response.status(403).json({ message: "Protection CSRF invalide." })
	}

	next()
}
