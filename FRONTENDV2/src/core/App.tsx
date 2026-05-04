import { AuthProvider } from 'contexts/AuthContext';
import { AdminPanel, Home, Login, Signup, TeamsPage, Files, Directory, Profile } from 'pages';
import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UserAuth } from 'routing/UserAuth';
import { AdminAuth } from 'routing/AdminAuth';
import { AuthToasts } from 'components/AuthToasts/AuthToasts';
import { ToastProvider } from 'contexts/ToastContext';

export const App = () => {

	return (

		<AuthProvider>
			<ToastProvider>

				<BrowserRouter>

					<Routes>

						<Route element={ <UserAuth/> }>

							<Route path="/" element={ <Navigate to="/home" replace /> }/>
							<Route path="/home" element={ <Home /> }/>
							<Route path="/discussions" element={ <Home /> }/>
							<Route path="/equipes" element={ <TeamsPage /> }/>
							<Route path="/drive" element={ <Files /> }/>
							<Route path="/files" element={ <Files /> }/>
							<Route path="/directory" element={ <Directory /> }/>
							<Route path="/annuaire" element={ <Directory /> }/>
							<Route path="/profile" element={ <Profile /> }/>

							<Route element={ <AdminAuth /> }>
								<Route path='/admin' element={ <AdminPanel /> } />
							</Route>

						</Route>
						<Route path="/login" element={ <Login /> }/>
						<Route path='/signup' element={ <Signup /> } />

					</Routes>

				</BrowserRouter>

				<AuthToasts />

			</ToastProvider>
		</AuthProvider>

	)
}
