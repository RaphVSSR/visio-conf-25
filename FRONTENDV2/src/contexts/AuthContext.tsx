import React, { createContext, useEffect, useState, useRef, type FC, type PropsWithChildren } from "react"
import { AuthSync } from "services/auth/AuthSync"
import type { AuthState, AuthContextType } from "services/auth/AuthSync.types"

export type { AuthState, AuthActions, AuthContextType } from "services/auth/AuthSync.types"
export type { User } from "types/User"

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {

	const [state, setState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
		isRefreshing: false,
		expiresAt: null,
		showExpiryWarning: false,
		loginRejected: false,
	})

	const authRef = useRef<AuthSync | null>(null)

	useEffect(() => {
		const authSync = new AuthSync(setState)
		authRef.current = authSync
		return () => {
			authSync.destroy()
			authRef.current = null
		}
	}, [])

	const contextValue: AuthContextType = {
		...state,
		login: (email, password) => authRef.current?.login(email, password),
		register: (data) => authRef.current?.register(data),
		logout: () => authRef.current?.logout(),
		refreshSession: () => authRef.current?.refreshSession(),
		dismissExpiryWarning: () => setState(prev => ({ ...prev, showExpiryWarning: false })),
	}

	return (
		<AuthContext.Provider value={contextValue}>
			{children}
		</AuthContext.Provider>
	)
}
