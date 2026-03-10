import { FC } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import { AuthenticatedLayout } from "components/AuthenticatedLayout/AuthenticatedLayout";

export const UserAuth: FC = () => {

	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) return <h1>Chargement du bundle...</h1>;

	if (!isAuthenticated) return <Navigate to={"/login"} replace />;

	return <AuthenticatedLayout />;
}
