
import { FC } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import {
	NavigationSidebar,
	NAVIGATION_ITEMS,
	SIDEBAR_BRAND,
	type SidebarUserData,
} from "components/NavigationSidebar/NavigationSidebar";
import "./AuthenticatedLayout.scss";

export const AuthenticatedLayout: FC = () => {
	const { user, logout } = useAuth();

	const sidebarUserData: SidebarUserData = {
		firstname: user?.firstname ?? "",
		lastname: user?.lastname ?? "",
		roles: user?.roles ?? [],
	};

	return (
		<div id="authenticatedLayout">
			<NavigationSidebar
				items={NAVIGATION_ITEMS}
				{...SIDEBAR_BRAND}
				userData={sidebarUserData}
				onLogout={logout}
			/>
			<main id="authenticatedContent">
				<Outlet />
			</main>
		</div>
	);
};
