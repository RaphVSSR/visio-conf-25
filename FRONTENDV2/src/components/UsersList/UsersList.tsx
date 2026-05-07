import type { UserItem } from "../../pages/Users/Users";
import "./UsersList.scss";

type UsersListProps = {
  users: UserItem[];
  search: string;
  onEdit: (user: UserItem) => void;
  onDelete: (id?: string) => void;
};

export const UsersList = ({ users, search, onEdit, onDelete }: UsersListProps) => {
  return (
    <div className="usersListCard">
      {users.length === 0 && (
        <p className="usersEmpty">
          {search.trim() ? "Aucun utilisateur trouvé" : "Aucun utilisateur"}
        </p>
      )}

      <ul className="usersList">
        {users.map((u) => (
          <li key={u._id ?? u.email} className="userRow">
            <div className="userInfo">
              <p className="userName">
                {u.firstname} {u.lastname}
              </p>
              <p className="userMeta">
                {u.email} - {u.phone}
              </p>
            </div>

            <div className="userActions">
              <button type="button" onClick={() => onEdit(u)} className="btnSecondary">
                Modifier
              </button>
              <button type="button" onClick={() => onDelete(u._id)} className="btnDanger">
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};