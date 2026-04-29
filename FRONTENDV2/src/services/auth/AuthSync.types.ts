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

export type PendingSessionRequest = {
	requestId: string,
	deviceInfo: string,
	requesterInfo: string,
}

export type AuthState = {
	user: AuthUser | null,
	isAuthenticated: boolean,
	isLoading: boolean,
	expiresAt: number | null,
	sessionId: string | null,
	pendingLoginRequestId: string | null,
	pendingSessionRequests: PendingSessionRequest[],
	showExpiryWarning: boolean,
	loginRejected: boolean,
}

export type AuthActions = {
	login: (email: string, password: string) => void,
	register: (data: { password: string, firstname: string, lastname: string, email: string, phone: string }) => void,
	logout: () => void,
	refreshSession: () => void,
	respondToPendingSession: (requestId: string, accepted: boolean) => void,
	dismissExpiryWarning: () => void,
}

export type AuthContextType = AuthState & AuthActions
