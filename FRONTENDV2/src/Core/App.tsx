import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom';
import { AdminPanel, Home, Login, Signup, TeamsPage, Files, Directory, Profile, ChatPage } from 'pages';
import { AdminAuth } from 'routing/AdminAuth';
import { AuthToasts } from 'components/AuthToasts/AuthToasts';
import { AuthenticatedLayout } from 'components/AuthenticatedLayout/AuthenticatedLayout';
import { ToastProvider } from 'contexts/ToastContext';
import { useAuth } from 'hooks/useAuth';

export const App = () => {

	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) return <h1>Chargement du bundle...</h1>;

	return (
		<ToastProvider>

			<BrowserRouter>

				<Routes>

					<Route element={ isAuthenticated ? <AuthenticatedLayout/> : <Navigate to="/login" replace/> }>

						<Route path="/" element={ <Navigate to="/home" replace /> }/>
						<Route path="/home" element={ <Home /> }/>
						<Route path="/discussions" element={ <ChatPage /> }/>
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
	)
}
