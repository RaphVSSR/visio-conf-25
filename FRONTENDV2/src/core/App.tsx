import { AuthProvider } from 'contexts/AuthContext';
import { AdminPanel, Home, Login, Signup } from 'pages';
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
