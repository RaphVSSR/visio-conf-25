import React, { FC, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Files as FilesIcon, 
  FolderPlus, 
  FilePlus, 
  Search, 
  ChevronRight,
  MoreVertical,
  Download,
  Trash2,
  Folder
} from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "hooks/useAuth";
import { Card } from "design-system/components";
import "./Files.tsx.scss";

export const Files: FC = () => {
  const { controleur, isReady } = useSocket();
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!controleur || !isReady || !user) return;

    const comp = {
      nomDInstance: "FilesPage",
      traitementMessage: (msg: any) => {
        if (msg.files && msg.files.success) setFiles(msg.files.files);
        if (msg.spaces && msg.spaces.success) setSpaces(msg.spaces.spaces);
      }
    };

    const sentMessages = ['get_files', 'get_spaces'];
    const returnedMessages = ['files', 'spaces'];

    controleur.inscription(comp, sentMessages, returnedMessages);
    
    // Initial fetch
    controleur.envoie(comp, { 
      get_files: { userId: user._id, spaceId: currentSpaceId, category: 'personal' },
      get_spaces: { userId: user._id, parentId: currentSpaceId, category: 'personal' }
    });

    return () => {
      controleur.desincription(comp, sentMessages, returnedMessages);
    };
  }, [controleur, isReady, user, currentSpaceId]);

  const isAdmin = user?.roles?.some((r: any) => r.label?.toLowerCase() === "admin") || false;

  const handleCreateFolder = () => {
    const name = prompt("Nom du nouveau dossier :");
    if (name && controleur && isReady) {
      controleur.envoie("FilesPage", {
        create_space: {
          name,
          userId: user?._id,
          parentId: currentSpaceId,
          category: 'personal'
        }
      });
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && controleur && isReady) {
      // In a real scenario, we'd use a FormData or a specialized message
      // Here we'll simulate the call
      alert("L'upload est prêt à être implémenté via stream ou base64.");
    }
  };

  return (
    <motion.section 
      id="filesPage"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="pageHeader">
        <div className="headerInfo">
          <h1 className="pageTitle">
            <FilesIcon size={24} /> Gestion des fichiers
          </h1>
          <p className="pageSubtitle">Stockez et partagez vos documents en toute sécurité</p>
        </div>
        
        {isAdmin && (
          <div className="headerActions">
            <button className="actionBtn secondary" onClick={handleCreateFolder}>
              <FolderPlus size={18} /> Nouveau dossier
            </button>
            <label className="actionBtn primary">
              <FilePlus size={18} /> Importer
              <input type="file" style={{ display: 'none' }} onChange={handleUpload} />
            </label>
          </div>
        )}
      </header>

      <div className="filesBrowser">
        <div className="browserGrid">
          {/* Folders */}
          {spaces.map(space => (
            <Card key={space._id} className="itemCard folder" onClick={() => setCurrentSpaceId(space._id)}>
              <div className="itemIcon"><Folder size={24} /></div>
              <div className="itemInfo">
                <span className="itemName">{space.name}</span>
                <span className="itemMeta">Dossier</span>
              </div>
              <button className="itemOptions"><MoreVertical size={16} /></button>
            </Card>
          ))}

          {/* Files */}
          {files.map(file => (
            <Card key={file._id} className="itemCard file">
              <div className="itemIcon"><FilesIcon size={24} /></div>
              <div className="itemInfo">
                <span className="itemName">{file.name}</span>
                <span className="itemMeta">{(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="itemActions">
                <button title="Télécharger"><Download size={16} /></button>
                <button title="Supprimer" className="danger"><Trash2 size={16} /></button>
              </div>
            </Card>
          ))}
        </div>

        {spaces.length === 0 && files.length === 0 && (
          <div className="emptyState">
            <FilesIcon size={48} />
            <h3>Aucun fichier ici</h3>
            <p>Commencez par importer un document ou créer un dossier</p>
          </div>
        )}
      </div>
    </motion.section>
  );
};
