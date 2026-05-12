import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "hooks/useAuth";
import { useToast } from "contexts/ToastContext";
import { UsersHeader } from "../../components/UsersHeader/UsersHeader";
import { UsersList } from "../../components/UsersList/UsersList";
import { UserForm } from "../../components/UsersForm/UsersForm";
import "./Users.scss";

export type UserItem = {
  _id?: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password?: string;
  desc?: string;
  status?: "waiting" | "active";
  roles?: string[];
};

type Mode = { type: "liste" } | { type: "create" } | { type: "edit"; user: UserItem };

const AVAILABLE_ROLES = ["user", "admin", "editor", "manager"];

export const Users = () => {
  const { socket } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>({ type: "liste" });
  const [search, setSearch] = useState("");

  const [newFirstname, setNewFirstname] = useState("");
  const [newLastname, setNewLastname] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStatus, setNewStatus] = useState<"waiting" | "active">("waiting");
  const [newRoles, setNewRoles] = useState("user");

  const [editFirstname, setEditFirstname] = useState("");
  const [editLastname, setEditLastname] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState<"waiting" | "active">("waiting");
  const [editRoles, setEditRoles] = useState<string[]>(["user"]);
  const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false);

  const rolesDropdownRef = useRef<HTMLDivElement | null>(null);

  const parseRoles = (roles: string): string[] =>
    roles
      .split(",")
      .map((r: string) => r.trim())
      .filter(Boolean);

  const toggleEditRole = (role: string) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const filteredUsers = users.filter((u) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    return (
      (u.firstname ?? "").toLowerCase().includes(term) ||
      (u.lastname ?? "").toLowerCase().includes(term) ||
      (u.email ?? "").toLowerCase().includes(term) ||
      (u.phone ?? "").toLowerCase().includes(term)
    );
  });

  const rolesTriggerLabel =
    editRoles.length > 0 ? editRoles.join(", ") : "Sélectionner un ou plusieurs rôles";

  useEffect(() => {
    if (!socket) return;

    const onMessage = (answer: {
      request?: "list" | "add" | "delete" | "edit";
      users?: UserItem[];
      user?: UserItem;
      etat?: boolean;
      error?: string;
    }) => {
      try {
        if (!answer) return;

        if (answer.etat === false) {
          addToast({
            message: "Action utilisateur échouée",
            subtitle: answer.error || "Erreur serveur",
            variant: "danger",
          });
          setError(answer.error || "Réponse invalide du serveur");
          return;
        }

        if (answer.request === "list" && Array.isArray(answer.users)) {
          setUsers(answer.users);
        }

        if (answer.request === "add" && answer.user) {
          const addedUser = answer.user;
          setUsers((prev) => [...prev, addedUser]);
          setMode({ type: "liste" });
          addToast({
            message: "Utilisateur créé",
            subtitle: `${addedUser.firstname} ${addedUser.lastname}`,
            variant: "success",
          });
        }

        if (answer.request === "delete") {
          const deleted = answer.user;
          if (deleted && deleted._id) {
            setUsers((prev) => prev.filter((u) => u._id !== deleted._id));
            addToast({
              message: "Utilisateur supprimé",
              variant: "success",
            });
          }
        }

        if (answer.request === "edit") {
          const updated = answer.user;
          if (updated && updated._id) {
            setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
            addToast({
              message: "Modification enregistrée",
              subtitle: `${updated.firstname} ${updated.lastname}`,
              variant: "success",
            });
          }

          if (mode.type === "edit" && updated && updated._id === mode.user._id) {
            setMode({ type: "liste" });
          }
        }
      } catch (e) {
        console.error("Message invalide", e);
        addToast({
          message: "Réponse serveur invalide",
          variant: "danger",
        });
        setError("Réponse invalide du serveur");
      }
    };

    socket.on("edit_user_answer", onMessage);
    socket.send("edit_user_request", {
      request: "list",
    });

    return () => {
      socket.off("edit_user_answer", onMessage);
    };
  }, [socket, mode, addToast]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        rolesDropdownRef.current &&
        !rolesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRolesDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenCreateForm = () => {
    setNewFirstname("");
    setNewLastname("");
    setNewEmail("");
    setNewPhone("");
    setNewPassword("");
    setNewDesc("");
    setNewStatus("waiting");
    setNewRoles("user");
    setMode({ type: "create" });
  };

  const handleAddUser = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!socket) return;
    if (!newFirstname || !newLastname || !newEmail || !newPhone || !newPassword) return;

    socket.send("edit_user_request", {
      request: "add",
      firstname: newFirstname,
      lastname: newLastname,
      email: newEmail,
      phone: newPhone,
      password: newPassword,
      desc: newDesc,
      status: newStatus,
      roles: parseRoles(newRoles),
    });
  };

  const handleCancelCreate = () => {
    setMode({ type: "liste" });
  };

  const handleDeleteUser = (id?: string) => {
    if (!socket || !id) return;

    socket.send("edit_user_request", {
      request: "delete",
      id,
    });
  };

  const handleStartEdit = (user: UserItem) => {
    setEditFirstname(user.firstname || "");
    setEditLastname(user.lastname || "");
    setEditEmail(user.email || "");
    setEditPhone(user.phone || "");
    setEditPassword("");
    setEditDesc(user.desc || "");
    setEditStatus(user.status ?? "waiting");
    setEditRoles(Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : ["user"]);
    setIsRolesDropdownOpen(false);
    setMode({ type: "edit", user });
  };

  const handleSubmitEdit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!socket || mode.type !== "edit") return;

    socket.send("edit_user_request", {
      request: "edit",
      id: mode.user._id,
      firstname: editFirstname,
      lastname: editLastname,
      email: editEmail,
      phone: editPhone,
      ...(editPassword ? { password: editPassword } : {}),
      desc: editDesc,
      status: editStatus,
      roles: editRoles,
    });
  };

  const handleCancelEdit = () => {
    setIsRolesDropdownOpen(false);
    setMode({ type: "liste" });
  };

  if (error) {
    return (
      <div id="usersPage">
        <div className="usersContainer">
          <p className="usersError">Erreur : {error}</p>
        </div>
      </div>
    );
  }

  if (!socket) {
    return (
      <div id="usersPage">
        <div className="usersContainer">
          <p className="usersLoading">Socket non initialisée...</p>
        </div>
      </div>
    );
  }

  if (mode.type === "create") {
    return (
      <div id="usersPage">
        <div className="usersContainer">
          <UserForm
            mode="create"
            title="Ajouter un utilisateur"
            firstname={newFirstname}
            lastname={newLastname}
            email={newEmail}
            phone={newPhone}
            password={newPassword}
            desc={newDesc}
            status={newStatus}
            rolesInput={newRoles}
            setFirstname={setNewFirstname}
            setLastname={setNewLastname}
            setEmail={setNewEmail}
            setPhone={setNewPhone}
            setPassword={setNewPassword}
            setDesc={setNewDesc}
            setStatus={setNewStatus}
            setRolesInput={setNewRoles}
            onSubmit={handleAddUser}
            onCancel={handleCancelCreate}
          />
        </div>
      </div>
    );
  }

  if (mode.type === "edit") {
    return (
      <div id="usersPage">
        <div className="usersContainer">
          <UserForm
            mode="edit"
            title="Modifier l’utilisateur"
            firstname={editFirstname}
            lastname={editLastname}
            email={editEmail}
            phone={editPhone}
            password={editPassword}
            desc={editDesc}
            status={editStatus}
            editRoles={editRoles}
            availableRoles={AVAILABLE_ROLES}
            isRolesDropdownOpen={isRolesDropdownOpen}
            rolesDropdownRef={rolesDropdownRef}
            rolesTriggerLabel={rolesTriggerLabel}
            setFirstname={setEditFirstname}
            setLastname={setEditLastname}
            setEmail={setEditEmail}
            setPhone={setEditPhone}
            setPassword={setEditPassword}
            setDesc={setEditDesc}
            setStatus={setEditStatus}
            setIsRolesDropdownOpen={setIsRolesDropdownOpen}
            toggleEditRole={toggleEditRole}
            onSubmit={handleSubmitEdit}
            onCancel={handleCancelEdit}
          />
        </div>
      </div>
    );
  }

  return (
    <div id="usersPage">
      <div className="usersContainer">
        <UsersHeader
          count={filteredUsers.length}
          search={search}
          setSearch={setSearch}
          onAddUser={handleOpenCreateForm}
        />

        <UsersList users={filteredUsers} search={search} onEdit={handleStartEdit} onDelete={handleDeleteUser} />
      </div>
    </div>
  );
};