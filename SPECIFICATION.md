# SPECIFICATIONS - MMI VisioConf

## FRONTEND

### Admin

#### --> Home Admin

| Variable/Fonction             |                             Type/Variables                              | Description                                                                                                                 |
| ----------------------------- | :---------------------------------------------------------------------: | --------------------------------------------------------------------------------------------------------------------------- |
| [selectedTab, setSelectedTab] |                                string[ ]                                | Liste des permissions de l'utilisateur connecté                                                                             |
| [onlineUsers, setOnlineUsers] |                                   int                                   | Nombre d'utilisateurs connectés                                                                                             |
| [isAdmin, setIsAdmin]         |                                 boolean                                 | Détermine si l'utilisateur connecté est admin ou non                                                                        |
| tabs                          | {name : string, icon : JSXElement, color : string, click : Function}[ ] | Onglet de l'interface admin sélectionnée                                                                                    |
| nomDInstance                  |                                 string                                  | Nom qui identifie le composant                                                                                              |
| controleur                    |                                                                         | Pointe vers l'instance du controleur                                                                                        |
| verbose                       |                                 boolean                                 | Afficher les logs ou non du composant                                                                                       |
| listeMessageEmis              |                                string[ ]                                | Contient les messages suivants : "users_list_request", "user_perms_request"                                                 |
| listeMessageRecus             |                                string[ ]                                | Contient les messages suivants : "users_list_response", "user_perms_response", "update_user_roles_response", "updated_role" |
| traitementMessage (msg)       |                      msg est le message à traiter                       | Traite les message qui viennent du controleur                                                                               |

#### --> Admin Menu

| Variable/Fonction |                                Type/Variables                                | Description                            |
| ----------------- | :--------------------------------------------------------------------------: | -------------------------------------- |
| tabs              | {name : string, icon : JSXElement, subOptions : array, click : Function }[ ] | Liste des onglets de l'interface admin |

#### --> Home User Gestion

| Variable/Fonction                       |        Type/Variables        | Description                                                                                                         |
| --------------------------------------- | :--------------------------: | ------------------------------------------------------------------------------------------------------------------- |
| [regex, setRegex]                       |            string            | Regex pour la recherche d'utilisateur                                                                               |
| [userList, setUserList]                 |            User[]            | Liste des utilisateurs                                                                                              |
| [selectedUser, setSelectedUser]         |             User             | Utilisateur sélectionné                                                                                             |
| [rows, setRows]                         |             Any              | Lignes du tableau des utilisateurs                                                                                  |
| [openChangeStatus, setOpenChangeStatus] |           boolean            |                                                                                                                     |
| [openAlert, setOpenAlert]               |           boolean            | Ouvrir/Fermer la modale d'alerte                                                                                    |
| [updateUser, setUpdateUser]             |           boolean            | Définir si un utilisateur est modifié ou non                                                                        |
| [alertSeverity, setAlertSeverity]       |            string            | Type de message de la modale d'alerte                                                                               |
| [alertMessage, setAlertMessage]         |            string            | Contenu du message de la modale d'alerte                                                                            |
| [action, setAction]                     |           sttring            | Action effectué sur un utilisateur                                                                                  |
| nomDInstance                            |            string            | Nom qui identifie le composant                                                                                      |
| controleur                              |                              | Pointe vers l'instance du controleur                                                                                |
| verbose                                 |           boolean            | Afficher les logs ou non du composant                                                                               |
| listeMessageEmis                        |          string[ ]           | Contient les messages suivants : "users_list_request", "update_user_status_request", "update_user_roles_request"    |
| listeMessageRecus                       |          string[ ]           | Contient les messages suivants : "users_list_response", "update_user_status_response", "update_user_roles_response" |
| traitementMessage (msg)                 | msg est le message à traiter | Traite les message qui viennent du controleur                                                                       |
| handleChangeStatus()                    |            aucun             | Envoie le changement de status de l'utilisateur                                                                     |

