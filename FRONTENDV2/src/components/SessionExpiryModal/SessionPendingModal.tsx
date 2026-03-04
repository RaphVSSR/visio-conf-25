import React, { FC } from "react"
import { useAuth } from "hooks/useAuthMessages"
import "./SessionPendingModal.scss"

/**
 * Modale d'approbation de nouvelle session.
 * S'affiche quand un autre appareil tente de se connecter au même compte.
 * L'utilisateur peut accepter ou refuser la nouvelle connexion.
 */
export const SessionPendingModal: FC = () => {

	const { pendingSessionRequests, respondToPendingSession } = useAuth()

	if (pendingSessionRequests.length === 0) return null

	const request = pendingSessionRequests[0]!

	return (
		<div className="sessionPendingOverlay">
			<div className="sessionPendingModal">
				<h2>Nouvelle connexion</h2>
				<p>Un nouvel appareil tente de se connecter à votre compte :</p>
				<div className="deviceInfoBlock">
					<p><strong>Appareil :</strong> {request.deviceInfo}</p>
					<p><strong>Utilisateur :</strong> {request.requesterInfo}</p>
				</div>
				<p>Souhaitez-vous autoriser cette connexion ?</p>
				<div className="sessionPendingActions">
					<button
						className="acceptBtn"
						onClick={() => respondToPendingSession(request.requestId, true)}
					>
						Autoriser
					</button>
					<button
						className="rejectBtn"
						onClick={() => respondToPendingSession(request.requestId, false)}
					>
						Refuser
					</button>
				</div>
			</div>
		</div>
	)
}
