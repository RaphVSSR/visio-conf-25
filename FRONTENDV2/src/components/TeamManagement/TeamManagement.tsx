import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "hooks/useAuth";
import MemberSelector, { type Member } from "components/MemberSelector";
import "./TeamManagement.scss";

type TeamData = {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

type TeamManagementProps = {
  activeAction?: string | null;
};

export const TeamManagement: FC<TeamManagementProps> = ({ activeAction }) => {
  const { socket, user } = useAuth();
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSyncingMembers, setIsSyncingMembers] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const showStatus = useCallback((text: string, type: "success" | "error") => {
    setStatusMessage({ text, type });
  }, []);

  const requestAllTeams = useCallback(() => {
    if (!socket) return;
    setIsLoading(true);
    socket.send("team_get", { type: "all" });
  }, [socket]);

  const requestUsers = useCallback(() => {
    if (!socket) return;
    setIsLoadingUsers(true);
    socket.send("user_get", { type: "list" });
  }, [socket]);

  const requestTeamMembers = useCallback((teamId: string) => {
    if (!socket) return;
    setIsLoadingMembers(true);
    socket.send("team_member", { type: "list", teamId });
  }, [socket]);

  const handleTeamGetResponse = useCallback((data: any) => {
    if (data.type !== "all") return;
    setIsLoading(false);
    if (!data.etat) {
      showStatus("Impossible de charger les equipes", "error");
      return;
    }
    setTeams(data.teams || []);
  }, [showStatus]);

  const handleTeamActionResponse = useCallback((data: any) => {
    if (!data.etat) {
      showStatus("Operation equipe echouee", "error");
      return;
    }

    if (data.type === "create") {
      showStatus("Equipe creee avec succes", "success");
      setFormData({ name: "", description: "" });
      setSelectedMemberIds([]);
      setMembers((prevMembers) =>
        prevMembers.map((member) => ({ ...member, isSelected: false }))
      );
    }
    if (data.type === "update") {
      showStatus("Equipe modifiee avec succes", "success");
      setEditingTeam(null);
      setFormData({ name: "", description: "" });
    }
    if (data.type === "delete") {
      showStatus("Equipe supprimee", "success");
      setConfirmDelete(null);
    }

    requestAllTeams();
  }, [requestAllTeams, showStatus]);

  const handleUserGetResponse = useCallback((data: any) => {
    if (data.type !== "list") return;
    setIsLoadingUsers(false);
    if (!data.etat) {
      showStatus("Impossible de charger les utilisateurs", "error");
      return;
    }

    const users = data.users || [];
    setMembers(
      users.map((u: any) => ({
        id: u.id,
        firstname: u.firstname,
        lastname: u.lastname,
        picture: u.picture,
        isSelected: selectedMemberIds.includes(u.id),
      }))
    );
  }, [selectedMemberIds, showStatus]);

  const handleTeamMemberResponse = useCallback((data: any) => {
    if (!editingTeam) return;
    if (data.teamId !== editingTeam.id) return;

    if (data.type === "list") {
      setIsLoadingMembers(false);
      if (!data.etat) {
        showStatus("Impossible de charger les membres de l'equipe", "error");
        return;
      }

      const memberIds = (data.members || []).map((member: any) => member.userId);
      setSelectedMemberIds(memberIds);
      setMembers((prevMembers) =>
        prevMembers.map((member) => ({
          ...member,
          isSelected: memberIds.includes(member.id),
        }))
      );
      return;
    }

    if (data.type === "add" || data.type === "remove") {
      setIsSyncingMembers(false);
      if (!data.etat) {
        showStatus("Modification des membres refusee", "error");
        return;
      }
      requestTeamMembers(editingTeam.id);
    }
  }, [editingTeam, requestTeamMembers, showStatus]);

  useEffect(() => {
    if (!socket) return;

    socket.on("team_get_response", handleTeamGetResponse);
    socket.on("team_action_response", handleTeamActionResponse);
    socket.on("user_get_response", handleUserGetResponse);
    socket.on("team_member_response", handleTeamMemberResponse);

    requestUsers();
    requestAllTeams();

    return () => {
      socket.off("team_get_response", handleTeamGetResponse);
      socket.off("team_action_response", handleTeamActionResponse);
      socket.off("user_get_response", handleUserGetResponse);
      socket.off("team_member_response", handleTeamMemberResponse);
    };
  }, [socket, handleTeamGetResponse, handleTeamActionResponse, handleTeamMemberResponse, handleUserGetResponse, requestAllTeams, requestUsers]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const handleCreate = () => {
    if (!socket || !formData.name.trim()) return;
    socket.send("team_action", {
      type: "create",
      name: formData.name.trim(),
      description: formData.description.trim(),
      picture: "",
      members: selectedMemberIds,
    });
  };

  const handleUpdate = () => {
    if (!socket || !editingTeam || !formData.name.trim()) return;
    socket.send("team_action", {
      type: "update",
      teamId: editingTeam.id,
      name: formData.name.trim(),
      description: formData.description.trim(),
    });
  };

  const handleDelete = (teamId: string) => {
    if (!socket) return;
    socket.send("team_action", { type: "delete", teamId });
  };

  const startEdit = (team: TeamData) => {
    setEditingTeam(team);
    setFormData({ name: team.name, description: team.description || "" });
    setSelectedMemberIds([]);
    setMembers((prevMembers) =>
      prevMembers.map((member) => ({ ...member, isSelected: false }))
    );
    requestTeamMembers(team.id);
  };

  const handleMemberToggle = (member: Member) => {
    if (!editingTeam) {
      setMembers((prevMembers) =>
        prevMembers.map((m) =>
          m.id === member.id ? { ...m, isSelected: !m.isSelected } : m
        )
      );
      setSelectedMemberIds((prevIds) =>
        prevIds.includes(member.id)
          ? prevIds.filter((id) => id !== member.id)
          : [...prevIds, member.id]
      );
      return;
    }

    if (!socket || isSyncingMembers) return;
    setIsSyncingMembers(true);
    socket.send("team_member", {
      type: member.isSelected ? "remove" : "add",
      teamId: editingTeam.id,
      userId: member.id,
    });
  };

  const handleSelectAllMembers = () => {
    if (editingTeam) return;
    const hasUnselected = members.some((member) => !member.isSelected);
    const updatedMembers = members.map((member) => ({
      ...member,
      isSelected: hasUnselected,
    }));
    setMembers(updatedMembers);
    setSelectedMemberIds(hasUnselected ? updatedMembers.map((member) => member.id) : []);
  };

  const selectedMembersCount = useMemo(
    () => members.filter((member) => member.isSelected).length,
    [members]
  );

  const renderList = () => (
    <div className="tm-section">
      <div className="tm-section__header">
        <h3>Liste des equipes</h3>
        <button className="tm-btn tm-btn--icon" onClick={requestAllTeams} title="Rafraichir">
          <RefreshCw size={16} />
        </button>
      </div>

      {isLoading ? (
        <p className="tm-empty">Chargement des equipes...</p>
      ) : teams.length === 0 ? (
        <p className="tm-empty">Aucune equipe trouvee.</p>
      ) : (
        <table className="tm-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id}>
                <td className="tm-table__label">{team.name}</td>
                <td>{team.description || "-"}</td>
                <td className="tm-table__actions">
                  <button className="tm-btn tm-btn--small tm-btn--warning" onClick={() => startEdit(team)} title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button className="tm-btn tm-btn--small tm-btn--danger" onClick={() => setConfirmDelete(team.id)} title="Supprimer">
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
    <div className="tm-section">
      <h3>Creer une equipe</h3>
      <div className="tm-form">
        <label className="tm-form__label">
          Nom de l'equipe
          <input
            type="text"
            className="tm-form__input"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Produit"
          />
        </label>
        <label className="tm-form__label">
          Description
          <textarea
            className="tm-form__textarea"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description de l'equipe"
          />
        </label>
        <MemberSelector
          members={members}
          onMemberToggle={handleMemberToggle}
          onSelectAll={handleSelectAllMembers}
          isLoading={isLoadingUsers}
          currentUserId={user?._id}
          selectedMembersTitle={`Membres selectionnes (${selectedMembersCount})`}
          availableMembersTitle="Ajouter des membres"
          showSelectedSection={true}
        />
        <button className="tm-btn tm-btn--primary" onClick={handleCreate} disabled={!formData.name.trim()}>
          <Plus size={16} />
          Creer
        </button>
      </div>
    </div>
  );

  const renderEdit = () => (
    <div className="tm-section">
      <h3>Modifier une equipe</h3>
      {!editingTeam ? (
        <>
          <p className="tm-empty">Selectionnez une equipe dans la liste pour la modifier.</p>
          {renderList()}
        </>
      ) : (
        <div className="tm-form">
          <label className="tm-form__label">
            Nom de l'equipe
            <input
              type="text"
              className="tm-form__input"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </label>
          <label className="tm-form__label">
            Description
            <textarea
              className="tm-form__textarea"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <MemberSelector
            members={members}
            onMemberToggle={handleMemberToggle}
            isLoading={isLoadingUsers || isLoadingMembers}
            canManageMembers={!isSyncingMembers}
            currentUserId={user?._id}
            selectedMembersTitle={`Membres actuels (${selectedMembersCount})`}
            availableMembersTitle="Ajouter des membres"
            showSelectedSection={true}
          />
          <div className="tm-form__buttons">
            <button className="tm-btn tm-btn--primary" onClick={handleUpdate} disabled={!formData.name.trim()}>
              Enregistrer
            </button>
            <button
              className="tm-btn tm-btn--secondary"
              onClick={() => {
                setEditingTeam(null);
                setFormData({ name: "", description: "" });
                setSelectedMemberIds([]);
                setMembers((prevMembers) =>
                  prevMembers.map((member) => ({ ...member, isSelected: false }))
                );
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderDelete = () => (
    <div className="tm-section">
      <h3>Supprimer une equipe</h3>
      <p className="tm-empty">Choisissez une equipe dans la liste puis cliquez sur supprimer.</p>
      {renderList()}
    </div>
  );

  const renderContent = () => {
    if (editingTeam) return renderEdit();
    switch (activeAction) {
      case "Créer":
        return renderCreate();
      case "Modifier":
        return renderEdit();
      case "Supprimer":
        return renderDelete();
      case "Lister":
      default:
        return renderList();
    }
  };

  return (
    <div id="teamManagement">
      {statusMessage && (
        <div className={`tm-toast tm-toast--${statusMessage.type}`}>{statusMessage.text}</div>
      )}
      {renderContent()}

      {confirmDelete && (
        <div className="tm-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="tm-modal tm-modal--small" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmer la suppression</h3>
            <p>Cette equipe sera supprimee avec ses canaux. Action irreversible.</p>
            <div className="tm-modal__actions">
              <button className="tm-btn tm-btn--danger" onClick={() => handleDelete(confirmDelete)}>
                Supprimer
              </button>
              <button className="tm-btn tm-btn--secondary" onClick={() => setConfirmDelete(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
