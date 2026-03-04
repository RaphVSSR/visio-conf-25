import { FC } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "hooks/useAuth";

/**
 * Garde de route pour les pages admin.
 * Redirige vers /home si l'utilisateur n'a pas le rôle admin.
 * Doit être imbriqué dans UserAuth (l'auth est déjà vérifiée).
 */
export const AdminAuth: FC = () => {

	const { user } = useAuth();

	if (!user?.roles?.includes("admin")) {
		return <Navigate to="/home" replace />;
	}

	return <Outlet />;
}
