import { SessionContext } from 'contexts/SessionContext';
import { AdminPanel, Home, Login, Signup } from 'pages';
import React, { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { UserAuth } from 'routing/UserAuth';
import { useSession } from './AuthClient';

export const App = () => {

	const [theme, setTheme] = useState<"light" | "dark">("light");
	const currentUser = useSession();

	return (

		<SessionContext.Provider value={{currentUser, theme, setTheme}}>

			<BrowserRouter>

				<Routes>

					<Route path="/" element={ <UserAuth/> }/>
					<Route path="/home" element={ <Home /> }/>
					<Route path="/login" element={ <Login /> }/>
					<Route path='/signup' element={ <Signup /> } />
					<Route path='/admin' element={ <AdminPanel /> } />

				</Routes>

			</BrowserRouter>

		</SessionContext.Provider>

	)
}
