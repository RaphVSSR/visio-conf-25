import React, { createContext, useEffect, useState, useRef, type FC, type PropsWithChildren } from "react"
import Controleur from "Controller/controleur.js"
import { SocketIO } from "services/SocketIO"
import { AuthService } from "services/auth/AuthService"
import type { AuthState, AuthContextType } from "services/auth/AuthService.types"

export type { AuthUser, PendingSessionRequest, AuthState, AuthActions, AuthContextType } from "services/auth/AuthService.types"

export const AuthContext = createContext<AuthContextType | null>(null)

const INITIAL_STATE: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true,
	expiresAt: null,
	sessionId: null,
	pendingLoginRequestId: null,
	pendingSessionRequests: [],
	showExpiryWarning: false,
	loginRejected: false,
}

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {

	const [state, setState] = useState<AuthState>(INITIAL_STATE)
	const authRef = useRef<AuthService | null>(null)

	useEffect(() => {
		const controleur = new Controleur()
		controleur.verboseall = process.env.REACT_APP_VERBOSE === "true" && Number(process.env.REACT_APP_VERBOSE_LVL) >= 3

		SocketIO.init(controleur)
		authRef.current = new AuthService(controleur, setState)

		return () => {
			authRef.current?.destroy()
			authRef.current = null
			SocketIO.disconnect()
		}
	}, [])

	const contextValue: AuthContextType = {
		...state,
		login: (email, password) => authRef.current?.login(email, password),
		register: (data) => authRef.current?.register(data),
		logout: () => authRef.current?.logout(),
		refreshSession: () => authRef.current?.refreshSession(),
		respondToPendingSession: (requestId, accepted) => authRef.current?.respondToPendingSession(requestId, accepted),
		dismissExpiryWarning: () => setState(prev => ({ ...prev, showExpiryWarning: false })),
	}

	return (
		<AuthContext.Provider value={contextValue}>
			{children}
		</AuthContext.Provider>
	)
}
