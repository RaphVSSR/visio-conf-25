
import { FC, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, type icons } from "lucide-react";
import { LucideIcons } from "design-system/components";
import "./NavigationSidebar.scss";


// ─── Types ───────────────────────────────────────────────

export interface NavigationItem {
	label: string;
	path: string;
	icon: keyof typeof icons;
	requiresRole?: string;
}

export interface SidebarUserData {
	firstname: string;
	lastname: string;
	roles: string[];
}

export interface NavigationSidebarProps {
	items: NavigationItem[];
	logoSource: string;
	logoAltText: string;
	brandLabel: string;
	userData: SidebarUserData;
	onLogout: () => void;
}


// ─── Configuration ───────────────────────────────────────

export const NAVIGATION_ITEMS: NavigationItem[] = [
	{ label: "Discussions", path: "/discussions", icon: "MessageSquare" },
	{ label: "Equipes",     path: "/equipes",     icon: "Users" },
	{ label: "Drive",       path: "/drive",       icon: "FolderOpen" },
	{ label: "Annuaire",    path: "/annuaire",    icon: "BookOpen" },
	{ label: "Admin",       path: "/admin",       icon: "UserRoundCog", requiresRole: "admin" },
];

export const SIDEBAR_BRAND = {
	logoSource: "/logos/logo_univ_grand.svg",
	logoAltText: "Logo Université de Toulon",
	brandLabel: "Université de Toulon",
} as const;


// ─── Component ───────────────────────────────────────────

export const NavigationSidebar: FC<NavigationSidebarProps> = ({
	items,
	logoSource,
	logoAltText,
	brandLabel,
	userData,
	onLogout,
}) => {
	const [expanded, setExpanded] = useState(false);

	const visibleItems = items.filter((item) =>
		!item.requiresRole || userData.roles.includes(item.requiresRole)
	);

	return (
		<motion.nav
			id="navigationSidebar"
			className={expanded ? "sidebarExpanded" : "sidebarCollapsed"}
			onMouseEnter={() => setExpanded(true)}
			onMouseLeave={() => setExpanded(false)}
			initial={{ x: -20, opacity: 0 }}
			animate={{ x: 0, opacity: 1 }}
			transition={{ duration: 0.35 }}
		>
			<div id="sidebarBrand">
				<NavLink to="/home" id="brandLink">
					<img
						src={logoSource}
						alt={logoAltText}
						id="brandLogo"
					/>
					<span className={`brandText ${expanded ? "" : "hiddenText"}`}>
						{brandLabel}
					</span>
				</NavLink>
			</div>

			<ul id="sidebarNavItems">
				{visibleItems.map((item: NavigationItem) => (
					<li key={item.path}>
						<NavLink
							to={item.path}
							className={({ isActive }) =>
								`navItem ${isActive ? "navItemActive" : ""}`
							}
						>
							<span className="navItemIcon">
								<LucideIcons name={item.icon} size={22} />
							</span>
							<span className={`navItemLabel ${expanded ? "" : "hiddenText"}`}>
								{item.label}
							</span>
						</NavLink>
					</li>
				))}
			</ul>

			<div id="sidebarFooter">
				<div id="sidebarUserInfo">
					<div id="userAvatar">
						{userData.firstname.charAt(0)}{userData.lastname.charAt(0)}
					</div>
					<span className={`userFullName ${expanded ? "" : "hiddenText"}`}>
						{userData.firstname} {userData.lastname}
					</span>
				</div>
				<button
					id="sidebarLogoutButton"
					onClick={onLogout}
					title="Déconnexion"
				>
					<LogOut size={18} />
				</button>
			</div>
		</motion.nav>
	);
};
