import { FC } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "hooks/useAuth";

export const AdminAuth: FC = () => {

	const { user } = useAuth();

	if (!user?.roles?.includes("admin")) {
		return <Navigate to="/home" replace />;
	}

	return <Outlet />;
}
