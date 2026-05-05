import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";
import "./UsersForm.scss";

type UserFormProps = {
  mode: "create" | "edit";
  title: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
  desc: string;
  status: "waiting" | "active";
  rolesInput?: string;
  editRoles?: string[];
  availableRoles?: string[];
  isRolesDropdownOpen?: boolean;
  rolesDropdownRef?: RefObject<HTMLDivElement | null>;
  rolesTriggerLabel?: string;
  setFirstname: Dispatch<SetStateAction<string>>;
  setLastname: Dispatch<SetStateAction<string>>;
  setEmail: Dispatch<SetStateAction<string>>;
  setPhone: Dispatch<SetStateAction<string>>;
  setPassword: Dispatch<SetStateAction<string>>;
  setDesc: Dispatch<SetStateAction<string>>;
  setStatus: Dispatch<SetStateAction<"waiting" | "active">>;
  setRolesInput?: Dispatch<SetStateAction<string>>;
  setIsRolesDropdownOpen?: Dispatch<SetStateAction<boolean>>;
  toggleEditRole?: (role: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export const UserForm = ({
  mode,
  title,
  firstname,
  lastname,
  email,
  phone,
  password,
  desc,
  status,
  rolesInput,
  editRoles,
  availableRoles,
  isRolesDropdownOpen,
  rolesDropdownRef,
  rolesTriggerLabel,
  setFirstname,
  setLastname,
  setEmail,
  setPhone,
  setPassword,
  setDesc,
  setStatus,
  setRolesInput,
  setIsRolesDropdownOpen,
  toggleEditRole,
  onSubmit,
  onCancel,
}: UserFormProps) => {
  return (
    <div className="usersPanel">
      <h2 className="usersTitle">{title}</h2>

      <form onSubmit={onSubmit} className="usersForm">
        <div className="formGroup">
          <label>
            Prénom :
            <input type="text" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
          </label>
        </div>

        <div className="formGroup">
          <label>
            Nom :
            <input type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} />
          </label>
        </div>

        <div className="formGroup">
          <label>
            Email :
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>

        <div className="formGroup">
          <label>
            Téléphone :
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>

        <div className="formGroup">
          <label>
            {mode === "edit"
              ? "Mot de passe (laisser vide pour ne pas changer) :"
              : "Mot de passe :"}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>

        <div className="formGroup">
          <label>
            Description :
            <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </label>
        </div>

        <div className="formGroup">
          <label>
            Statut :
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "waiting" | "active")}
            >
              <option value="waiting">waiting</option>
              <option value="active">active</option>
            </select>
          </label>
        </div>

        {mode === "create" ? (
          <div className="formGroup">
            <label>
              Rôles (séparés par virgule) :
              <input
                type="text"
                value={rolesInput ?? ""}
                onChange={(e) => setRolesInput?.(e.target.value)}
              />
            </label>
          </div>
        ) : (
          <div className="formGroup rolesDropdownGroup" ref={rolesDropdownRef}>
            <span className="rolesLabel">Rôles :</span>

            <button
              type="button"
              className={`rolesDropdownTrigger ${isRolesDropdownOpen ? "open" : ""}`}
              onClick={() => setIsRolesDropdownOpen?.((prev) => !prev)}
            >
              <span className="rolesDropdownValue">{rolesTriggerLabel}</span>
              <span className="rolesDropdownArrow">▾</span>
            </button>

            {isRolesDropdownOpen && (
              <div className="rolesDropdownMenu">
                {availableRoles?.map((role) => (
                  <label key={role} className="rolesDropdownOption">
                    <input
                      type="checkbox"
                      checked={editRoles?.includes(role) ?? false}
                      onChange={() => toggleEditRole?.(role)}
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="usersActions">
          <button type="submit" className="btnPrimary">
            {mode === "create" ? "Créer" : "Enregistrer"}
          </button>

          <button type="button" onClick={onCancel} className="btnSecondary">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};