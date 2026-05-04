import type MessageClientAdapter from "services/MessageClientAdapter"
import type { AuthState } from "./AuthSync.types"

type StateUpdater = (updater: (prev: AuthState) => AuthState) => void

const BACKEND_URL = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:3220"
const WARNING_MS = Number(process.env.REACT_APP_SESSION_EXPIRY_WARNING_MS) || 60_000

export class AuthSync {

	private socket: MessageClientAdapter
	private onStateChange: StateUpdater
	private warningTimer: ReturnType<typeof setTimeout> | null = null
	private logoutTimer: ReturnType<typeof setTimeout> | null = null
	private refreshing = false

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
				}))
				break

			case "failure":
				this.onStateChange(prev => ({
					...prev,
					isLoading: false,
					loginRejected: true,
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

	constructor(socket: MessageClientAdapter, onStateChange: StateUpdater) {
		this.socket = socket
		this.onStateChange = onStateChange

		this.socket.on("login_response", this.handleLoginResponse)
		this.socket.on("authenticate_response", this.handleAuthenticateResponse)
		this.socket.on("register_response", this.handleRegisterResponse)

		this.socket.onReady(() => {
			this.socket.onReconnect(() => this.socket.send("authenticate", {}))
			this.socket.send("authenticate", {})
		})
	}

	login(email: string, password: string): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true, loginRejected: false }))
		this.socket.send("login", { email, password })
	}

	register(data: { password: string, firstname: string, lastname: string, email: string, phone: string }): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true }))
		this.socket.send("register", data)
	}

	async logout(): Promise<void> {
		try {
			await fetch(`${BACKEND_URL}${process.env.REACT_APP_BACKEND_API_PREFIX || ""}/auth/logout`, {
				method: "POST",
				credentials: "include",
			})
		} catch (error) {
			console.error("Logout request failed:", error)
		}

		this.clearExpiryTimer()
		this.onStateChange(prev => ({
			...prev,
			user: null,
			isAuthenticated: false,
			isLoading: false,
			expiresAt: null,
			showExpiryWarning: false,
		}))
	}

	async refreshSession(): Promise<void> {
		if (this.refreshing) return
		this.refreshing = true
		this.onStateChange(prev => ({ ...prev, isRefreshing: true }))

		try {
			const resp = await fetch(`${BACKEND_URL}${process.env.REACT_APP_BACKEND_API_PREFIX || ""}/auth/refresh`, {
				method: "POST",
				credentials: "include",
			})
			const data = await resp.json()

			if (data.status === "refreshed") {
				this.startExpiryTimer(data.expiresAt)
				this.onStateChange(prev => ({
					...prev,
					expiresAt: data.expiresAt,
					showExpiryWarning: false,
					isRefreshing: false,
				}))
			} else {
				this.expireSession()
				this.onStateChange(prev => ({ ...prev, isRefreshing: false }))
			}
		} catch (error) {
			console.error("Refresh request failed:", error)
			this.onStateChange(prev => ({ ...prev, isRefreshing: false }))
		} finally {
			this.refreshing = false
		}
	}

	destroy(): void {
		this.clearExpiryTimer()
		this.socket.off("login_response", this.handleLoginResponse)
		this.socket.off("authenticate_response", this.handleAuthenticateResponse)
		this.socket.off("register_response", this.handleRegisterResponse)
	}

	private startExpiryTimer(expiresAt: number): void {
		this.clearExpiryTimer()

		const logoutDelay = expiresAt - Date.now()
		if (logoutDelay <= 0) { this.expireSession(); return }

		const warningDelay = Math.max(0, logoutDelay - WARNING_MS)
		this.warningTimer = setTimeout(() => {
			this.onStateChange(prev => ({ ...prev, showExpiryWarning: true }))
		}, warningDelay)

		this.logoutTimer = setTimeout(() => this.expireSession(), logoutDelay)
	}

	private clearExpiryTimer(): void {
		if (this.warningTimer) { clearTimeout(this.warningTimer); this.warningTimer = null }
		if (this.logoutTimer) { clearTimeout(this.logoutTimer); this.logoutTimer = null }
	}

	private expireSession(): void {
		this.clearExpiryTimer()
		this.onStateChange(prev => ({
			...prev,
			user: null,
			isAuthenticated: false,
			isLoading: false,
			expiresAt: null,
			showExpiryWarning: false,
		}))
	}
}
