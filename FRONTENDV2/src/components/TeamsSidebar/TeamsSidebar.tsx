
import { FC, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Users, Lock, Settings, Loader2 } from "lucide-react";
import { Team } from "pages/Teams/Teams.types";
import "./TeamsSidebar.scss";


export interface TeamsSidebarProps {
	teams: Team[];
	selectedTeam: Team | null;
	onSelectTeam: (team: Team) => void;
	onCreateTeam: () => void;
	onEditTeam: (team: Team) => void;
	isLoading: boolean;
}


export const TeamsSidebar: FC<TeamsSidebarProps> = ({
	teams,
	selectedTeam,
	onSelectTeam,
	onCreateTeam,
	onEditTeam,
	isLoading,
}) => {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredTeams = useMemo(() => {
		if (!searchQuery.trim()) return teams;
		const query = searchQuery.toLowerCase();
		return teams.filter((team) =>
			team.name.toLowerCase().includes(query)
		);
	}, [teams, searchQuery]);

	const isMember = (team: Team) => team.role === "admin" || team.role === "member";
	const isAdmin = (team: Team) => team.role === "admin";
	const getInitials = (name: string) =>
		name
			.split(" ")
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? "")
			.join("");

	return (
		<aside className="teams-sidebar">
			<div className="teams-sidebar__header">
				<h2 className="teams-sidebar__title">Mes équipes</h2>
				<button
					className="teams-sidebar__create-button"
					onClick={onCreateTeam}
					title="Créer une équipe"
				>
					<Plus size={18} />
				</button>
			</div>

			<div className="teams-sidebar__search">
				<Search size={16} className="teams-sidebar__search-icon" />
				<input
					type="text"
					className="teams-sidebar__search-input"
					placeholder="Rechercher une équipe..."
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.target.value)}
				/>
			</div>

			<div className="teams-sidebar__list">
				{isLoading ? (
					<div className="teams-sidebar__loading">
						<Loader2 size={24} className="teams-sidebar__spinner" />
						<span>Chargement...</span>
					</div>
				) : filteredTeams.length === 0 ? (
					<div className="teams-sidebar__empty">
						<Users size={32} />
						<span>
							{searchQuery ? "Aucun résultat" : "Aucune équipe"}
						</span>
					</div>
				) : (
					<AnimatePresence>
						{filteredTeams.map((team) => (
							<motion.button
								key={team.id}
								className={`teams-sidebar__item ${
									selectedTeam?.id === team.id ? "teams-sidebar__item--selected" : ""
								}`}
								onClick={() => onSelectTeam(team)}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								transition={{ duration: 0.15 }}
							>
								<div className="teams-sidebar__item-icon">
									{team.picture ? (
										<img src={team.picture} alt={team.name} className="teams-sidebar__item-avatar" />
									) : isMember(team) ? (
										getInitials(team.name) || <Users size={18} />
									) : (
										<Lock size={18} />
									)}
								</div>

								<div className="teams-sidebar__item-info">
									<span className="teams-sidebar__item-name">{team.name}</span>
									<div className="teams-sidebar__item-badges">
										{isAdmin(team) && (
											<span className="teams-sidebar__badge teams-sidebar__badge--admin">
												Admin
											</span>
										)}
										{!isMember(team) && (
											<span className="teams-sidebar__badge teams-sidebar__badge--locked">
												Non-membre
											</span>
										)}
									</div>
								</div>

								{isAdmin(team) && (
									<button
										className="teams-sidebar__settings-button"
										onClick={(event) => {
											event.stopPropagation();
											onEditTeam(team);
										}}
										title="Paramètres"
									>
										<Settings size={16} />
									</button>
								)}
							</motion.button>
						))}
					</AnimatePresence>
				)}
			</div>
		</aside>
	);
};
