import React, { FC, useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  User as UserIcon,
  PhoneCall,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAudioCall } from "../../contexts/call/AudioCallContext";
import { Card } from "../../design-system/components/Card/Card";
import "./Directory.scss";

interface DirectoryUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  picture?: string;
  is_online: boolean;
  roles?: string[];
  desc?: string;
  job?: string;
  disturb_status?: string;
}

export const Directory: FC = () => {
  const { socket, user: currentUser } = useAuth();
  const { initiateCall } = useAudioCall();
  const navigate = useNavigate();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = useCallback(() => {
    if (!socket) return;
    
    setLoading(true);
    socket.send("contacts:list", { excludeEmail: currentUser?.email });
  }, [socket, currentUser?.email]);

  useEffect(() => {
    if (!socket) return;

    const handleContactsResponse = (data: DirectoryUser[]) => {
      setUsers(data);
      setLoading(false);
    };

    socket.on("contacts:list:response", handleContactsResponse);
    
    socket.onReady(fetchUsers);

    return () => {
      socket.off("contacts:list:response", handleContactsResponse);
    };
  }, [socket, fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) || 
             user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [users, searchTerm]);

  const getRoleBadgeClass = (roles?: string[]) => {
    if (!roles || roles.length === 0 || !roles[0]) return "badge-user";
    const label = roles[0].toLowerCase();
    if (label.includes("admin")) return "badge-admin";
    if (label.includes("etudiant")) return "badge-student";
    if (label.includes("enseignant")) return "badge-teacher";
    return "badge-user";
  };

  const getRoleLabel = (roles?: string[]) => {
    if (!roles || roles.length === 0 || !roles[0]) return "Membre";
    const label = roles[0];
    if (label.toLowerCase() === "admin") return "Administrateur";
    if (label.toLowerCase() === "user") return "Membre";
    return label;
  };

  const getAbstractColor = (id: string) => {
    const colors = ['#FF9A8B', '#FF6A88', '#FF99AC', '#8BC6EC', '#9599E2', '#00DBDE', '#FC00FF', '#00DEFF'];
    const index = parseInt(id.substring(0, 8), 16) % colors.length;
    return colors[index];
  };

  const handleCall = (user: DirectoryUser) => {
    initiateCall([{
      userId: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      picture: "default_profile_picture.png"
    }], "audio");
  };

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

        {/* Current User Profile Shortcut */}
        {currentUser && !searchTerm && (
          <section className="myProfileSection">
            <Card className="myProfileCard">
              <div className="profileIconLarge" style={{ background: getAbstractColor(currentUser._id || "me") }}>
                <UserIcon size={40} color="white" />
                <div className="onlineIndicator online" />
              </div>
              <div className="profileInfo">
                <div className="profileMeta">
                  <div className="nameWrapper">
                    <h2 className="profileName">{currentUser.firstname} {currentUser.lastname}</h2>
                    {currentUser.job && <span className="profileJob">{currentUser.job}</span>}
                  </div>
                  <span className={`roleBadge ${getRoleBadgeClass(currentUser.roles)}`}>
                    {getRoleLabel(currentUser.roles)} (Moi)
                  </span>
                </div>
                <p className="profileBio">{currentUser.desc || "Aucune description"}</p>
              </div>
              <button className="manageProfileBtn" onClick={() => navigate('/profile')}>Gérer mon profil</button>
            </Card>
          </section>
        )}

        {loading ? (
          <div className="loadingState">
            <p>Chargement de l'annuaire...</p>
          </div>
        ) : (
          <div className="usersGrid">
            <AnimatePresence>
              {filteredUsers.map((user) => (
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
                        <div className="nameWrapper">
                          <h3 className="userName">{user.firstname} {user.lastname}</h3>
                          {user.job && <span className="userJob">{user.job}</span>}
                        </div>
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

                    {user.desc && (
                      <div className="userBioPreview">
                        <p>{user.desc.length > 100 ? `${user.desc.substring(0, 100)}...` : user.desc}</p>
                      </div>
                    )}

                    <div className="cardFooter">
                      <span className={`roleBadge ${getRoleBadgeClass(user.roles)}`}>
                        {getRoleLabel(user.roles)}
                      </span>
                      <button 
                        className="callUserBtn" 
                        title={`Appeler ${user.firstname}`}
                        onClick={() => handleCall(user)}
                      >
                        <PhoneCall size={18} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredUsers.length === 0 && !loading && (
              <div className="emptyState">
                <Users size={48} strokeWidth={1.5} />
                <h3>Aucun membre trouvé</h3>
                <p>Essayez d'ajuster votre recherche ou vos filtres</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

