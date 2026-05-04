export default function formatRelativeDate(dateString: string): string {
	try {
		const date = new Date(dateString)
		const now = new Date()
		const diffMs = now.getTime() - date.getTime()
		const diffMins = Math.floor(diffMs / 60000)
		const diffHours = Math.floor(diffMins / 60)
		const diffDays = Math.floor(diffHours / 24)

		if (diffMins < 1) return "A l'instant"
		if (diffMins < 60)
			return `Il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`
		if (diffHours < 24)
			return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`
		if (diffDays < 7)
			return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`

		return date.toLocaleDateString("fr-FR", {
			day: "numeric",
			month: "short",
			year: "numeric",
		})
	} catch {
		return dateString
	}
}
