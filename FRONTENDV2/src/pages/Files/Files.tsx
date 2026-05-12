// FIXME: rewire Files as its own controleur participant (see services/auth/AuthSync.ts pattern). `socket` no longer comes from useAuth.
import React, { FC, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Files as FilesIcon, 
  FolderPlus, 
  FilePlus, 
  Search, 
  Trash2,
  Folder,
  ArrowLeft,
  Download,
  Eye,
  X,
  FileText,
  Image as ImageIcon,
  Film,
  Music
} from "lucide-react";
import { useAuth } from "hooks/useAuth";
import { Card } from "design-system/components";
import "./Files.tsx.scss";

export const Files: FC = () => {
  const { user } = useAuth();
  const socket: any = null;
  const [files, setFiles] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  useEffect(() => {
    if (!socket || !user) return;

    const handleFiles = (data: any) => {
      if (data.success) setFiles(data.files);
    };
    const handleSpaces = (data: any) => {
      if (data.success) setSpaces(data.spaces);
    };
    const handleFileUploadStatus = (data: any) => {
      if (data.success) {
        setFiles(prev => [data.file, ...prev]);
      } else {
        alert("Erreur lors de l'import : " + (data.error || "inconnue"));
      }
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
    if (!file) return;

    // 500MB Limit
    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("Le fichier est trop volumineux (max 500 MO)");
      return;
    }

    if (socket) {
      socket.send("upload_file", {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // Using local URL for preview in this demo
        userId: user?._id,
        spaceId: currentSpaceId,
        category: 'personal'
      });
    }
  };

  const handleNavigateTo = (space: any) => {
    setCurrentPath(prev => [...prev, space]);
    setCurrentSpaceId(space._id);
  };

  const handleDownload = (file: any) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon size={24} />;
    if (type.startsWith("video/")) return <Film size={24} />;
    if (type.startsWith("audio/")) return <Music size={24} />;
    if (type.includes("pdf") || type.includes("text")) return <FileText size={24} />;
    return <FilesIcon size={24} />;
  };

  const handleGoBack = () => {
    const newPath = [...currentPath];
    newPath.pop();
    setCurrentPath(newPath);
    setCurrentSpaceId(newPath.length > 0 ? newPath[newPath.length - 1]._id : null);
  };


  return (
    <motion.section 
      id="filesPage"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="pageHeader">
        <div className="headerLeft">
          {currentSpaceId && (
            <button className="backButton" onClick={handleGoBack}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="headerInfo">
            <h1 className="pageTitle">
              <FilesIcon size={24} /> Gestion des fichiers
            </h1>
            <p className="pageSubtitle">
              {currentPath.length > 0 
                ? currentPath.map(s => s.name).join(' / ') 
                : "Stockez et partagez vos documents en toute sécurité"
              }
            </p>
          </div>
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
            <Card key={space._id} className="itemCard folder" onClick={() => handleNavigateTo(space)}>
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
              <div className="itemIcon" onClick={() => setPreviewFile(file)}>
                {getFileIcon(file.type)}
              </div>
              <div className="itemInfo" onClick={() => setPreviewFile(file)}>
                <span className="itemName">{file.name}</span>
                <span className="itemMeta">{(file.size / (1024 * 1024)).toFixed(2)} MB • {new Date(file.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="itemActions">
                <button title="Prévisualiser" onClick={() => setPreviewFile(file)}><Eye size={16} /></button>
                <button title="Télécharger" onClick={() => handleDownload(file)}><Download size={16} /></button>
                <button title="Supprimer" className="danger" onClick={() => handleDeleteFile(file._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Preview Modal */}
        {previewFile && (
          <div className="previewModal" onClick={() => setPreviewFile(null)}>
            <div className="modalContent" onClick={e => e.stopPropagation()}>
              <button className="closeBtn" onClick={() => setPreviewFile(null)}><X size={24} /></button>
              <div className="previewHeader">
                <h2>{previewFile.name}</h2>
                <p>{(previewFile.size / (1024 * 1024)).toFixed(2)} MB • {previewFile.type}</p>
              </div>
              <div className="previewBody">
                {previewFile.type.startsWith("image/") ? (
                  <img src={previewFile.url} alt={previewFile.name} />
                ) : (
                  <div className="noPreview">
                    {getFileIcon(previewFile.type)}
                    <p>Aucun aperçu disponible pour ce type de fichier</p>
                  </div>
                )}
              </div>
              <div className="previewFooter">
                <button className="actionBtn primary" onClick={() => handleDownload(previewFile)}>
                  <Download size={18} /> Télécharger
                </button>
              </div>
            </div>
          </div>
        )}


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
