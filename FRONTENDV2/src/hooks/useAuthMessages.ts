import { useContext } from "react"
import { AuthContext, type AuthContextType } from "contexts/AuthContext"

/**
 * Hook pour accéder à l'état et aux actions d'authentification.
 * Doit être utilisé dans un composant enfant de AuthProvider.
 * @returns L'état auth et les actions (login, register, logout, etc.)
 * @throws Si utilisé en dehors d'un AuthProvider
 */
export function useAuth(): AuthContextType {

	const context = useContext(AuthContext)

	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider")
	}

	return context
}
