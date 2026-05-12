import type { User } from "types/User"

export type AuthState = {
	user: User | null,
	isAuthenticated: boolean,
	isLoading: boolean,
	isRefreshing: boolean,
	expiresAt: number | null,
	showExpiryWarning: boolean,
	loginRejected: boolean,
}

export type AuthActions = {
	login: (email: string, password: string) => void,
	register: (data: { password: string, firstname: string, lastname: string, email: string, phone: string }) => void,
	logout: () => void,
	refreshSession: () => void,
	dismissExpiryWarning: () => void,
}

export type AuthContextType = AuthState & AuthActions
