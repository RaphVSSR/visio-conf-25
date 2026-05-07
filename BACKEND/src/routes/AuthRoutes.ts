import express from "express";
import SessionManager from "../models/services/authentication/SessionManager.ts";

const router = express.Router();

router.post("/refresh", (request, response) => {

	const sess = request.session as any;
	if (!sess?.userId) return response.json({ status: "failure", reason: "not_authenticated" });

	sess.cookie.maxAge = SessionManager.getSessionDurationMs();
	sess.save((error: Error) => {
		if (error) return response.json({ status: "failure", reason: "session_save_error" });

		for (const socketId of SessionManager.getUserSocketIds(sess.userId)) {
			SessionManager.refreshSession(socketId);
		}

		const expiresAt = Date.now() + SessionManager.getSessionDurationMs();
		response.json({ status: "refreshed", expiresAt });
	});

});

router.post("/logout", (request, response) => {
	
	const sess = request.session as any;
	if (!sess?.userId) return response.json({ status: "disconnected" });

	const socketIds = SessionManager.getUserSocketIds(sess.userId);
	for (const socketId of socketIds) {
		SessionManager.unbind(socketId);
	}

	request.session.destroy((error: Error) => {
		if (error) return response.json({ status: "failure", reason: "session_destroy_error" });

		response.clearCookie("visioconf_session");
		response.json({ status: "disconnected" });
	});
	
});

export default router;
