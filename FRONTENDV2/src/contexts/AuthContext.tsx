import React, { createContext, useEffect, useState, useRef, useCallback, type FC, type ReactNode } from "react"
import Controleur from "core/controleur.js"
import CanalSocketio from "core/canalsocketio.js"

/**
 * Type représentant un utilisateur authentifié.
 */
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

/**
 * Type représentant une demande d'approbation de session en attente.
 */
export type PendingSessionRequest = {
	requestId: string,
	deviceInfo: string,
	requesterInfo: string,
}

/**
 * État du contexte d'authentification.
 */
export type AuthState = {
	user: AuthUser | null,
	isAuthenticated: boolean,
	isLoading: boolean,
	expiresAt: number | null,
	token: string | null,
	pendingLoginRequestId: string | null,
	pendingSessionRequests: PendingSessionRequest[],
	showExpiryWarning: boolean,
}

/**
 * Actions exposées par le contexte d'authentification.
 */
export type AuthActions = {
	login: (email: string, password: string) => void,
	register: (data: { password: string, firstname: string, lastname: string, email: string, phone: string }) => void,
	logout: () => void,
	refreshSession: () => void,
	respondToPendingSession: (requestId: string, accepted: boolean) => void,
	dismissExpiryWarning: () => void,
}

export type AuthContextType = AuthState & AuthActions

/**
 * Contexte React pour l'authentification.
 * Fournit l'état auth et les actions (login, register, logout, etc.) à toute l'app.
 */
export const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Délai avant expiration pour afficher la modale d'avertissement (30 minutes en ms).
 */
const EXPIRY_WARNING_DELAY_MS = 30 * 60 * 1000
const COOKIE_NAME = "visioconf_token"

/**
 * Lit la valeur d'un cookie par son nom.
 */
function getCookie(name: string): string | null {
	const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
	return match?.[1] ? decodeURIComponent(match[1]) : null
}

/**
 * Écrit un cookie avec expiration à 24h et SameSite strict.
 */
