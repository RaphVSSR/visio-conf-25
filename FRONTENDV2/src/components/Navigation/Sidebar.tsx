import React, { FC } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Files, 
  Settings, 
  LogOut,
  ChevronRight,
  User as UserIcon
} from "lucide-react";
import "./Sidebar.scss";
import { useAuth } from "hooks/useAuth";

export const Sidebar: FC = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/home", icon: <LayoutDashboard size={20} /> },
    { name: "Annuaire", path: "/directory", icon: <Users size={20} /> },
    { name: "Fichiers", path: "/files", icon: <Files size={20} /> },
  ];

  return (
    <motion.aside 
      id="mainSidebar"
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="sidebarLogo">
        <div className="logoIcon">V</div>
        <span className="logoText">Visio<span>Conf</span></span>
      </div>

      <nav className="sidebarNav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `navItem ${isActive ? 'active' : ''}`}
          >
            <div className="itemIcon">{item.icon}</div>
            <span className="itemName">{item.name}</span>
            <ChevronRight className="itemArrow" size={14} />
          </NavLink>
        ))}
      </nav>

      <div className="sidebarFooter">
        <div className="userProfile">
          <div className="userAvatar">
            <UserIcon size={20} />
          </div>
          <div className="userInfo">
            <span className="userName">{user?.firstname} {user?.lastname}</span>
            <span className="userRole">{user?.roles?.[0]?.label || (user?.roles?.[0] === '69f7b60fa6342ec024f615df' ? "Admin" : "Membre")}</span>
          </div>
        </div>
        
        <button className="logoutBtn" onClick={logout}>
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </motion.aside>
  );
};
