import React, { FC, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Mail, Phone, ShieldCheck } from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import { Card, SearchBar } from "design-system/components";
import "./Directory.scss";

export const Directory: FC = () => {
  const { controleur, isReady } = useSocket();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!controleur || !isReady) return;

    const comp = {
      nomDInstance: "DirectoryPage",
      traitementMessage: (msg: any) => {
        if (msg.directory) {
          if (msg.directory.success) {
            setUsers(msg.directory.users);
          }
        }
      }
    };

    const sentMessages = ['get_directory'];
    const returnedMessages = ['directory'];

    controleur.inscription(comp, sentMessages, returnedMessages);
    controleur.envoie(comp, { get_directory: true });

    return () => {
      controleur.desincription(comp, sentMessages, returnedMessages);
    };
  }, [controleur, isReady]);

  const filteredUsers = users.filter(user => 
    `${user.firstname} ${user.lastname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.section 
      id="directoryPage"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="pageHeader">
        <div className="headerInfo">
          <h1 className="pageTitle">
            <Users size={24} /> Annuaire des membres
          </h1>
          <p className="pageSubtitle">Retrouvez et contactez vos collaborateurs</p>
        </div>
        
        <div className="headerActions">
           <div className="searchWrapper">
              <Search className="searchIcon" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un membre..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>
      </header>

      <div className="usersGrid">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <motion.div 
              key={user._id}
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="userCard">
                <div className="userCardMain">
                  <div className={`statusIndicator ${user.is_online ? 'online' : 'offline'}`} />
                  <div className="userBasicInfo">
                    <h3 className="userName">{user.firstname} {user.lastname}</h3>
                    <span className="userRoleLabel">
                       <ShieldCheck size={14} /> {user.roles?.[0]?.label || "Utilisateur"}
                    </span>
                  </div>
                </div>

                <div className="userCardDetails">
                  <div className="detailItem">
                    <Mail size={16} />
                    <span>{user.email}</span>
                  </div>
                  <div className="detailItem">
                    <Phone size={16} />
                    <span>{user.phone || "Non renseigné"}</span>
                  </div>
                </div>

              </Card>
            </motion.div>
          ))
        ) : (
          <div className="emptyState">
            <Users size={48} />
            <h3>Aucun membre trouvé</h3>
            <p>Essayez d'ajuster votre recherche</p>
          </div>
        )}
      </div>
    </motion.section>
  );
};
