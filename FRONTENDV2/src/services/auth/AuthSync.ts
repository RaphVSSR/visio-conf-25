import type MessageClientAdapter from "services/MessageClientAdapter"
import type { AuthState, PendingSessionRequest } from "./AuthSync.types"

type StateUpdater = (updater: (prev: AuthState) => AuthState) => void

export class AuthSync {

	private socket: MessageClientAdapter
	private onStateChange: StateUpdater
	private expiryTimer: ReturnType<typeof setTimeout> | null = null

	private handleLoginResponse = (data: { status: string, [key: string]: any }) => {

		switch (data.status) {
			case "success":
				this.startExpiryTimer(data.expiresAt)
				this.onStateChange(prev => ({
					...prev,
					user: data.user,
					isAuthenticated: true,
					isLoading: false,
					expiresAt: data.expiresAt,
					pendingLoginRequestId: null,
				}))
				break

			case "failure":
				this.onStateChange(prev => ({
					...prev,
					isLoading: false,
					loginRejected: prev.pendingLoginRequestId !== null,
					pendingLoginRequestId: null,
				}))
				break

			case "pending":
				this.onStateChange(prev => ({
					...prev,
					isLoading: false,
					pendingLoginRequestId: data.requestId,
				}))
				break
		}
	}

	private handleAuthenticateResponse = (data: { status: string, [key: string]: any }) => {

		switch (data.status) {
			case "success":
				this.startExpiryTimer(data.expiresAt)
				this.onStateChange(prev => ({
					...prev,
					user: data.user,
					isAuthenticated: true,
					isLoading: false,
					expiresAt: data.expiresAt,
				}))
				break

			case "failure":
				this.onStateChange(prev => ({
					...prev,
					user: null,
					isAuthenticated: false,
					isLoading: false,
					expiresAt: null,
				}))
				break
		}
	}

	private handleRegisterResponse = (data: { status: string, [key: string]: any }) => {

		switch (data.status) {
			case "success":
				this.startExpiryTimer(data.expiresAt)
				this.onStateChange(prev => ({
					...prev,
					user: data.user,
					isAuthenticated: true,
					isLoading: false,
					expiresAt: data.expiresAt,
				}))
				break

			case "failure":
				this.onStateChange(prev => ({
					...prev,
					isLoading: false,
				}))
				break
		}
	}

	private handleSessionResponse = (data: { status: string, [key: string]: any }) => {

		switch (data.status) {
			case "disconnected":
				this.clearExpiryTimer()
				this.onStateChange(prev => ({
					...prev,
					user: null,
					isAuthenticated: false,
					isLoading: false,
					expiresAt: null,
					pendingSessionRequests: [],
					showExpiryWarning: false,
				}))
				break

			case "refreshed":
				this.onStateChange(prev => ({
					...prev,
					expiresAt: data.expiresAt,
					showExpiryWarning: false,
				}))
				this.startExpiryTimer(data.expiresAt)
				break

			case "expired":
				this.clearExpiryTimer()
				this.onStateChange(prev => ({
					...prev,
					user: null,
					isAuthenticated: false,
					isLoading: false,
					expiresAt: null,
					showExpiryWarning: false,
				}))
				break

			case "pending_request":
				this.onStateChange(prev => ({
					...prev,
					pendingSessionRequests: [...prev.pendingSessionRequests, data as unknown as PendingSessionRequest],
				}))
				break

			case "pending_accepted":
				this.onStateChange(prev => ({
					...prev,
					pendingSessionRequests: prev.pendingSessionRequests.filter(
						r => r.requestId !== data.requestId
					),
				}))
				break

			case "pending_rejected":
				this.onStateChange(prev => ({
					...prev,
					pendingSessionRequests: prev.pendingSessionRequests.filter(
						r => r.requestId !== data.requestId
					),
				}))
				break
		}
	}

	constructor(socket: MessageClientAdapter, onStateChange: StateUpdater) {
		this.socket = socket
		this.onStateChange = onStateChange

		this.socket.on("login_response", this.handleLoginResponse)
		this.socket.on("authenticate_response", this.handleAuthenticateResponse)
		this.socket.on("register_response", this.handleRegisterResponse)
		this.socket.on("session_response", this.handleSessionResponse)

		this.socket.onReady(() => {
			this.socket.onReconnect(() => this.socket.send("authenticate", {}))
			this.socket.send("authenticate", {})
		})
	}

	login(email: string, password: string): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true, loginRejected: false }))
		this.socket.send("login", { email, password, deviceInfo: navigator.userAgent })
	}

	register(data: { password: string, firstname: string, lastname: string, email: string, phone: string }): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true }))
		this.socket.send("register", data)
	}

	logout(): void {
		this.socket.send("session", { type: "disconnect" })
	}

	refreshSession(): void {
		this.socket.send("session", { type: "refresh" })
	}

	respondToPendingSession(requestId: string, accepted: boolean): void {
		this.socket.send("session", { type: "pending_choice", requestId, accepted })
	}

	destroy(): void {
		this.clearExpiryTimer()
		this.socket.off("login_response", this.handleLoginResponse)
		this.socket.off("authenticate_response", this.handleAuthenticateResponse)
		this.socket.off("register_response", this.handleRegisterResponse)
		this.socket.off("session_response", this.handleSessionResponse)
	}

	private startExpiryTimer(expiresAt: number): void {
		this.clearExpiryTimer()

		this.expiryTimer = setTimeout(() => {
			this.onStateChange(prev => ({ ...prev, showExpiryWarning: true }))

			this.expiryTimer = setTimeout(() => {
				this.onStateChange(prev => ({
					...prev,
					user: null,
					isAuthenticated: false,
					isLoading: false,
					expiresAt: null,
					showExpiryWarning: false,
				}))
			}, expiresAt - Date.now())
		}, expiresAt - Date.now() - Number(process.env.REACT_APP_SESSION_EXPIRY_WARNING_MS))
	}

	private clearExpiryTimer(): void {
		if (this.expiryTimer) {
			clearTimeout(this.expiryTimer)
			this.expiryTimer = null
		}
	}
}