function setCookie(name: string, value: string) {
	document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=86400; SameSite=Strict`
}

/**
 * Supprime un cookie en le faisant expirer immédiatement.
 */
function deleteCookie(name: string) {
	document.cookie = `${name}=; path=/; max-age=0`
}

/**
 * Provider d'authentification.
 * Initialise le contrôleur et le canal Socket.io, s'inscrit aux messages auth,
 * et gère le cycle de vie de la session.
 */
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {

	const [state, setState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
		expiresAt: null,
		token: getCookie(COOKIE_NAME),
		pendingLoginRequestId: null,
		pendingSessionRequests: [],
		showExpiryWarning: false,
	})

	const controleurRef = useRef<any>(null)
	const authBridgeRef = useRef<any>(null)
	const canalRef = useRef<any>(null)
	const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const authPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

	/**
	 * Démarre le timer local d'avertissement d'expiration.
	 * Déclenche l'affichage de la modale 30 minutes avant l'expiration.
	 */
	const startExpiryTimer = useCallback((expiresAt: number) => {

		if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)

		const timeUntilWarning = expiresAt - Date.now() - EXPIRY_WARNING_DELAY_MS
		if (timeUntilWarning <= 0) {
			setState(prev => ({ ...prev, showExpiryWarning: true }))
			return
		}

		expiryTimerRef.current = setTimeout(() => {
			setState(prev => ({ ...prev, showExpiryWarning: true }))
		}, timeUntilWarning)
	}, [])

	useEffect(() => {

		const controleur = new Controleur()
		controleur.verboseall = process.env.REACT_APP_VERBOSE === "true" && Number(process.env.REACT_APP_VERBOSE_LVL) >= 3
		controleurRef.current = controleur

		/**
		 * Bridge entre le contrôleur et le contexte React.
		 * S'inscrit aux messages auth et dispatche vers le state React.
		 */
		const authBridge = {
			nomDInstance: "AuthContext",

			traitementMessage(mesg: any) {

				if (mesg.login_success) {
					const { user, expiresAt, token } = mesg.login_success
					setState(prev => ({
						...prev,
						user,
						isAuthenticated: true,
						isLoading: false,
						expiresAt,
						token,
						pendingLoginRequestId: null,
						showExpiryWarning: false,
					}))
					startExpiryTimer(expiresAt)
				}
				else if (mesg.login_failure) {
					setState(prev => ({
						...prev,
						isLoading: false,
						pendingLoginRequestId: null,
					}))
				}
				else if (mesg.login_pending) {
					setState(prev => ({
						...prev,
						isLoading: false,
						pendingLoginRequestId: mesg.login_pending.requestId,
					}))
				}
				else if (mesg.auth_success) {
					const { user, expiresAt } = mesg.auth_success
					setState(prev => ({
						...prev,
						user,
						isAuthenticated: true,
						isLoading: false,
						expiresAt,
						showExpiryWarning: false,
					}))
					startExpiryTimer(expiresAt)
				}
				else if (mesg.auth_failure) {
					setState(prev => ({
						...prev,
						user: null,
						isAuthenticated: false,
						isLoading: false,
						expiresAt: null,
						token: null,
					}))
				}
				else if (mesg.registration_success) {
					const { user, expiresAt, token } = mesg.registration_success
					setState(prev => ({
						...prev,
						user,
						isAuthenticated: true,
						isLoading: false,
						expiresAt,
						token,
						showExpiryWarning: false,
					}))
					startExpiryTimer(expiresAt)
				}
				else if (mesg.registration_failure) {
					setState(prev => ({
						...prev,
						isLoading: false,
					}))
				}
				else if (mesg.user_disconnect_success) {
					if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
					setState(prev => ({
						...prev,
						user: null,
						isAuthenticated: false,
						isLoading: false,
						expiresAt: null,
						token: null,
						pendingSessionRequests: [],
						showExpiryWarning: false,
					}))
				}
				else if (mesg.session_refreshed) {
					const { expiresAt, token } = mesg.session_refreshed
					setState(prev => ({
						...prev,
						expiresAt,
						token: token || prev.token,
						showExpiryWarning: false,
					}))
					startExpiryTimer(expiresAt)
				}
				else if (mesg.session_expired) {
					if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
					setState(prev => ({
						...prev,
						user: null,
						isAuthenticated: false,
						isLoading: false,
						expiresAt: null,
						token: null,
						showExpiryWarning: false,
					}))
				}
				else if (mesg.session_pending) {
					const request: PendingSessionRequest = mesg.session_pending
					setState(prev => ({
						...prev,
						pendingSessionRequests: [...prev.pendingSessionRequests, request],
					}))
				}
				else if (mesg.session_pending_accepted) {
					setState(prev => ({
						...prev,
						pendingSessionRequests: prev.pendingSessionRequests.filter(
							r => r.requestId !== mesg.session_pending_accepted.requestId
						),
					}))
				}
				else if (mesg.session_pending_rejected) {
					setState(prev => ({
						...prev,
						pendingSessionRequests: prev.pendingSessionRequests.filter(
							r => r.requestId !== mesg.session_pending_rejected.requestId
						),
					}))
				}
				}
		}

		authBridgeRef.current = authBridge

		// Messages que AuthContext émet (client → server)
		const messagesEmis = [
			"authenticate",
			"login",
			"register",
			"user_disconnect",
			"session_refresh",
			"session_pending_choice",
		]

		// Messages auxquels AuthContext s'abonne (server → client)
		const messagesRecus = [
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

		controleur.inscription(authBridge, messagesEmis, messagesRecus)

		// Initialise le canal Socket.io
		const canal = new CanalSocketio(controleur, "canalsocketio")
		canalRef.current = canal

		// Auto-authentification : attend que le canal soit inscrit (donne_liste reçu)
		// avant d'envoyer le message, car le transport doit être prêt.
		const storedToken = getCookie(COOKIE_NAME)
		if (storedToken) {
			authPollRef.current = setInterval(() => {
				if (canal.listeDesMessagesEmis) {
					clearInterval(authPollRef.current!)
					authPollRef.current = null
					controleur.envoie(authBridge, { authenticate: { token: storedToken } })
				}
			}, 50)
		} else {
			setState(prev => ({ ...prev, isLoading: false }))
		}

		// Nettoyage : libère toutes les ressources allouées
		return () => {
			if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
			if (authPollRef.current) clearInterval(authPollRef.current)
			controleur.desincription(authBridge, messagesEmis, messagesRecus)
			canal.socket.disconnect()
		}
	}, [startExpiryTimer])

	// Persiste le token dans un cookie
	useEffect(() => {
		if (state.token) {
			setCookie(COOKIE_NAME, state.token)
		} else if (!state.isLoading) {
			deleteCookie(COOKIE_NAME)
		}
	}, [state.token, state.isLoading])

	/**
	 * Envoie un message via le contrôleur.
	 */
	const sendMessage = useCallback((message: Record<string, any>) => {
		if (controleurRef.current && authBridgeRef.current) {
			controleurRef.current.envoie(authBridgeRef.current, message)
		}
	}, [])

	const actions: AuthActions = {
		login: useCallback((email: string, password: string) => {
			setState(prev => ({ ...prev, isLoading: true }))
			sendMessage({ login: { email, password, deviceInfo: navigator.userAgent } })
		}, [sendMessage]),

		register: useCallback((data: { password: string, firstname: string, lastname: string, email: string, phone: string }) => {
			setState(prev => ({ ...prev, isLoading: true }))
			sendMessage({ register: data })
		}, [sendMessage]),

		logout: useCallback(() => {
			sendMessage({ user_disconnect: {} })
			deleteCookie(COOKIE_NAME)
		}, [sendMessage]),

		refreshSession: useCallback(() => {
			sendMessage({ session_refresh: {} })
		}, [sendMessage]),

		respondToPendingSession: useCallback((requestId: string, accepted: boolean) => {
			sendMessage({ session_pending_choice: { requestId, accepted } })
		}, [sendMessage]),

		dismissExpiryWarning: useCallback(() => {
			setState(prev => ({ ...prev, showExpiryWarning: false }))
		}, []),
	}

	const contextValue: AuthContextType = {
		...state,
		...actions,
	}

	return (
		<AuthContext.Provider value={contextValue}>
			{children}
		</AuthContext.Provider>
	)
}
