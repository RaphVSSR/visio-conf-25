import "./UsersHeader.scss";

type UsersHeaderProps = {
    count: number;
    search: string;
    setSearch: (value: string) => void;
    onAddUser: () => void;
  };
  
  export const UsersHeader = ({ count, search, setSearch, onAddUser }: UsersHeaderProps) => {
    return (
      <header className="usersHeader">
        <div>
          <h1 className="usersPageTitle">Utilisateurs</h1>
          <p className="usersSubtitle">{count} utilisateur(s)</p>
        </div>
  
        <div className="usersHeaderActions">
          <input
            type="text"
            className="usersSearchInput"
            placeholder="Rechercher un utilisateur"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
  
          <button type="button" onClick={onAddUser} className="btnPrimary">
            Ajouter un utilisateur
          </button>
        </div>
      </header>
    );
  };