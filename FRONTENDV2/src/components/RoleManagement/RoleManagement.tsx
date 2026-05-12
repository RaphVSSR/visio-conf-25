// FIXME: rewire RoleManagement as its own controleur participant (see services/auth/AuthSync.ts pattern). `socket` no longer comes from useAuth.
// FIXME: local `rm-toast` (state `statusMessage`) must migrate to global useToast (showToast/removeToast) once this is rewired.
import { FC, useEffect, useRef, useState, useCallback } from "react";
import { Pencil, Trash2, Eye, Plus, RefreshCw } from "lucide-react";
import { useAuth } from "hooks/useAuth";
import "./RoleManagement.scss";

type RoleData = {
  _id: string;
  uuid: string;
  label: string;
  permissions?: { _id: string; label: string }[];
  default: boolean;
};

export type RoleManagementProps = {
  activeAction?: string | null;
};

export const RoleManagement: FC<RoleManagementProps> = ({
  activeAction,
}) => {
  useAuth();
  const socket: any = null;

  const [roles, setRoles] = useState<RoleData[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [editRoleName, setEditRoleName] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const socketRef = useRef(socket);
  socketRef.current = socket;

  const showStatus = useCallback((text: string, type: "success" | "error") => {
    setStatusMessage({ text, type });
  }, []);

  // --- Socket message handlers ---

  const handleRoles = useCallback((data: any) => {
    if (data) setRoles(data);
  }, []);

  const handleRole = useCallback((data: any) => {
    if (data) setSelectedRole(data);
  }, []);

  const handleRoleCreatingStatus = useCallback((data: any) => {
    if (data?.success) {
      showStatus("Rôle créé avec succès", "success");
      setNewRoleName("");
      socketRef.current?.send("get_roles", true);
    } else {
      showStatus(data?.message || "Erreur lors de la création", "error");
    }
  }, [showStatus]);

  const handleRoleAlreadyExists = useCallback((data: any) => {
    showStatus(data?.message || "Ce rôle existe déjà", "error");
  }, [showStatus]);

  const handleRoleUpdatingStatus = useCallback((data: any) => {
    if (data?.success) {
      showStatus("Rôle modifié avec succès", "success");
      setEditingRole(null);
      socketRef.current?.send("get_roles", true);
    } else {
      showStatus(data?.message || "Erreur lors de la modification", "error");
    }
  }, [showStatus]);

  const handleRoleDeletingStatus = useCallback((data: any) => {
    if (data?.success) {
      showStatus("Rôle supprimé", "success");
      setSelectedRole(null);
      setConfirmDelete(null);
      socketRef.current?.send("get_roles", true);
    } else {
      showStatus(data?.message || "Erreur lors de la suppression", "error");
    }
  }, [showStatus]);

  // --- Socket lifecycle ---

  useEffect(() => {
    if (!socket) return;

    socket.on("roles", handleRoles);
    socket.on("role", handleRole);
    socket.on("role_creating_status", handleRoleCreatingStatus);
    socket.on("role_already_exists", handleRoleAlreadyExists);
    socket.on("role_updating_status", handleRoleUpdatingStatus);
    socket.on("role_deleting_status", handleRoleDeletingStatus);

    socket.send("get_roles", true);

    return () => {
      socket.off("roles", handleRoles);
      socket.off("role", handleRole);
      socket.off("role_creating_status", handleRoleCreatingStatus);
      socket.off("role_already_exists", handleRoleAlreadyExists);
      socket.off("role_updating_status", handleRoleUpdatingStatus);
      socket.off("role_deleting_status", handleRoleDeletingStatus);
    };
  }, [socket, handleRoles, handleRole, handleRoleCreatingStatus, handleRoleAlreadyExists, handleRoleUpdatingStatus, handleRoleDeletingStatus]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  // --- Actions ---

  const handleRefresh = () => {
    socket?.send("get_roles", true);
  };

  const handleGetRole = (roleId: string) => {
    setSelectedRole(roles.find((r) => r._id === roleId) || null);
    socket?.send("get_role", { role_id: roleId });
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim() || !socket) return;
    socket.send("create_role", { name: newRoleName.trim(), perms: [] });
  };

  const handleUpdateRole = () => {
    if (!editingRole || !editRoleName.trim() || !socket) return;
    socket.send("update_role", {
      role_id: editingRole._id,
      name: editRoleName.trim(),
      perms: editingRole.permissions?.map((p) => p._id) || [],
    });
  };

  const handleDeleteRole = (roleId: string) => {
    if (!socket) return;
    socket.send("delete_role", { role_id: roleId });
  };

  const startEdit = (role: RoleData) => {
    setEditingRole(role);
    setEditRoleName(role.label);
  };

  // --- Render helpers ---

  const renderList = () => (
    <div className="rm-section">
      <div className="rm-section__header">
        <h3>Liste des rôles</h3>
        <button
          className="rm-btn rm-btn--icon"
          onClick={handleRefresh}
          title="Rafraîchir"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {roles.length === 0 ? (
        <p className="rm-empty">Aucun rôle trouvé.</p>
      ) : (
        <table className="rm-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Identifiant</th>
              <th>Par défaut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr
                key={role._id}
                className={
                  selectedRole?._id === role._id ? "rm-table__row--active" : ""
                }
              >
                <td className="rm-table__label">{role.label}</td>
                <td className="rm-table__uuid">{role.uuid}</td>
                <td>{role.default ? "Oui" : "Non"}</td>
                <td className="rm-table__actions">
                  <button
                    className="rm-btn rm-btn--small rm-btn--info"
                    onClick={() => handleGetRole(role._id)}
                    title="Voir"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    className="rm-btn rm-btn--small rm-btn--warning"
                    onClick={() => startEdit(role)}
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="rm-btn rm-btn--small rm-btn--danger"
                    onClick={() => setConfirmDelete(role._id)}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderCreate = () => (
    <div className="rm-section">
      <h3>Créer un rôle</h3>
      <div className="rm-form">
        <label className="rm-form__label">
          Nom du rôle
          <input
            type="text"
            className="rm-form__input"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="Ex: Modérateur"
          />
        </label>
        <button
          className="rm-btn rm-btn--primary"
          onClick={handleCreateRole}
          disabled={!newRoleName.trim()}
        >
          <Plus size={16} />
          Créer
        </button>
      </div>
    </div>
  );

  const renderEdit = () => {
    if (!editingRole) {
      return (
        <div className="rm-section">
          <h3>Modifier un rôle</h3>
          <p className="rm-empty">
            Sélectionnez un rôle dans la liste puis cliquez sur l'icône de
            modification.
          </p>
          {renderList()}
        </div>
      );
    }

    return (
      <div className="rm-section">
        <h3>Modifier : {editingRole.label}</h3>
        <div className="rm-form">
          <label className="rm-form__label">
            Nom du rôle
            <input
              type="text"
              className="rm-form__input"
              value={editRoleName}
              onChange={(e) => setEditRoleName(e.target.value)}
            />
          </label>
          <div className="rm-form__buttons">
            <button
              className="rm-btn rm-btn--primary"
              onClick={handleUpdateRole}
              disabled={!editRoleName.trim()}
            >
              Enregistrer
            </button>
            <button
              className="rm-btn rm-btn--secondary"
              onClick={() => setEditingRole(null)}
            >
              Annuler
            </button>
          </div>
        </div>
        {editingRole.permissions && editingRole.permissions.length > 0 && (
          <div className="rm-perms">
            <h4>Permissions associées</h4>
            <ul>
              {editingRole.permissions.map((p) => (
                <li key={p._id}>{p.label}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderDelete = () => (
    <div className="rm-section">
      <h3>Supprimer un rôle</h3>
      <p className="rm-empty">
        Sélectionnez un rôle dans la liste puis cliquez sur l'icône de
        suppression.
      </p>
      {renderList()}
    </div>
  );

  const renderDetail = () => {
    if (!selectedRole) {
      return (
        <div className="rm-section">
          <h3>Détails d'un rôle</h3>
          <p className="rm-empty">
            Sélectionnez un rôle dans la liste pour voir ses détails.
          </p>
          {renderList()}
        </div>
      );
    }

    return (
      <div className="rm-section">
        <h3>Détails du rôle</h3>
        <div className="rm-detail">
          <div className="rm-detail__field">
            <span className="rm-detail__key">Nom</span>
            <span className="rm-detail__value">{selectedRole.label}</span>
          </div>
          <div className="rm-detail__field">
            <span className="rm-detail__key">Identifiant</span>
            <span className="rm-detail__value">{selectedRole.uuid}</span>
          </div>
          <div className="rm-detail__field">
            <span className="rm-detail__key">Par défaut</span>
            <span className="rm-detail__value">
              {selectedRole.default ? "Oui" : "Non"}
            </span>
          </div>
          {selectedRole.permissions && selectedRole.permissions.length > 0 && (
            <div className="rm-detail__field rm-detail__field--col">
              <span className="rm-detail__key">
                Permissions ({selectedRole.permissions.length})
              </span>
              <ul className="rm-detail__permlist">
                {selectedRole.permissions.map((p) => (
                  <li key={p._id}>{p.label}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          className="rm-btn rm-btn--secondary"
          onClick={() => setSelectedRole(null)}
        >
          Fermer
        </button>
      </div>
    );
  };

  const renderContent = () => {
    if (editingRole) return renderEdit();

    switch (activeAction) {
      case "Lister":
        return renderList();
      case "Créer":
        return renderCreate();
      case "Modifier":
        return renderEdit();
      case "Supprimer":
        return renderDelete();
      case "Dupliquer":
        return renderList();
      default:
        return renderList();
    }
  };

  return (
    <div id="roleManagement">
      {statusMessage && (
        <div className={`rm-toast rm-toast--${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      {renderContent()}

      {selectedRole && activeAction !== "Modifier" && (
        <div className="rm-modal-overlay" onClick={() => setSelectedRole(null)}>
          <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
            {renderDetail()}
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          className="rm-modal-overlay"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="rm-modal rm-modal--small"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirmer la suppression</h3>
            <p>
              Voulez-vous vraiment supprimer ce rôle ? Cette action est
              irréversible.
            </p>
            <div className="rm-modal__actions">
              <button
                className="rm-btn rm-btn--danger"
                onClick={() => handleDeleteRole(confirmDelete)}
              >
                Supprimer
              </button>
              <button
                className="rm-btn rm-btn--secondary"
                onClick={() => setConfirmDelete(null)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
