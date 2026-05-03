import React, { FC, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Mail, 
  Phone, 
  User as UserIcon,
  Circle
} from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { Card } from "../../design-system/components/Card/Card";
import "./Directory.scss";

interface DirectoryUser {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  is_online: boolean;
  disturb_status: string;
  roles: any[];
}

export const Directory: FC = () => {
  const { controleur, isReady } = useSocket();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tous");
  const comp = "Directory";

  useEffect(() => {
    if (!controleur || !isReady) return;

    const handleMessage = (mesg: any) => {
      if (mesg.directory && mesg.directory.success) {
        setUsers(mesg.directory.users);
      }
    };

    controleur.inscription(comp, [], ['directory']);
    controleur.setcallback(comp, handleMessage);

    // Demander la liste des utilisateurs
    controleur.envoie(comp, { get_directory: true });

    return () => {
      controleur.desinscription(comp);
    };
  }, [controleur, isReady]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeFilter === "Tous") return matchesSearch;
      
      const roleLabel = user.roles?.[0]?.label || "Utilisateur";
      if (activeFilter === "Admins") return matchesSearch && roleLabel.toLowerCase().includes("admin");
      if (activeFilter === "Étudiants") return matchesSearch && roleLabel.toLowerCase().includes("etudiant");
      if (activeFilter === "Enseignants") return matchesSearch && roleLabel.toLowerCase().includes("enseignant");
      
      return matchesSearch;
    });
  }, [users, searchTerm, activeFilter]);

  const getRoleBadgeClass = (roleLabel: string) => {
    const label = roleLabel.toLowerCase();
    if (label.includes("admin")) return "badge-admin";
    if (label.includes("etudiant")) return "badge-student";
    if (label.includes("enseignant")) return "badge-teacher";
    return "badge-user";
  };

  const getAbstractColor = (id: string) => {
    const colors = ['#FF9A8B', '#FF6A88', '#FF99AC', '#8BC6EC', '#9599E2', '#00DBDE', '#FC00FF', '#00DEFF'];
    const index = parseInt(id.substring(0, 8), 16) % colors.length;
    return colors[index];
  };

  const me = users.find(u => u._id === currentUser?._id);
  const others = filteredUsers.filter(u => u._id !== currentUser?._id);

  const filters = ["Tous", "Étudiants", "Enseignants", "Admins"];

  return (
    <div id="directoryPage">
      <div className="directoryContainer">
        <header className="pageHeader">
          <div className="headerLeft">
            <h1 className="pageTitle">Annuaire</h1>
            <p className="memberCount">{users.length} membres trouvés</p>
          </div>

          <div className="searchWrapper">
            <Search className="searchIcon" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un membre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="filterTabs">
          {filters.map(filter => (
            <button 
              key={filter}
              className={`filterTab ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* My Profile Card (like in the example) */}
        {me && activeFilter === "Tous" && !searchTerm && (
          <section className="myProfileSection">
            <Card className="myProfileCard">
              <div className="profileIconLarge" style={{ background: getAbstractColor(me._id) }}>
                <UserIcon size={40} color="white" />
              </div>
              <div className="profileInfo">
                <div className="profileMeta">
                  <h2 className="profileName">{me.firstname} {me.lastname}</h2>
                  <span className={`roleBadge ${getRoleBadgeClass(me.roles?.[0]?.label || "Utilisateur")}`}>
                    {me.roles?.[0]?.label || "Utilisateur"}
                  </span>
                </div>
                <p className="profileBio">Salut c'est moi</p>
              </div>
              <button className="manageProfileBtn">Gérer mon profil</button>
            </Card>
          </section>
        )}

        <div className="usersGrid">
          <AnimatePresence>
            {others.map((user) => (
              <motion.div
                key={user._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="userCard">
                  <div className="cardHeader">
                    <div className="userIconSmall" style={{ background: getAbstractColor(user._id) }}>
                       <UserIcon size={24} color="white" />
                       <div className={`statusDot ${user.is_online ? 'online' : 'offline'}`} />
                    </div>
                    <div className="userBasic">
                      <h3 className="userName">{user.firstname} {user.lastname}</h3>
                      <span className="userEmail">{user.email}</span>
                    </div>
                  </div>

                  <div className="cardFooter">
                    <span className={`roleBadge ${getRoleBadgeClass(user.roles?.[0]?.label || "Utilisateur")}`}>
                      {user.roles?.[0]?.label || "Utilisateur"}
                    </span>
                    <button className="useProfileBtn">Utiliser ce profil</button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {others.length === 0 && (
            <div className="emptyState">
              <Users size={48} strokeWidth={1.5} />
              <h3>Aucun membre trouvé</h3>
              <p>Essayez d'ajuster votre recherche ou vos filtres</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
