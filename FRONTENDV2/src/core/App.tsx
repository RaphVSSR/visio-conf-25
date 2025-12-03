import { SessionContext } from 'contexts/SessionContext';
import { AdminPanel, Home, Login, Signup } from 'pages';
import React, { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { UserAuth } from 'routing/UserAuth';
import { useSession } from './AuthClient';

export const App = () => {

	const [theme, setTheme] = useState<"light" | "dark">("light");
	const [isLoading, setIsLoading]= useState<boolean>(true);
	const session = useSession();

	useEffect(() => {

		session.isPending === false && setIsLoading(false);

	}, [session])


	return (

		<SessionContext.Provider value={{currentUser: session, theme, setTheme, isLoading}}>

			<BrowserRouter>

				<Routes>

					<Route element={ <UserAuth/> }>

						<Route path="/" element={ <Home /> }/>
						<Route path="/home" element={ <Home /> }/>
						<Route path='/admin' element={ <AdminPanel /> } />
					
					</Route>
					<Route path="/login" element={ <Login /> }/>
					<Route path='/signup' element={ <Signup /> } />

				</Routes>

			</BrowserRouter>

		</SessionContext.Provider>

	)
}
