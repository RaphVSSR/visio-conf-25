import { FC, useEffect, useState } from "react"
import { useAuth } from "hooks/useAuth"
import { Toast } from "design-system/components/Toast/Toast"
import { AnimatePresence } from "framer-motion"
import "./AuthToasts.scss"

export const AuthToasts: FC = () => {

	const {
		showExpiryWarning, expiresAt, isRefreshing, refreshSession, dismissExpiryWarning,
	} = useAuth()

	const [timeLeft, setTimeLeft] = useState("")

	useEffect(() => {
		if (!showExpiryWarning || !expiresAt) return

		const update = () => {
			const remaining = expiresAt - Date.now()
			if (remaining <= 0) { setTimeLeft("0:00"); return }
			const minutes = Math.floor(remaining / 60000)
			const seconds = Math.floor((remaining % 60000) / 1000)
			setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`)
		}

		update()
		const interval = setInterval(update, 1000)
		return () => clearInterval(interval)
	}, [showExpiryWarning, expiresAt])

	if (!showExpiryWarning) return null

	return (
		<aside className="authToasts" aria-live="assertive">
			<AnimatePresence mode="popLayout">
				{showExpiryWarning && (
					<Toast
						key="session-expiry"
						variant="info"
						message="Session bientôt expirée"
						subtitle={`Expire dans ${timeLeft}`}
						actions={[
							{ label: isRefreshing ? "Prolongation..." : "Prolonger", onClick: refreshSession, variant: "primary", disabled: isRefreshing },
							{ label: "Ignorer", onClick: dismissExpiryWarning, variant: "ghost" },
						]}
					/>
				)}
			</AnimatePresence>
		</aside>
	)
}
