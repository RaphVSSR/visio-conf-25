import { FC, useEffect, useState } from "react"
import { useAuth } from "hooks/useAuth"
import { useToast } from "contexts/ToastContext"

export const AuthToasts: FC = () => {

	const {
		showExpiryWarning, expiresAt, isRefreshing, refreshSession, dismissExpiryWarning,
	} = useAuth()

	const { showToast, removeToast } = useToast()
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
		const handle = setInterval(update, 1000)
		return () => clearInterval(handle)
	}, [showExpiryWarning, expiresAt])

	useEffect(() => {
		if (!showExpiryWarning) {
			removeToast("session-expiry")
			return
		}
		showToast({
			name: "session-expiry",
			variant: "info",
			message: "Session bientôt expirée",
			subtitle: `Expire dans ${timeLeft}`,
			actions: [
				{ label: isRefreshing ? "Prolongation..." : "Prolonger", onClick: refreshSession, variant: "primary", disabled: isRefreshing },
				{ label: "Ignorer", onClick: dismissExpiryWarning, variant: "ghost" },
			],
		})
	}, [showExpiryWarning, timeLeft, isRefreshing, refreshSession, dismissExpiryWarning, showToast, removeToast])

	return null
}