#### --> User List Display

Reprends les variables de "Home User Gestion" pour l'affichage

#### --> Update User Role

| Variable/Fonction                 |        Type/Variables        | Description                                                                          |
| --------------------------------- | :--------------------------: | ------------------------------------------------------------------------------------ |
| [roleList, setRoleList]           |           Role[ ]            | Liste des rôles de l'utilisateur                                                     |
| [selectedRoles, setSelectedRoles] |          string[ ]           | Liste des rôles sélectionnés à assigner à l'utilisateur                              |
| [openDropDown, setOpenDropDown]   |           boolean            | Dérouler la liste des rôles                                                          |
| [openAlert, setOpenAlert]         |           boolean            | Ouvrir/Fermer la modale d'alerte                                                     |
| [alertSeverity, setAlertSeverity] |            string            | Type de message de la modale d'alerte                                                |
| [alertMessage, setAlertMessage]   |            string            | Contenu du message de la modale d'alerte                                             |
| [email, setEmail]                 |            string            | Email de l'utilisateur modifié                                                       |
| [password, setPassword]           |            string            | Mot de passe de l'utilisateur modifié                                                |
| [firstname, setFirstname]         |            string            | Prénom de l'utilisateur modifié                                                      |
| [lastname, setLastname]           |            string            | Nom de l'utilisateur modifié                                                         |
| [phone, setPhone]                 |            string            | N° de tel de l'utilisateur modifié                                                   |
| [job, setJob]                     |            string            | Job de l'utilisateur modifié                                                         |
| [desc, setDesc]                   |            string            | Description de l'utilisateur modifié                                                 |
| nomDInstance                      |            string            | Nom qui identifie le composant                                                       |
| controleur                        |                              | Pointe vers l'instance du controleur                                                 |
| verbose                           |           boolean            | Afficher les logs ou non du composant                                                |
| listeMessageEmis                  |          string[ ]           | Contient les messages suivants : "roles_list_request", "update_user_roles_request"   |
| listeMessageRecus                 |          string[ ]           | Contient les messages suivants : "roles_list_response", "update_user_roles_response" |
| traitementMessage (msg)           | msg est le message à traiter | Traite les message qui viennent du controleur                                        |
| handleUpdateUser()                |            aucun             | Envoie les modifications de l'utilisateur                                            |
| handleCheckboxChange()            |         role : Role          | Définit les rôles sélectionnés à associer à l'utilisateur                            |

#### --> Home Role Gestion

| Variable/Fonction                 |        Type/Variables        | Description                                                                                            |
| --------------------------------- | :--------------------------: | ------------------------------------------------------------------------------------------------------ |
| [regex, setRegex]                 |            string            | Regex pour la recherche de rôle                                                                        |
| [roleList, setRoleList]           |            Role[]            | Liste des rôles                                                                                        |
| [selectedRole, setSelectedRole]   |             Role             | Role sélectionné                                                                                       |
| [rows, setRows]                   |             Any              | Lignes du tableau des rôles                                                                            |
| [openDelete, setOpenDelete]       |           boolean            | Ouvrir/Fermer la modale de suppression                                                                 |
| [openDuplicate, setOpenDuplicate] |           boolean            | Ouvrir/Fermer la modale de duplication                                                                 |
| [openAlert, setOpenAlert]         |           boolean            | Ouvrir/Fermer la modale d'alerte                                                                       |
| [addUpdateRole, setAddUpdateRole] |           boolean            | Définir si un role est modifié ou non                                                                  |
| [alertSeverity, setAlertSeverity] |            string            | Type de message de la modale d'alerte                                                                  |
| [alertMessage, setAlertMessage]   |            string            | Contenu du message de la modale d'alerte                                                               |
| nomDInstance                      |            string            | Nom qui identifie le composant                                                                         |
| controleur                        |                              | Pointe vers l'instance du controleur                                                                   |
| verbose                           |           boolean            | Afficher les logs ou non du composant                                                                  |
| listeMessageEmis                  |          string[ ]           | Contient les messages suivants : "roles_list_request", "delete_role_request", "create_role_request"    |
| listeMessageRecus                 |          string[ ]           | Contient les messages suivants : "roles_list_response", "deleted_role", "created_role", "updated_role" |
| traitementMessage (msg)           | msg est le message à traiter | Traite les message qui viennent du controleur                                                          |
| handleDeleteRole()                |            aucun             | Valide la suppression du rôle                                                                          |
| handleDuplicateRole()             |            aucun             | Valide la duplication du rôle                                                                          |

