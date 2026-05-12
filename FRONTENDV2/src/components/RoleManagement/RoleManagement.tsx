import { FC, useEffect, useState } from "react";
import { Pencil, Trash2, Eye, Plus, RefreshCw } from "lucide-react";
import { useToast } from "contexts/ToastContext";
import type { RoleState, RoleData } from "services/role/Role.types";
import "./RoleManagement.scss";

export type RoleManagementProps = {
  activeAction?: string | null;
  state: RoleState;
  onLoadRoles: () => void;
  onLoadRole: (roleId: string) => void;
  onCreateRole: (name: string, perms?: string[]) => void;
  onUpdateRole: (roleId: string, name: string, perms?: string[]) => void;
  onDeleteRole: (roleId: string) => void;
  onSelectRole: (role: RoleData | null) => void;
  onClearError: () => void;
};

export const RoleManagement: FC<RoleManagementProps> = ({
  activeAction,
  state,
  onLoadRoles,
  onLoadRole,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onSelectRole,
  onClearError,
}) => {
  const { showToast } = useToast();

  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [editRoleName, setEditRoleName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { roles, selectedRole, isSubmitting, roleError } = state;

  // --- Toast on error ---
  useEffect(() => {
    if (roleError) {
      showToast({ name: "role-error", message: roleError, variant: "danger" });
      onClearError();
    }
  }, [roleError, showToast, onClearError]);

  // --- Actions ---

  const handleRefresh = () => {
    onLoadRoles();
  };

  const handleGetRole = (roleId: string) => {
    onSelectRole(roles.find((r) => r._id === roleId) || null);
    onLoadRole(roleId);
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    onCreateRole(newRoleName.trim());
    setNewRoleName("");
    showToast({ name: "role-create", message: "Création du rôle en cours…", variant: "info" });
  };

  const handleUpdateRole = () => {
    if (!editingRole || !editRoleName.trim()) return;
    onUpdateRole(
      editingRole._id,
      editRoleName.trim(),
      editingRole.permissions?.map((p) => p._id) || [],
    );
    setEditingRole(null);
    showToast({ name: "role-update", message: "Modification du rôle en cours…", variant: "info" });
  };

  const handleDeleteRole = (roleId: string) => {
    onDeleteRole(roleId);
    setConfirmDelete(null);
    showToast({ name: "role-delete", message: "Suppression du rôle en cours…", variant: "info" });
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
          disabled={!newRoleName.trim() || isSubmitting}
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
              disabled={!editRoleName.trim() || isSubmitting}
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
          onClick={() => onSelectRole(null)}
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
      {renderContent()}

      {selectedRole && activeAction !== "Modifier" && (
        <div className="rm-modal-overlay" onClick={() => onSelectRole(null)}>
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
                disabled={isSubmitting}
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
