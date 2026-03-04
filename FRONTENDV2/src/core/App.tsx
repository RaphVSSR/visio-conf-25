import { AuthProvider } from 'contexts/AuthContext';
import { AdminPanel, Home, Login, Signup } from 'pages';
import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UserAuth } from 'routing/UserAuth';
import { AdminAuth } from 'routing/AdminAuth';
import { SessionExpiryModal, SessionPendingModal } from 'components/SessionExpiryModal';

/**
 * Composant racine de l'application.
 * Enveloppe l'app dans AuthProvider et définit les routes.
 */
export const App = () => {

	return (

		<AuthProvider>

			<BrowserRouter>

				<Routes>

					<Route element={ <UserAuth/> }>

						<Route path="/" element={ <Navigate to="/home" replace /> }/>
						<Route path="/home" element={ <Home /> }/>
						<Route element={ <AdminAuth /> }>
						<Route path='/admin' element={ <AdminPanel /> } />
					</Route>

					</Route>
					<Route path="/login" element={ <Login /> }/>
					<Route path='/signup' element={ <Signup /> } />

				</Routes>

			</BrowserRouter>

			<SessionExpiryModal />
			<SessionPendingModal />

		</AuthProvider>

	)
}
