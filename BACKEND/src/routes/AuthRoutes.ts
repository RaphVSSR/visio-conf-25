import express from "express"
import SessionManager from "../models/services/authentication/SessionManager.ts"

const router = express.Router()

router.post("/refresh", (req, res) => {

	const sess = req.session as any
	if (!sess?.userId) return res.json({ status: "failure", reason: "not_authenticated" })

	sess.cookie.maxAge = SessionManager.getSessionDurationMs()
	sess.save((error: Error) => {
		if (error) return res.json({ status: "failure", reason: "session_save_error" })

		const expiresAt = Date.now() + SessionManager.getSessionDurationMs()
		res.json({ status: "refreshed", expiresAt })
	})
})

router.post("/logout", (req, res) => {

	const sess = req.session as any
	if (!sess?.userId) return res.json({ status: "disconnected" })

	const socketIds = SessionManager.getUserSocketIds(sess.userId)
	for (const socketId of socketIds) {
		SessionManager.unbind(socketId)
	}

	req.session.destroy((error: Error) => {
		if (error) return res.json({ status: "failure", reason: "session_destroy_error" })

		res.clearCookie("visioconf_session")
		res.json({ status: "disconnected" })
	})
})

export default router
