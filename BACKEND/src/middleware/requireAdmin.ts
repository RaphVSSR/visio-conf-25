import crypto from "node:crypto"
import type { NextFunction, Request, Response } from "express"
import User from "../models/User.ts"
import TracedError from "../models/core/TracedError.ts"

function getSessionCsrfToken(request: Request) {
	request.session.csrfToken ??= crypto.randomBytes(32).toString("hex")

	return request.session.csrfToken
}

export function sendPermissionCsrfToken(request: Request, response: Response) {
	response.json({ csrfToken: getSessionCsrfToken(request) })
}

export async function requireAdmin(request: Request, response: Response, next: NextFunction) {

	const userId = request.session.userId
	if (!userId) return response.status(401).json({ message: "Authentification requise." })

	try {
		const user = await User.model.findById(userId).select("roles").lean()
		if (!user?.roles?.includes("admin")) return response.status(403).json({ message: "Accès administrateur requis." })

		next()
	} catch (error) {
		TracedError.errorHandler(error)
		response.status(500).json({ message: "Impossible de vérifier les droits administrateur." })
	}
}

export function requirePermissionCsrfGuard(request: Request, response: Response, next: NextFunction) {

	if (request.method === "GET" || request.method === "HEAD") return next()

	if (request.get("X-CSRF-Token") !== getSessionCsrfToken(request)) {
		return response.status(403).json({ message: "CSRF invalide." })
	}

	next()
}
