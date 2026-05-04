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
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Card } from "../../design-system/components/Card/Card";
import "./Directory.scss";

interface DirectoryUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  is_online: boolean;
  disturb_status: string;
  roles: any[];
}

export const Directory: FC = () => {
  const { socket, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!socket) return;

    const handleUserGet = (mesg: any) => {
      if (mesg.type === 'list' && mesg.etat) {
        setUsers(mesg.users);
      }
    };

    socket.on("user_get_response", handleUserGet);

    socket.onReady(() => {
        socket.send("user_get", { type: 'list' });
    });

    return () => {
      socket.off("user_get_response", handleUserGet);
    };
  }, [socket]);


  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) || 
             user.email.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [users, searchTerm]);

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

  const me = users.find(u => u.id === currentUser?._id);
  const others = filteredUsers.filter(u => u.id !== currentUser?._id);

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

        {/* My Profile Card (like in the example) */}
        {me && !searchTerm && (
          <section className="myProfileSection">
            <Card className="myProfileCard">
              <div className="profileIconLarge" style={{ background: getAbstractColor(me.id) }}>
                <UserIcon size={40} color="white" />
              </div>
              <div className="profileInfo">
                <div className="profileMeta">
                  <h2 className="profileName">{me.firstname} {me.lastname}</h2>
                  <span className={`roleBadge ${getRoleBadgeClass(typeof me.roles?.[0] === 'string' ? me.roles[0] : (me.roles?.[0]?.label || "Utilisateur"))}`}>
                    {typeof me.roles?.[0] === 'string' ? me.roles[0] : (me.roles?.[0]?.label || "Utilisateur")}
                  </span>
                </div>
                <p className="profileBio">Salut c'est moi</p>
              </div>
              <button className="manageProfileBtn" onClick={() => navigate('/profile')}>Gérer mon profil</button>
            </Card>
          </section>
        )}

        <div className="usersGrid">
          <AnimatePresence>
            {others.map((user) => (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="userCard">
                  <div className="cardHeader">
                    <div className="userIconSmall" style={{ background: getAbstractColor(user.id) }}>
                       <UserIcon size={24} color="white" />
                       <div className={`statusDot ${user.is_online ? 'online' : 'offline'}`} />
                    </div>
                    <div className="userBasic">
                      <h3 className="userName">{user.firstname} {user.lastname}</h3>
                      <div className="cardDetails">
                        <div className="detailItem">
                          <Mail size={14} /> <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="detailItem">
                            <Phone size={14} /> <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="cardFooter">
                    <span className={`roleBadge ${getRoleBadgeClass(typeof user.roles?.[0] === 'string' ? user.roles[0] : (user.roles?.[0]?.label || "Utilisateur"))}`}>
                      {typeof user.roles?.[0] === 'string' ? user.roles[0] : (user.roles?.[0]?.label || "Utilisateur")}
                    </span>
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