#### --> Role List Display

Reprends les variables de "Home Role Gestion" pour l'affichage

#### --> Add Update Role

| Variable/Fonction                 |        Type/Variables        | Description                                                                                                                        |
| --------------------------------- | :--------------------------: | ---------------------------------------------------------------------------------------------------------------------------------- |
| [roleName, setRoleName]           |            string            | Nom du rôle                                                                                                                        |
| [permList, setPermList]           |        Permission[ ]         | Liste des permissions du rôle                                                                                                      |
| [selectedPerms, setSelectedPerms] |          string[ ]           | Liste des permissions sélectionnés à assigner au rôle                                                                              |
| [role, setRole]                   |            string            | Rôle sélectionné                                                                                                                   |
| [openDropDown, setOpenDropDown]   |           boolean            | Dérouler la liste des permissions                                                                                                  |
| [openAlert, setOpenAlert]         |           boolean            | Ouvrir/Fermer la modale d'alerte                                                                                                   |
| [alertSeverity, setAlertSeverity] |            string            | Type de message de la modale d'alerte                                                                                              |
| [alertMessage, setAlertMessage]   |            string            | Contenu du message de la modale d'alerte                                                                                           |
| nomDInstance                      |            string            | Nom qui identifie le composant                                                                                                     |
| controleur                        |                              | Pointe vers l'instance du controleur                                                                                               |
| verbose                           |           boolean            | Afficher les logs ou non du composant                                                                                              |
| listeMessageEmis                  |          string[ ]           | Contient les messages suivants : "perms_list_request", "create_role_request", "one_role_request", "update_role_request"            |
| listeMessageRecus                 |          string[ ]           | Contient les messages suivants : "perms_list_response", "created_role", "role_already_exists", "one_role_response", "updated_role" |
| traitementMessage (msg)           | msg est le message à traiter | Traite les message qui viennent du controleur                                                                                      |
| handleAddUpdateRole()             |            aucun             | Valide la création/modification du rôle                                                                                            |
| handleCheckboxChange()            |         role : Role          | Définit les permissions sélectionnés à associer à l'utilisateur                                                                    |

#### --> Home Perm Gestion

| Variable/Fonction                 |        Type/Variables        | Description                                                                                         |
| --------------------------------- | :--------------------------: | --------------------------------------------------------------------------------------------------- |
| [regex, setRegex]                 |            string            | Regex pour la recherche de rôle                                                                     |
| [permList, setRoleList]           |         Permission[]         | Liste des permissions                                                                               |
| [selectedPerm, setSelectedPerm]   |          Permission          | Permission sélectionnée                                                                             |
| [rows, setRows]                   |             Any              | Lignes du tableau des permissions                                                                   |
| [label, setLabel]                 |            string            | Le libellé de la permission                                                                         |
| [uuid, setUuid]                   |            string            | L'uuid de la permission                                                                             |
| [openAlert, setOpenAlert]         |           boolean            | Ouvrir/Fermer la modale d'alerte                                                                    |
| [addUpdateRole, setAddUpdateRole] |           boolean            | Définir si une permission est modifiée ou non                                                       |
| [alertSeverity, setAlertSeverity] |            string            | Type de message de la modale d'alerte                                                               |
| [alertMessage, setAlertMessage]   |            string            | Contenu du message de la modale d'alerte                                                            |
| nomDInstance                      |            string            | Nom qui identifie le composant                                                                      |
| controleur                        |                              | Pointe vers l'instance du controleur                                                                |
| verbose                           |           boolean            | Afficher les logs ou non du composant                                                               |
| listeMessageEmis                  |          string[ ]           | Contient les messages suivants : "perms_list_request", "update_perm_request", "add_perm_request"    |
| listeMessageRecus                 |          string[ ]           | Contient les messages suivants : "perms_list_response", "update_perm_response", "add_perm_response" |
| traitementMessage (msg)           | msg est le message à traiter | Traite les message qui viennent du controleur                                                       |
| handleAddUpdatePerm()             |            aucun             | Valide la création/modification de la permission                                                    |

