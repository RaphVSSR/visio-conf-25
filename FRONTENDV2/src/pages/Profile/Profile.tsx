import React, { FC, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  FileText, 
  Save, 
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { Card } from "../../design-system/components/Card/Card";
import { useToast } from "../../contexts/ToastContext";
import "./Profile.scss";

export const Profile: FC = () => {
  const { user, login } = useAuth();
  const { controleur, isReady } = useSocket();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    desc: ""
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        email: user.email || "",
        phone: user.phone || "",
        desc: user.desc || ""
      });
    }
  }, [user]);

  useEffect(() => {
    if (!controleur || !isReady) return;

    const comp = {
      nomDInstance: "ProfilePage",
      traitementMessage: (msg: any) => {
        if (msg.update_user_response) {
          setIsSaving(false);
          if (msg.update_user_response.success) {
            addToast({ message: "Profil mis à jour avec succès !", variant: "success" });
            // Mettre à jour le contexte Auth localement si nécessaire
            // login(msg.update_user_response.user, ...); 
          } else {
            addToast({ message: msg.update_user_response.error || "Erreur lors de la mise à jour", variant: "danger" });
          }
        }
      }
    };

    controleur.inscription(comp, ["update_user_request"], ["update_user_response"]);

    return () => {
      controleur.desincription(comp, ["update_user_request"], ["update_user_response"]);
    };
  }, [controleur, isReady, addToast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!controleur || !isReady || !user) return;

    setIsSaving(true);
    controleur.envoie("ProfilePage", {
      update_user_request: {
        userId: user._id,
        updates: formData
      }
    });
  };

  return (
    <div id="profilePage">
      <div className="profileContainer">
        <header className="pageHeader">
          <button className="backBtn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="pageTitle">Mon Profil</h1>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="profileGrid">
            <Card className="profileMainCard">
              <div className="sectionTitle">
                <UserIcon size={20} /> Informations personnelles
              </div>
              
              <div className="formGrid">
                <div className="inputGroup">
                  <label>Prénom</label>
                  <input 
                    type="text" 
                    value={formData.firstname}
                    onChange={(e) => setFormData({...formData, firstname: e.target.value})}
                    placeholder="Votre prénom"
                    required
                  />
                </div>
                <div className="inputGroup">
                  <label>Nom</label>
                  <input 
                    type="text" 
                    value={formData.lastname}
                    onChange={(e) => setFormData({...formData, lastname: e.target.value})}
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>

              <div className="inputGroup">
                <label>Email</label>
                <div className="inputWithIcon">
                  <Mail size={18} />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div className="inputGroup">
                <label>Téléphone</label>
                <div className="inputWithIcon">
                  <Phone size={18} />
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="06 00 00 00 00"
                  />
                </div>
              </div>
            </Card>

            <Card className="profileBioCard">
              <div className="sectionTitle">
                <FileText size={20} /> Biographie & Description
              </div>
              <div className="inputGroup">
                <textarea 
                  value={formData.desc}
                  onChange={(e) => setFormData({...formData, desc: e.target.value})}
                  placeholder="Dites-nous en plus sur vous..."
                  rows={8}
                />
              </div>
              
              <div className="infoNote">
                <CheckCircle2 size={16} />
                <p>Ces informations seront visibles par les autres membres dans l'annuaire.</p>
              </div>

              <button type="submit" className="saveBtn" disabled={isSaving}>
                {isSaving ? "Enregistrement..." : (
                  <>
                    <Save size={18} /> Enregistrer les modifications
                  </>
                )}
              </button>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};
