import React, { FC, useEffect, useState } from "react"
import { useAuth } from "hooks/useAuthMessages"
import "./SessionExpiryModal.scss"

/**
 * Modale d'avertissement d'expiration de session.
 * S'affiche 30 minutes avant l'expiration pour proposer le renouvellement.
 */
export const SessionExpiryModal: FC = () => {

	const { showExpiryWarning, expiresAt, refreshSession, dismissExpiryWarning } = useAuth()
	const [timeLeft, setTimeLeft] = useState<string>("")

	useEffect(() => {

		if (!showExpiryWarning || !expiresAt) return

		const interval = setInterval(() => {

			const remaining = expiresAt - Date.now()

			if (remaining <= 0) {
				setTimeLeft("0:00")
				clearInterval(interval)
				return
			}

			const minutes = Math.floor(remaining / 60000)
			const seconds = Math.floor((remaining % 60000) / 1000)
			setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`)

		}, 1000)

		return () => clearInterval(interval)

	}, [showExpiryWarning, expiresAt])

	if (!showExpiryWarning) return null

	return (
		<div className="sessionExpiryOverlay">
			<div className="sessionExpiryModal">
				<h2>Session bientôt expirée</h2>
				<p>Votre session expire dans <strong>{timeLeft}</strong>.</p>
				<p>Souhaitez-vous prolonger votre session ?</p>
				<div className="sessionExpiryActions">
					<button className="extendBtn" onClick={refreshSession}>
						Prolonger la session
					</button>
					<button className="dismissBtn" onClick={dismissExpiryWarning}>
						Ignorer
					</button>
				</div>
			</div>
		</div>
	)
}
