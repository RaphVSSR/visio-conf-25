import { ControllerService } from "Controller/Controller.service"
import type { Controller, ControllerMessage } from "Controller/Controller.types"
import { SocketIO } from "services/SocketIO"
import type { AuthState, PendingSessionRequest } from "./AuthService.types"

type StateUpdater = (updater: (prev: AuthState) => AuthState) => void


const MESSAGES_EMITTED = [
	"authenticate",
	"login",
	"register",
	"user_disconnect",
	"session_refresh",
	"session_pending_choice",
]

const MESSAGES_RECEIVED = [
	"auth_success",
	"auth_failure",
	"login_success",
	"login_failure",
	"login_pending",
	"registration_success",
	"registration_failure",
	"user_disconnect_success",
	"session_refreshed",
	"session_expired",
	"session_pending",
	"session_pending_accepted",
	"session_pending_rejected",
]

function getSessionId(): string | null {
	return sessionStorage.getItem(process.env.REACT_APP_SESSION_STORAGE_KEY!)
}

function setSessionId(value: string): void {
	sessionStorage.setItem(process.env.REACT_APP_SESSION_STORAGE_KEY!, value)
}

function clearSessionId(): void {
	sessionStorage.removeItem(process.env.REACT_APP_SESSION_STORAGE_KEY!)
}

export class AuthService extends ControllerService {

	private onStateChange: StateUpdater
	private expiryTimer: ReturnType<typeof setTimeout> | null = null

	constructor(controleur: Controller, onStateChange: StateUpdater) {
		super(controleur, "AuthService", MESSAGES_EMITTED, MESSAGES_RECEIVED)

		this.onStateChange = onStateChange

		const initialSessionId = getSessionId()

		if (initialSessionId) {

			SocketIO.onReady(() => {
				SocketIO.canal.socket.io.on("reconnect", () => this.reconnect())
				this.sendMessage({ authenticate: { sessionId: initialSessionId } })
			})

		} else {

			this.onStateChange(prev => ({ ...prev, isLoading: false }))
		}
	}

	traitementMessage(mesg: ControllerMessage): void {
		const action = Object.keys(mesg)[0]

		switch (action) {
			
			case "login_success": {
				const { user, expiresAt, sessionId } = mesg[action] as { user: AuthState["user"], expiresAt: number, sessionId: string }
				setSessionId(sessionId)
				this.startExpiryTimer(expiresAt)
				this.onStateChange(prev => ({
					...prev,
					user,
					isAuthenticated: true,
					isLoading: false,
					expiresAt,
					sessionId,
					pendingLoginRequestId: null,
				}))
				break
			}

			case "login_failure":
				clearSessionId()
				this.onStateChange(prev => ({
					...prev,
					isLoading: false,
					loginRejected: prev.pendingLoginRequestId !== null,
					pendingLoginRequestId: null,
				}))
				break

			case "login_pending": {
				const { requestId } = mesg[action] as { requestId: string }
				this.onStateChange(prev => ({
					...prev,
					isLoading: false,
					pendingLoginRequestId: requestId,
				}))
				break
			}

			case "auth_success": {
				const { user, expiresAt } = mesg[action] as { user: AuthState["user"], expiresAt: number }
				this.startExpiryTimer(expiresAt)
				this.onStateChange(prev => ({
					...prev,
					user,
					isAuthenticated: true,
					isLoading: false,
					expiresAt,
				}))
				break
			}

			case "auth_failure":
				clearSessionId()
				this.onStateChange(prev => ({
					...prev,
					user: null,
					isAuthenticated: false,
					isLoading: false,
					expiresAt: null,
					sessionId: null,
				}))
				break

			case "registration_success": {
				const { user, expiresAt, sessionId } = mesg[action] as { user: AuthState["user"], expiresAt: number, sessionId: string }
				setSessionId(sessionId)
				this.startExpiryTimer(expiresAt)
				this.onStateChange(prev => ({
					...prev,
					user,
					isAuthenticated: true,
					isLoading: false,
					expiresAt,
					sessionId,
				}))
				break
			}

			case "registration_failure":
				this.onStateChange(prev => ({
					...prev,
					isLoading: false,
				}))
				break

			case "user_disconnect_success":
				this.clearExpiryTimer()
				clearSessionId()
				this.onStateChange(prev => ({
					...prev,
					user: null,
					isAuthenticated: false,
					isLoading: false,
					expiresAt: null,
					sessionId: null,
					pendingSessionRequests: [],
					showExpiryWarning: false,
				}))
				break

			case "session_refreshed": {
				const { expiresAt } = mesg[action] as { expiresAt: number }
				this.onStateChange(prev => ({
					...prev,
					expiresAt,
					showExpiryWarning: false,
				}))
				this.startExpiryTimer(expiresAt)
				break
			}

			case "session_expired":
				this.clearExpiryTimer()
				clearSessionId()
				this.onStateChange(prev => ({
					...prev,
					user: null,
					isAuthenticated: false,
					isLoading: false,
					expiresAt: null,
					sessionId: null,
					showExpiryWarning: false,
				}))
				break

			case "session_pending": {
				const request = mesg[action] as PendingSessionRequest
				this.onStateChange(prev => ({
					...prev,
					pendingSessionRequests: [...prev.pendingSessionRequests, request],
				}))
				break
			}

			case "session_pending_accepted": {
				const { requestId } = mesg[action] as { requestId: string }
				this.onStateChange(prev => ({
					...prev,
					pendingSessionRequests: prev.pendingSessionRequests.filter(
						r => r.requestId !== requestId
					),
				}))
				break
			}

			case "session_pending_rejected": {
				const { requestId } = mesg[action] as { requestId: string }
				this.onStateChange(prev => ({
					...prev,
					pendingSessionRequests: prev.pendingSessionRequests.filter(
						r => r.requestId !== requestId
					),
				}))
				break
			}
		}
	}

	private reconnect(): void {
		const sessionId = getSessionId()
		if (sessionId) this.sendMessage({ authenticate: { sessionId } })
	}

	login(email: string, password: string): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true, loginRejected: false }))
		this.sendMessage({ login: { email, password, deviceInfo: navigator.userAgent } })
	}

	register(data: { password: string, firstname: string, lastname: string, email: string, phone: string }): void {
		this.onStateChange(prev => ({ ...prev, isLoading: true }))
		this.sendMessage({ register: data })
	}

	logout(): void {
		this.sendMessage({ user_disconnect: {} })
		clearSessionId()
	}

	refreshSession(): void {
		this.sendMessage({ session_refresh: {} })
	}

	respondToPendingSession(requestId: string, accepted: boolean): void {
		this.sendMessage({ session_pending_choice: { requestId, accepted } })
	}

	override destroy(): void {
		this.clearExpiryTimer()
		super.destroy()
	}

	private startExpiryTimer(expiresAt: number): void {
		this.clearExpiryTimer()

		this.expiryTimer = setTimeout(() => {
			this.onStateChange(prev => ({ ...prev, showExpiryWarning: true }))

			this.expiryTimer = setTimeout(() => {
				clearSessionId()
				this.onStateChange(prev => ({
					...prev,
					user: null,
					isAuthenticated: false,
					isLoading: false,
					expiresAt: null,
					sessionId: null,
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
