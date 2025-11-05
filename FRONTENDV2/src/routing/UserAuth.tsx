import { FC } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "hooks/useAuth";

/**
 * Garde de route pour les pages protégées.
 * Redirige vers /login si l'utilisateur n'est pas authentifié.
 * Affiche un écran de chargement pendant la vérification.
 */
export const UserAuth: FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <h1>Chargement du bundle...</h1>;

  if (!isAuthenticated) return <Navigate to={"/login"} replace />;

  return <Outlet />;
};
