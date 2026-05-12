import Controleur from "Controller/controleur.js"
import CanalSocketio from "Controller/canalsocketio.js"
import type { AuthState } from "./AuthSync.types"

type StateUpdater = (updater: (prev: AuthState) => AuthState) => void

const BACKEND_URL = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:3220"
const API_PREFIX = process.env.REACT_APP_BACKEND_API_PREFIX || ""
const WARNING_MS = Number(process.env.REACT_APP_SESSION_EXPIRY_WARNING_MS) || 60_000

export class AuthSync {

	readonly nomDInstance = "AuthSync"

	private static readonly listMessageEmission = ["login", "register", "authenticate"]
	private static readonly listMessageReception = ["login_response", "register_response", "authenticate_response"]

	private controleur: Controleur
	private canal: CanalSocketio
	private onStateChange: StateUpdater
	private warningTimer: ReturnType<typeof setTimeout> | null = null
	private logoutTimer: ReturnType<typeof setTimeout> | null = null
	private refreshing = false

	constructor(onStateChange: StateUpdater) {
		this.controleur = new Controleur()
		this.canal = new CanalSocketio(this.controleur, "canalsocketio")
		this.onStateChange = onStateChange

		this.controleur.inscription(this, AuthSync.listMessageEmission, AuthSync.listMessageReception)
		this.canal.socket.on("donne_liste", () => this.send("authenticate", {}))
	}

	traitementMessage(mesg: Record<string, any>): void {
		for (const key of Object.keys(mesg)) {
			switch (key) {
				case "login_response":        this.handleLoginResponse(mesg[key]); break
				case "register_response":     this.handleRegisterResponse(mesg[key]); break
				case "authenticate_response": this.handleAuthenticateResponse(mesg[key]); break
			}
		}
	}

	login(email: string, password: string): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true, loginRejected: false }))
		this.send("login", { email, password })
	}

	register(data: { password: string, firstname: string, lastname: string, email: string, phone: string }): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true }))
		this.send("register", data)
	}

	async logout(): Promise<void> {
		try {
			await fetch(`${BACKEND_URL}${API_PREFIX}/auth/logout`, { method: "POST", credentials: "include" })
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
			const resp = await fetch(`${BACKEND_URL}${API_PREFIX}/auth/refresh`, { method: "POST", credentials: "include" })
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
		this.canal.socket.disconnect()
	}

	private send(name: string, payload: unknown): void {
		this.controleur.envoie(this, { [name]: payload })
	}

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
				this.onStateChange(prev => ({ ...prev, isLoading: false, loginRejected: true }))
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
				this.onStateChange(prev => ({ ...prev, isLoading: false }))
				break
		}
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
