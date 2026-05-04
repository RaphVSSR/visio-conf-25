import type MessageClientAdapter from "services/MessageClientAdapter"

export type AuthUser = {
	_id: string,
	firstname: string,
	lastname: string,
	email: string,
	phone: string,
	status: string,
	job: string,
	desc: string,
	picture: string,
	is_online: boolean,
	disturb_status: string,
	roles: string[],
}

export type AuthState = {
	user: AuthUser | null,
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

export type AuthContextType = AuthState & AuthActions & { socket: MessageClientAdapter | null }
