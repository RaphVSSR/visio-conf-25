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
import { useAuth } from "hooks/useAuth";
import { Card } from "design-system/components";
import "./Files.tsx.scss";

export const Files: FC = () => {
  const { socket, user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !user) return;

    const handleFiles = (data: any) => {
      if (data.success) setFiles(data.files);
    };
    const handleSpaces = (data: any) => {
      if (data.success) setSpaces(data.spaces);
    };
    const handleFileUploadStatus = (data: any) => {
      if (data.success) setFiles(prev => [data.file, ...prev]);
    };
    const handleSpaceCreatingStatus = (data: any) => {
      if (data.success) setSpaces(prev => [...prev, data.space]);
    };
    const handleFileDeletingStatus = (data: any) => {
      if (data.success) setFiles(prev => prev.filter(f => f._id !== data.fileId));
    };
    const handleSpaceDeletingStatus = (data: any) => {
      if (data.success) setSpaces(prev => prev.filter(s => s._id !== data.spaceId));
    };

    socket.on("files", handleFiles);
    socket.on("spaces", handleSpaces);
    socket.on("file_uploading_status", handleFileUploadStatus);
    socket.on("space_creating_status", handleSpaceCreatingStatus);
    socket.on("file_deleting_status", handleFileDeletingStatus);
    socket.on("space_deleting_status", handleSpaceDeletingStatus);

    socket.onReady(() => {
      socket.send("get_files", { userId: user._id, spaceId: currentSpaceId, category: 'personal' });
      socket.send("get_spaces", { userId: user._id, parentId: currentSpaceId, category: 'personal' });
    });

    return () => {
      socket.off("files", handleFiles);
      socket.off("spaces", handleSpaces);
      socket.off("file_uploading_status", handleFileUploadStatus);
      socket.off("space_creating_status", handleSpaceCreatingStatus);
      socket.off("file_deleting_status", handleFileDeletingStatus);
      socket.off("space_deleting_status", handleSpaceDeletingStatus);
    };
  }, [socket, user, currentSpaceId]);

  const handleCreateFolder = () => {
    const name = prompt("Nom du nouveau dossier :");
    if (name && socket) {
      socket.send("create_space", {
        name,
        userId: user?._id,
        parentId: currentSpaceId,
        category: 'personal'
      });
    }
  };

  const handleDeleteSpace = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    if (confirm("Supprimer ce dossier ?") && socket) {
      socket.send("delete_space", { spaceId, userId: user?._id });
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (confirm("Supprimer ce fichier ?") && socket) {
      socket.send("delete_file", { fileId, userId: user?._id });
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && socket) {
      socket.send("upload_file", {
        name: file.name,
        size: file.size,
        type: file.type,
        url: "https://example.com/" + file.name, // Mock URL
        userId: user?._id,
        spaceId: currentSpaceId,
        category: 'personal'
      });
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
        
        {user && (
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
              <div className="itemActions">
                <button title="Supprimer" className="danger" onClick={(e) => handleDeleteSpace(e, space._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
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
                <button title="Supprimer" className="danger" onClick={() => handleDeleteFile(file._id)}>
                  <Trash2 size={16} />
                </button>
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
