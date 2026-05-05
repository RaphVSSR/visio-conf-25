import { Button, Card } from "design-system/components";
import { useToast } from "contexts/ToastContext";
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { PermissionApi } from "services/permissions/PermissionApi";
import type { Permission, PermissionPayload } from "types/Permission";
import "./PermissionsManager.scss";

const EMPTY_FORM: PermissionPayload = {
  name: "",
  description: "",
};

export const PermissionsManager = () => {
  const { addToast, removeToast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState<PermissionPayload>(EMPTY_FORM);
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const defaultPermissionsCount = permissions.filter(permission => permission.default).length;
  const customPermissionsCount = permissions.length - defaultPermissionsCount;

  const loadPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const nextPermissions = await PermissionApi.list();
      setPermissions(nextPermissions);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de charger les permissions.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  function resetForm() {
    setFormData(EMPTY_FORM);
    setEditingPermissionId(null);
  }

  function startEditing(permission: Permission) {
    setEditingPermissionId(permission.id);
    setFormData({
      name: permission.name,
      description: permission.description,
    });
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;

    setFormData(previousFormData => ({
      ...previousFormData,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      setErrorMessage("Le nom et la description sont obligatoires.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (editingPermissionId) {
        await PermissionApi.update(editingPermissionId, {
          name: formData.name.trim(),
          description: formData.description.trim(),
        });

        addToast({
          message: "Permission modifiée.",
          variant: "success",
        });
      } else {
        await PermissionApi.create({
          name: formData.name.trim(),
          description: formData.description.trim(),
        });

        addToast({
          message: "Permission ajoutée.",
          variant: "success",
        });
      }

      resetForm();
      await loadPermissions();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible d'enregistrer la permission.";
      setErrorMessage(message);
      addToast({
        message: "Échec de l'enregistrement.",
        subtitle: message,
        variant: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(permission: Permission) {
    try {
      setErrorMessage(null);
      await PermissionApi.remove(permission.id);
      addToast({
        message: "Permission supprimée.",
        variant: "success",
      });

      if (editingPermissionId === permission.id) {
        resetForm();
      }

      await loadPermissions();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de supprimer la permission.";
      setErrorMessage(message);
      addToast({
        message: "Échec de la suppression.",
        subtitle: message,
        variant: "danger",
      });
    }
  }

  function requestDelete(permission: Permission) {
    const toastId = addToast({
      message: `Supprimer "${permission.name}" ?`,
      subtitle: "Cette action est définitive.",
      variant: "warning",
      duration: 0,
      actions: [
        {
          label: "Supprimer",
          onClick: () => {
            removeToast(toastId);
            void handleDelete(permission);
          },
          variant: "primary",
        },
        {
          label: "Annuler",
          onClick: () => removeToast(toastId),
          variant: "ghost",
        },
      ],
    });
  }

  return (
    <section className="permissionsManagerHost">
      <div className="permissionsManager">
        <div className="permissionsManager__hero">
          <div className="permissionsManager__heroContent">
            <span className="permissionsManager__eyebrow">Administration</span>
            <h2>Permissions</h2>
            <p>
              Pilote les accès disponibles dans l’application avant leur attribution aux rôles.
            </p>
          </div>
          <div className="permissionsManager__stats">
            <div className="permissionsManager__stat">
              <strong>{permissions.length}</strong>
              <span>Total</span>
            </div>
            <div className="permissionsManager__stat">
              <strong>{customPermissionsCount}</strong>
              <span>Personnalisées</span>
            </div>
            <div className="permissionsManager__stat">
              <strong>{defaultPermissionsCount}</strong>
              <span>Par défaut</span>
            </div>
          </div>
        </div>

        <Card className="card permissionsManager__formCard permissionsManager__card--accent">
          <div className="permissionsManager__panelHeader">
            <div>
              <span className="permissionsManager__sectionTag">
                {editingPermissionId ? "Édition en cours" : "Nouvelle règle"}
              </span>
              <h2>{editingPermissionId ? "Modifier une permission" : "Ajouter une permission"}</h2>
              <p>Renseigne un nom clair et une description compréhensible par les administrateurs.</p>
            </div>
          </div>

          <form className="permissionsManager__form" onSubmit={handleSubmit}>
            <div className="permissionsManager__formGrid">
              <label className="permissionsManager__field">
                <span>Nom</span>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Gérer les exports"
                  maxLength={100}
                />
                <small>{formData.name.length}/100 caractères</small>
              </label>

              <label className="permissionsManager__field permissionsManager__field--wide">
                <span>Description</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Décris précisément ce que cette permission autorise."
                  rows={4}
                  maxLength={300}
                />
                <small>{formData.description.length}/300 caractères</small>
              </label>
            </div>

            {errorMessage && (
              <div className="permissionsManager__errorBlock">
                <p className="permissionsManager__error">{errorMessage}</p>
                <Button
                  type="button"
                  text="Réessayer"
                  icon="RefreshCw"
                  iconPosition="left"
                  iconSize={16}
                  onClick={() => void loadPermissions()}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="permissionsManager__actions">
              <Button
                type="submit"
                text={editingPermissionId ? "Enregistrer" : "Ajouter"}
                icon={editingPermissionId ? "Save" : "Plus"}
                iconPosition="left"
                iconSize={16}
                disabled={isSubmitting}
              />
              {editingPermissionId && (
                <Button
                  type="button"
                  text="Annuler"
                  icon="X"
                  iconPosition="left"
                  iconSize={16}
                  onClick={resetForm}
                  disabled={isSubmitting}
                />
              )}
            </div>
          </form>
        </Card>

        <section className="permissionsManager__listBlock">
          <div className="permissionsManager__listHeader">
            <div>
              <span className="permissionsManager__sectionTag">Catalogue</span>
              <h2>Liste des permissions</h2>
              <p>{permissions.length} permission(s) chargée(s)</p>
            </div>
            <Button
              type="button"
              text="Actualiser"
              icon="RefreshCw"
              iconPosition="left"
              iconSize={16}
              onClick={() => void loadPermissions()}
              disabled={isLoading}
            />
          </div>

          {isLoading ? (
            <p className="permissionsManager__status">Chargement des permissions...</p>
          ) : permissions.length === 0 ? (
            <p className="permissionsManager__status">Aucune permission trouvée.</p>
          ) : (
            <div className="permissionsManager__list">
              {permissions.map(permission => (
                <Card
                  key={permission.id}
                  className={`card permissionsManager__item ${
                    permission.default
                      ? "permissionsManager__card--success"
                      : "permissionsManager__card--accent"
                  }`}
                >
                  <div className="permissionsManager__itemTop">
                    <div>
                      <h3>{permission.name}</h3>
                      <p className="permissionsManager__uuid">{permission.uuid}</p>
                    </div>
                    {permission.default && (
                      <span className="permissionsManager__badge">Par défaut</span>
                    )}
                  </div>

                  <p className="permissionsManager__description">{permission.description}</p>

                  <div className="permissionsManager__itemActions">
                    <Button
                      type="button"
                      text="Modifier"
                      icon="Pencil"
                      iconPosition="left"
                      iconSize={16}
                      onClick={() => startEditing(permission)}
                    />
                    <Button
                      type="button"
                      text="Supprimer"
                      icon="Trash2"
                      iconPosition="left"
                      iconSize={16}
                      onClick={() => requestDelete(permission)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};