#### --> Perm List Display

Reprends les variables de "Home Perm Gestion" pour l'affichage

## BACKEND

### Users Service

| Variable/Fonction       |                 Type/Variables                  | Description                                                                                                                                                                                                                                  |
| ----------------------- | :---------------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| controleur              |                                                 | Pointe vers l'instance du controleur                                                                                                                                                                                                         |
| verbose                 |                     boolean                     | Afficher les logs ou non du composant                                                                                                                                                                                                        |
| listeMessageEmis        |                    string[ ]                    | Contient les messages suivants : "login_response", "signup_response", "users_list_response", "update_user_response", "update_user_status_response", "update_user_roles_response", "user_perms_response", "user_info_response"                |
| listeMessageRecus       |                    string[ ]                    | Contient les messages suivants : "login_request", "signup_request", "users_list_request", "update_user_request", "update_user_status_request", "update_user_roles_request", "delete_role_request", "user_perms_request", "user_info_request" |
| constructor(c, nom)     | c est le controleur et nom le nom de l'instance | Inscrit auprès du controlleur les listes des messages émis et reçus.                                                                                                                                                                         |
| traitementMessage(mesg) |          mesg est le message à traiter          | Traite les message qui viennent du controleur                                                                                                                                                                                                |

### Roles Service

| Variable/Fonction       |                 Type/Variables                  | Description                                                                                                                                        |
| ----------------------- | :---------------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| controleur              |                                                 | Pointe vers l'instance du controleur                                                                                                               |
| verbose                 |                     boolean                     | Afficher les logs ou non du composant                                                                                                              |
| listeMessageEmis        |                    string[ ]                    | Contient les messages suivants : "roles_list_response", "one_role_response", "created_role", "role_already_exists", "updated_role", "deleted_role" |
| listeMessageRecus       |                    string[ ]                    | Contient les messages suivants : "roles_list_request", "one_role_request", "create_role_request", "update_role_request", "delete_role_request"     |
| constructor(c, nom)     | c est le controleur et nom le nom de l'instance | Inscrit auprès du controlleur les listes des messages émis et reçus.                                                                               |
| traitementMessage(mesg) |          mesg est le message à traiter          | Traite les message qui viennent du controleur                                                                                                      |

### Perms Service

| Variable/Fonction       |                 Type/Variables                  | Description                                                                                         |
| ----------------------- | :---------------------------------------------: | --------------------------------------------------------------------------------------------------- |
| controleur              |                                                 | Pointe vers l'instance du controleur                                                                |
| verbose                 |                     boolean                     | Afficher les logs ou non du composant                                                               |
| listeMessageEmis        |                    string[ ]                    | Contient les messages suivants : "perms_list_response", "update_perm_response", "add_perm_response" |
| listeMessageRecus       |                    string[ ]                    | Contient les messages suivants : "perms_list_request", "update_perm_request", "add_perm_request"    |
| constructor(c, nom)     | c est le controleur et nom le nom de l'instance | Inscrit auprès du controlleur les listes des messages émis et reçus.                                |
| traitementMessage(mesg) |          mesg est le message à traiter          | Traite les message qui viennent du controleur                                                       |
