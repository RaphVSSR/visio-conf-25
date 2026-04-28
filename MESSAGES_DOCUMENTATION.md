# Documentation des Messages – VisioConf

Ce document décrit l'ensemble des messages utilisés dans l'application VisioConf, en précisant pour chacun :

- **Format** attendu (les propriétés et leur type)
- **Exemple de contenu** (un exemple représentatif)
- **Émetteur** (la partie applicative qui envoie le message)
- **Récepteur** (la partie applicative qui traite ou consomme le message)

> **Note :** Pour la plupart des messages `request`, le message `response` correspondant a les rôles inversés :
>
> - _Émetteur de la response_ = _Récepteur de la request_
> - _Récepteur de la response_ = _Émetteur de la request_

> **Note :** Vous pouvez retrouver des types Typescript dans la colonne `Format` (ex: User, File, Role...)
>
> Au besoin, vous pouvez consulter leur contenu dans le dossier `types` (FRONTEND/types/...)

---

## 1. Authentification

### Table des messages d'authentification

| **Message**         | **Format**                                                                                                         | **Exemple de contenu**                                                                                                                            | **Émetteur**           | **Récepteur**          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------- |
| **login_request**   | { login: string, password: string }                                                                                | { login: "john_doe", password: "securepassword123" }                                                                                              | LoginPage (frontend)   | UsersService (backend) |
| **login_response**  | { etat: boolean, token?: string }                                                                                  | { etat: true, token: "abc123JWTtoken" }                                                                                                           | UsersService (backend) | LoginPage (frontend)   |
| **signup_request**  | { login: string, password: string, firstname: string, lastname: string, phone: string, job: string, desc: string } | { login: "jane_doe", password: "mypassword", firstname: "Jane", lastname: "Doe", phone: "0102030405", job: "Designer", desc: "Graphic designer" } | SignupPage (frontend)  | UsersService (backend) |
| **signup_response** | { etat: boolean, token?: string }                                                                                  | { etat: true, token: "def456JWTtoken" }                                                                                                           | UsersService (backend) | LoginPage (frontend)   |

### Composants du système (Authentification)

| **Message** | **Fichier émetteur** | **Fichier récepteur** |
|---|---|---|
| **login_request** | `FRONTEND/components/LoginForm.tsx` — composant `LoginForm` | Backend — `AuthService.ts` (routing via Controller) |
| **login_response** | Backend — `AuthService.ts` | `FRONTEND/components/LoginForm.tsx` — handler `traitementMessage` |
| **signup_request** | `FRONTEND/components/SignupForm.tsx` — composant `SignupForm` | Backend — `AuthService.ts` (routing via Controller) |
| **signup_response** | Backend — `AuthService.ts` | `FRONTEND/components/SignupForm.tsx` — handler `traitementMessage` |

> **Note :** Le champ `token` correspond à l'user.\_id encrypté au format JWT, généré par le backend lors de la connexion/inscription de l'utilisateur.

---

## 2. Utilisateurs

### Table des messages utilisateurs

| **Message**               | **Format**                                                                                          | **Exemple de contenu**                                                                                                                                                                                                                                    | **Émetteur**              | **Récepteur**             |
| ------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------- |
| **users_list_request**    | No data                                                                                             | Aucun contenu                                                                                                                                                                                                                                             | AnnuairePage (frontend)   | UsersService (backend)    |
| **users_list_response**   | { etat: boolean, users?: User[], error?: string }                                                   | { etat: true, users: [ { id: "u1", firstname: "Alice", lastname: "Dupont" "phone: "0123456789", job: "Developer", desc: "Programmer" }, { id: "u2", firstname: "John", lastname: "Dupont" "phone: "0123456789", job: "Developer", desc: "Programmer"} ] } | UsersService (backend)    | AnnuairePage (frontend)   |
| **update_user_request**   | { id?: string, firstname?: string, lastname?: string, phone?: string, job?: string, desc?: string } | { firstname: "Alice updated" }                                                                                                                                                                                                                            | ProfilePage (frontend)    | UsersService (backend)    |
| **update_user_response**  | { etat: boolean, newUserInfo: User, error?: string }                                                | { etat: true, newUserInfo: { id: "u1", firstname: "Alice updated", lastname: "Dupont" "phone: "0123456789", job: "Developer", desc: "Programmer" } }                                                                                                      | UsersService (backend)    | ProfilePage (frontend)    |
| **user_info_request**     | { user_info_request: { userId: string } }                                                           | { user_info_request: { userId: "u1" } }                                                                                                                                                                                                                   | AppContext (frontend)     | UsersService (backend)    |
| **user_info_response**    | { user_info_response: { etat: boolean, userInfo?: User, error?: string } }                          | { user_info_response: { etat: true, userInfo: { firstname:"Alice" } } }                                                                                                                                                                                   | UsersService (backend)    | AppContext (frontend)     |
| **users_search_request**  | { requestArgs: string }                                                                             | { requestArgs: "Alice" }                                                                                                                                                                                                                                  | DiscussionPage (frontend) | MessagesService (backend) |
| **users_search_response** | { etat: boolean, users?: User[], error?: string }                                                   | { etat: true, users: [ { id: "u1", firstname:"Alice" } ] }                                                                                                                                                                                                | MessagesService (backend) | DiscussionPage (frontend) |

### Composants du système (Utilisateurs)

| **Message** | **Fichier émetteur** | **Fichier récepteur** |
|---|---|---|
| **users_list_request** | `FRONTEND/app/page.tsx` (HomePage), `FRONTEND/app/annuaire/page.tsx` (AnnuairePage) | Backend - `UsersService` (routing via Controller) |
| **users_list_response** | Backend - `UsersService` | `FRONTEND/app/page.tsx` (HomePage), `FRONTEND/app/annuaire/page.tsx` (AnnuairePage) |
| **update_user_request** | `FRONTEND/app/profil/page.tsx` (ProfilPage), `FRONTEND/components/ProfilPopUp.tsx` (ProfilPopUp) | Backend - `UsersService` |
| **update_user_response** | Backend - `UsersService` | `FRONTEND/app/profil/page.tsx` (ProfilPage), `FRONTEND/components/ProfilPopUp.tsx` (ProfilPopUp) |
| **user_info_request** | `FRONTEND/context/AppContext.tsx` - `AppContextProvider` | Backend - `UsersService` |
| **user_info_response** | Backend - `UsersService` | `FRONTEND/context/AppContext.tsx` - `AppContextProvider` |
| **users_search_request** | `FRONTEND/components/discussion/Create/page.tsx` (Create), `FRONTEND/app/discussion/page.tsx` (DiscussionPage) | Backend - `MessagesService` |
| **users_search_response** | Backend - `MessagesService` | `FRONTEND/app/discussion/page.tsx` (DiscussionPage) |


> **Note :** Le champ `userId` correspond à l'identifiant unique d'un utilisateur, généré par le backend lors de la création de l'utilisateur.
> **Note :** Dans la requête `update_user_request`, le frontend envoie seulement les champs à mettre à jour.

---

## 3. Discussions & Messages

### Table des messages de discussion et messagerie

| **Message**                         | **Format**                                                                    | **Exemple de contenu**                                                                              | **Émetteur**               | **Récepteur**              |
| ----------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------- |
| **messages_get_request**            | { convId: uuid }                                                              | { convId: "4fc3b11b-5be1-4e94-9616-183d90dbf6e3" }                                                  | DiscussionPage (frontend)  | MessagesService (backend)  |
| **messages_get_response**           | { etat: boolean, messages?: Message[], error?: string }                       | { etat: true, messages: [ { id:"m1", text:"Bonjour" } ] }                                           | MessagesService (backend)  | DiscussionPage (frontend)  |
| **message_send_request**            | { userEmail: string, otherUserEmail?: string[], convId?: uuid, text: string } | { userEmail: "alice@example.com", convId: "4fc3b11b-5be1-4e94-9616-183d90dbf6e3", text: "Salut !" } | DiscussionPage (frontend)  | MessagesService (backend)  |
| **message_send_response**           | { etat: boolean, error?: string }                                             | { etat: true }                                                                                      | MessagesService (backend)  | DiscussionPage (frontend)  |
| **discuss_list_request**            | { userId: uuid }                                                              | { userId: "d2e98a2e-498c-4be3-9e67-8df9b89a4d02" }                                                  | DiscussionsPage (frontend) | MessagesService (backend)  |
| **discuss_list_response**           | { etat: boolean, discussList?: Discussion[], error?: string }                 | { etat: true, discussList: [ { convId: "c1", title: "Discussion A" } ] }                            | MessagesService (backend)  | DiscussionsPage (frontend) |
| **discuss_remove_member_request**   | { UserId: uuid, convId: uuid }                                                | { UserId: "u1", convId: "c1" }                                                                      | DiscussionsPage (frontend) | MessagesService (backend)  |
| **discuss_remove_member_response**  | { etat: boolean, error?: string }                                             | { etat: true }                                                                                      | MessagesService (backend)  | DiscussionsPage (frontend) |
| **discuss_remove_message_request**  | { messageId: uuid, convId: uuid }                                             | { messageId: "m1", convId: "c1" }                                                                   | DiscussionsPage (frontend) | MessagesService (backend)  |
| **discuss_remove_message_response** | { etat: boolean, error?: string }                                             | { etat: true }                                                                                      | MessagesService (backend)  | DiscussionsPage (frontend) |
| **calls_get_request**               | { convId: uuid }                                                              | { convId: "4fc3b11b-5be1-4e94-9616-183d90dbf6e3" }                                                  | Home (frontend)            | CallsService (backend)     |
| **calls_get_response**              | { convId: uuid }                                                              | { convId: "4fc3b11b-5be1-4e94-9616-183d90dbf6e3" }                                                  | CallsService (frontend)    | Home (backend)             |

### Composants du système (Discussions & Messages)

| **Message** | **Fichier émetteur** | **Fichier récepteur** |
|---|---|---|
| **messages_get_request** | `FRONTEND/app/page.tsx` (HomePage), `FRONTEND/app/discussion/page.tsx` (DiscussionPage), `FRONTEND/components/discussion/ChatWindow/ChatWindow.tsx` (ChatWindow) | Backend - `MessagesService` |
| **messages_get_response** | Backend - `MessagesService` | `FRONTEND/app/page.tsx` (HomePage), `FRONTEND/app/discussion/page.tsx` (DiscussionPage), `FRONTEND/components/discussion/ChatWindow/ChatWindow.tsx` (ChatWindow) |
| **message_send_request** | `FRONTEND/components/discussion/Create/page.tsx` (Create), `FRONTEND/components/discussion/ChatWindow/ChatWindow.tsx` (ChatWindow), `FRONTEND/app/annuaire/page.tsx` (AnnuairePage) | Backend - `MessagesService` |
| **message_send_response** | Backend - `MessagesService` | `FRONTEND/components/discussion/ChatWindow/ChatWindow.tsx` (ChatWindow), `FRONTEND/app/discussion/page.tsx` (DiscussionPage), `FRONTEND/app/annuaire/page.tsx` (AnnuairePage) |
| **discuss_list_request** | `FRONTEND/app/page.tsx` (HomePage), `FRONTEND/app/discussion/page.tsx` (DiscussionPage), `FRONTEND/app/annuaire/page.tsx` (AnnuairePage) | Backend - `MessagesService` |
| **discuss_list_response** | Backend - `MessagesService` | `FRONTEND/app/page.tsx` (HomePage), `FRONTEND/app/discussion/page.tsx` (DiscussionPage), `FRONTEND/app/annuaire/page.tsx` (AnnuairePage) |
| **discuss_remove_member_request** | `FRONTEND/app/discussion/page.tsx` (DiscussionPage) | Backend - `MessagesService` |
| **discuss_remove_member_response** | Backend - `MessagesService` | `FRONTEND/app/discussion/page.tsx` (DiscussionPage) |
| **discuss_remove_message_request** | `FRONTEND/app/discussion/page.tsx` (DiscussionPage) | Backend - `MessagesService` |
| **discuss_remove_message_response** | Backend - `MessagesService` | `FRONTEND/app/discussion/page.tsx` (DiscussionPage) |
| **calls_get_request** | `FRONTEND/app/page.tsx` (HomePage) | Backend - `CallsService` |
| **calls_get_response** | Backend - `CallsService` | `FRONTEND/app/page.tsx` (HomePage) |


---

## 4. Rôles & Permissions

### Table des messages concernant les rôles et permissions

| **Message**             | **Format**                                      | **Exemple de contenu**                                             | **Émetteur**               | **Récepteur**              |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------ | -------------------------- | -------------------------- |
| **roles_list_request**  | No data                                         | Aucun contenu                                                      | RoleListDisplay (frontend) | RolesService (backend)     |
| **roles_list_response** | { role_list: Role[] }                           | { role_list: [ { id:"r1", name:"Admin" } ] }                       | RolesService (backend)     | RoleListDisplay (frontend) |
| **one_role_request**    | { role_id: ObjectId }                           | { role_id: "r1" }                                                  | AddUpdateRole (frontend)   | RolesService (backend)     |
| **one_role_response**   | { role: Role }                                  | { role: { id:"r1", name:"Admin", perms: [ "p1", "p2" ] } }         | RolesService (backend)     | AddUpdateRole (frontend)   |
| **create_role_request** | { name: string, perms: Permission.\_id[] }      | { name: "Editor", perms: [ "p3", "p4" ] }                          | AddUpdateRole (frontend)   | RolesService (backend)     |
| **created_role**        | { role_id: ObjectId }                           | { role_id: "r2" }                                                  | RolesService (backend)     | AddUpdateRole (frontend)   |
| **update_role_request** | { role_id: ObjectId, perms: Permission.\_id[] } | { role_id: "r1", perms: [ "p1", "p3" ] }                           | AddUpdateRole (frontend)   | RolesService (backend)     |
| **updated_role**        | { state: boolean }                              | { state: true }                                                    | RolesService (backend)     | AddUpdateRole (frontend)   |
| **delete_role_request** | { role_id: ObjectId }                           | { role_id: "r1" }                                                  | RoleListDisplay (frontend) | RolesService (backend)     |
| **deleted_role**        | { state: boolean }                              | { state: true }                                                    | RolesService (backend)     | RoleListDisplay (frontend) |
| **perms_list_request**  | No data                                         | Aucun contenu                                                      | AddUpdateRole (frontend)   | RolesService (backend)     |
| **perms_list_response** | { perms?: Permission[] }                        | { perms: [ { id:"p1", name:"READ" }, { id:"p2", name:"WRITE" } ] } | RolesService (backend)     | AddUpdateRole (frontend)   |

### Composants du système (Rôles & Permissions)

| **Message** | **Fichier émetteur** | **Fichier récepteur** |
|---|---|---|
| **roles_list_request** | `FRONTEND/components/admin/role_gestion/HomeRoleGestion.tsx` (HomeRoleGestion), `FRONTEND/components/admin/user_gestion/UpdateUserRole.tsx` (UpdateUserRole) | Backend - `RolesService` |
| **roles_list_response** | Backend - `RolesService` | `FRONTEND/components/admin/role_gestion/HomeRoleGestion.tsx`, `FRONTEND/components/admin/role_gestion/AddUpdateRole.tsx`, `FRONTEND/components/admin/user_gestion/UpdateUserRole.tsx` |
| **one_role_request** | `FRONTEND/components/admin/role_gestion/AddUpdateRole.tsx` (AddUpdateRole), `FRONTEND/components/admin/team_gestion/AddUpdateTeam.tsx` (AddUpdateTeam) | Backend - `RolesService` |
| **one_role_response** | Backend - `RolesService` | `FRONTEND/components/admin/role_gestion/AddUpdateRole.tsx` (AddUpdateRole) |
| **create_role_request** | `FRONTEND/components/admin/role_gestion/HomeRoleGestion.tsx`, `FRONTEND/components/admin/role_gestion/AddUpdateRole.tsx` | Backend - `RolesService` |
| **created_role** | Backend - `RolesService` | `FRONTEND/components/admin/role_gestion/HomeRoleGestion.tsx`, `FRONTEND/components/admin/role_gestion/AddUpdateRole.tsx` |
| **update_role_request** | `FRONTEND/components/admin/role_gestion/AddUpdateRole.tsx` (AddUpdateRole) | Backend - `RolesService` |
| **updated_role** | Backend - `RolesService` | `FRONTEND/components/admin/role_gestion/HomeRoleGestion.tsx`, `FRONTEND/components/admin/role_gestion/AddUpdateRole.tsx` |
| **delete_role_request** | `FRONTEND/components/admin/role_gestion/HomeRoleGestion.tsx` (HomeRoleGestion) | Backend - `RolesService` |
| **deleted_role** | Backend - `RolesService` | `FRONTEND/components/admin/role_gestion/HomeRoleGestion.tsx` (HomeRoleGestion) |
| **perms_list_request** | `FRONTEND/components/admin/role_gestion/AddUpdateRole.tsx`, `FRONTEND/components/admin/perm_gestion/HomePermGestion.tsx` | Backend - `RolesService` |
| **perms_list_response** | Backend - `RolesService` | `FRONTEND/components/admin/role_gestion/AddUpdateRole.tsx`, `FRONTEND/components/admin/perm_gestion/HomePermGestion.tsx` |


---

## 5. Fichiers & Dossiers

### Table des messages liés aux fichiers et dossiers

| **Message**                     | **Format**                                                                                             | **Exemple de contenu**                                                                     | **Émetteur**           | **Récepteur**          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------- | ---------------------- |
| **files_list_request**          | { folderId?: string }                                                                                  | { folderId: "folder123" } ou Aucun contenu                                                 | FilesPage (frontend)   | DriveService (backend) |
| **files_list_response**         | { etat: boolean, files?: File[], error?: string }                                                      | { etat: true, files: [ { id:"f1", name:"doc.pdf" } ] }                                     | DriveService (backend) | FilesPage (frontend)   |
| **file_upload_request**         | { userId: string, name: string, size: number, mimeType: string, extension: string, parentId?: number } | { name: "image.png", size: 2048, mimeType: "image/png", extension: ".png"}                 | FilePage (frontend)    | DriveService (backend) |
| **file_upload_response**        | { etat: boolean, error?: string, signedUrl? }                                                          | { etat: true, signedUrl: "https://visioconfbucket.s3.eu-north-1.amazonaws.com/files/..." } | DriveService (backend) | FilePage (frontend)    |
| **file_delete_request**         | { fileId: string }                                                                                     | { fileId: "f123" }                                                                         | FilesPage (frontend)   | DriveService (backend) |
| **file_delete_response**        | { etat: boolean, error?: string }                                                                      | { etat: true }                                                                             | DriveService (backend) | FilesPage (frontend)   |
| **file_rename_request**         | { fileId: string, newName: string }                                                                    | { fileId: "f123", newName: "Nouveau nom" }                                                 | FilesPage (frontend)   | DriveService (backend) |
| **file_rename_response**        | { etat: boolean, error?: string }                                                                      | { etat: true }                                                                             | DriveService (backend) | FilesPage (frontend)   |
| **file_move_request**           | { fileId: string, newParentId: string }                                                                | { fileId: "f123" }                                                                         | FilesPage (frontend)   | DriveService (backend) |
| **file_move_response**          | { etat: boolean, error?: string }                                                                      | { etat: true }                                                                             | DriveService (backend) | FilesPage (frontend)   |
| **file_share_to_team_request**  | { fileId: string, teamId: string }                                                                     | { fileId: "f123", teamId: "t456" }                                                         | FilesPage (frontend)   | DriveService (backend) |
| **file_share_to_team_response** | { etat: boolean, fileId?: string, teamId?: string, error?: string }                                    | { etat: true, fileId: "f123", teamId: "t456" }                                             | DriveService (backend) | FilesPage (frontend)   |
| **folder_create_request**       | { name: string, parentId?: string }                                                                    | { name: "Mon dossier" }                                                                    | DriveService (backend) | FilesPage (frontend)   |
| **folder_create_response**      | { etat: boolean, error?: string }                                                                      | { etat: true }                                                                             | DriveService (backend) | FilesPage (frontend)   |

### Composants du système (Fichiers & Dossiers)

| **Message** | **Fichier émetteur** | **Fichier récepteur** |
|---|---|---|
| **files_list_request** | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) | Backend - `DriveService` (routing via Controller) |
| **files_list_response** | Backend - `DriveService` | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) |
| **file_upload_request** | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) | Backend - `DriveService` |
| **file_upload_response** | Backend - `DriveService` | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) |
| **file_delete_request** | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) | Backend - `DriveService` |
| **file_delete_response** | Backend - `DriveService` | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) |
| **file_rename_request** | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) | Backend - `DriveService` |
| **file_rename_response** | Backend - `DriveService` | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) |
| **file_move_request** | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) | Backend - `DriveService` |
| **file_move_response** | Backend - `DriveService` | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) |
| **file_share_to_team_request** | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) | Backend - `DriveService` |
| **file_share_to_team_response** | Backend - `DriveService` | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) |
| **folder_create_request** | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) | Backend - `DriveService` |
| **folder_create_response** | Backend - `DriveService` | `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) |


> **Note :** Ces messages gèrent l'accès aux fichiers et dossiers des utilisateurs. Les fichiers sont identifiés par des ID uniques.

---

## 6. Admin

### Table des messages liés à la page Admin

| **Message**               | **Format**           | **Exemple de contenu** | **Émetteur**           | **Récepteur**          |
| ------------------------- | -------------------- | ---------------------- | ---------------------- | ---------------------- |
| **ban_user_request**      | { userId?: string }  | { userId: "1" }        | FilesPage (frontend)   | DriveService (backend) |
| **disable_user_request**  | { userId?: string }  | { userId: "1" }        | DriveService (backend) | FilesPage (frontend)   |
| **ban_user_response**     | { success: boolean } | { success: true }      | FilePage (frontend)    | DriveService (backend) |
| **disable_user_response** | { success: boolean } | { success: true }      | DriveService (backend) | FilePage (frontend)    |

### Composants du système (Admin)

| **Message** | **Fichier émetteur** | **Fichier récepteur** |
|---|---|---|
| **ban_user_request** | `FRONTEND/components/admin/user_gestion/HomeUserGestion.tsx` (HomeUserGestion) | Backend - `AdminService` (routing via Controller) |
| **disable_user_request** | `FRONTEND/components/admin/user_gestion/HomeUserGestion.tsx` (HomeUserGestion) | Backend - `AdminService` |
| **ban_user_response** | Backend - `AdminService` | `FRONTEND/components/admin/user_gestion/HomeUserGestion.tsx` (HomeUserGestion) |
| **disable_user_response** | Backend - `AdminService` | `FRONTEND/components/admin/user_gestion/HomeUserGestion.tsx` (HomeUserGestion) |


> **Note :** Ces messages gèrent l'accès aux fichiers et dossiers des utilisateurs. Les fichiers sont identifiés par des ID uniques.

---

## 7. Équipes

### Table des messages liés aux équipes

| **Message**                     | **Format**                                                                                                                | **Exemple de contenu**                                                                                                            | **Émetteur**               | **Récepteur**              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------- |
| **teams_list_request**          | No data                                                                                                                   | Aucun contenu                                                                                                                     | EquipesPage (frontend)     | TeamsService (backend)     |
| **teams_list_response**         | { etat: boolean, teams?: Team[], error?: string }                                                                         | { etat: true, teams: [{ id: "t1", name: "Marketing", description: "Équipe marketing", createdBy: "u1", role: "admin" }] }         | TeamsService (backend)     | EquipesPage (frontend)     |
| **team_create_request**         | { name: string, description?: string }                                                                                    | { name: "Développement", description: "Équipe des développeurs" }                                                                 | TeamForm (frontend)        | TeamsService (backend)     |
| **team_create_response**        | { etat: boolean, team?: Team, error?: string }                                                                            | { etat: true, team: { id: "t2", name: "Développement", description: "Équipe des développeurs", createdBy: "u1", role: "admin" } } | TeamsService (backend)     | TeamForm (frontend)        |
| **team_update_request**         | { id: string, name?: string, description?: string }                                                                       | { id: "t1", name: "Marketing Digital", description: "Équipe de marketing en ligne" }                                              | TeamForm (frontend)        | TeamsService (backend)     |
| **team_update_response**        | { etat: boolean, team?: Team, error?: string }                                                                            | { etat: true, team: { id: "t1", name: "Marketing Digital", description: "Équipe de marketing en ligne", createdBy: "u1" } }       | TeamsService (backend)     | TeamForm (frontend)        |
| **team_delete_request**         | { teamId: string }                                                                                                        | { teamId: "t1" }                                                                                                                  | TeamForm (frontend)        | TeamsService (backend)     |
| **team_delete_response**        | { etat: boolean, teamId?: string, error?: string }                                                                        | { etat: true, teamId: "t1" }                                                                                                      | TeamsService (backend)     | TeamForm (frontend)        |
| **team_leave_request**          | { teamId: string }                                                                                                        | { teamId: "t1" }                                                                                                                  | EquipesPage (frontend)     | TeamsService (backend)     |
| **team_leave_response**         | { etat: boolean, teamId?: string, error?: string }                                                                        | { etat: true, teamId: "t1" }                                                                                                      | TeamsService (backend)     | EquipesPage (frontend)     |
| **team_members_request**        | { teamId: string }                                                                                                        | { teamId: "t1" }                                                                                                                  | TeamMembersForm (frontend) | TeamsService (backend)     |
| **team_members_response**       | { etat: boolean, teamId?: string, members?: TeamMember[], error?: string }                                                | { etat: true, teamId: "t1", members: [{ id: "m1", userId: "u1", firstname: "John", lastname: "Doe", role: "admin" }] }            | TeamsService (backend)     | TeamMembersForm (frontend) |
| **team_add_member_request**     | { teamId: string, userId: string }                                                                                        | { teamId: "t1", userId: "u3" }                                                                                                    | TeamMembersForm (frontend) | TeamsService (backend)     |
| **team_add_member_response**    | { etat: boolean, teamId?: string, member?: TeamMember, error?: string }                                                   | { etat: true, teamId: "t1", member: { id: "m3", teamId: "t1", userId: "u3", role: "member", joinedAt: "2023-01-15T14:30:00Z" } }  | TeamsService (backend)     | TeamMembersForm (frontend) |
| **team_remove_member_request**  | { teamId: string, userId: string }                                                                                        | { teamId: "t1", userId: "u3" }                                                                                                    | TeamMembersForm (frontend) | TeamsService (backend)     |
| **team_remove_member_response** | { etat: boolean, teamId?: string, userId?: string, error?: string }                                                       | { etat: true, teamId: "t1", userId: "u3" }                                                                                        | TeamsService (backend)     | TeamMembersForm (frontend) |
| **all_teams_request**           | No Data                                                                                                                   | Aucun contenu                                                                                                                     | HomeUserGestion (frontend) | TeamServices (backend)     |
| **all_teams_response**          | { etat: boolean, teams?: {\_id: string, name: string, numberOfParticipants: number}[ ], userId?: string, error?: string } | { etat: true, teams: [ {_id: 1, name: "Equipe1", numberOfParticipants: 3} ], userId?: "u3" }                                      | TeamsService (backend)     | HomeTeamGestion (frontend) |

### Composants du système (Équipes)

| **Message** | **Fichier émetteur** | **Fichier récepteur** |
|---|---|---|
| **teams_list_request** | `FRONTEND/app/equipes/page.tsx` (EquipesPage), `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) | Backend - `TeamsService` |
| **teams_list_response** | Backend - `TeamsService` | `FRONTEND/app/equipes/page.tsx` (EquipesPage), `FRONTEND/app/files/components/TabbedFileExplorer.tsx` (TabbedFileExplorer) |
| **team_create_request** | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm), `FRONTEND/components/admin/team_gestion/AddUpdateTeam.tsx` (AddUpdateTeam) | Backend - `TeamsService` |
| **team_create_response** | Backend - `TeamsService` | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm), `FRONTEND/components/admin/team_gestion/AddUpdateTeam.tsx` (AddUpdateTeam) |
| **team_update_request** | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm), `FRONTEND/components/admin/team_gestion/AddUpdateTeam.tsx` (AddUpdateTeam) | Backend - `TeamsService` |
| **team_update_response** | Backend - `TeamsService` | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm) |
| **team_delete_request** | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm) | Backend - `TeamsService` |
| **team_delete_response** | Backend - `TeamsService` | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm) |
| **team_leave_request** | `FRONTEND/app/equipes/page.tsx` (EquipesPage) | Backend - `TeamsService` |
| **team_leave_response** | Backend - `TeamsService` | `FRONTEND/app/equipes/page.tsx` (EquipesPage) |
| **team_members_request** | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm), `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm) | Backend - `TeamsService` |
| **team_members_response** | Backend - `TeamsService` | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm), `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm) |
| **team_add_member_request** | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm) | Backend - `TeamsService` |
| **team_add_member_response** | Backend - `TeamsService` | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm) |
| **team_remove_member_request** | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm) | Backend - `TeamsService` |
| **team_remove_member_response** | Backend - `TeamsService` | `FRONTEND/app/equipes/components/teams/TeamForm.tsx` (TeamForm) |
| **all_teams_request** | `FRONTEND/components/admin/user_gestion/HomeUserGestion.tsx` (HomeUserGestion) | Backend - `TeamsService` |
| **all_teams_response** | Backend - `TeamsService` | `FRONTEND/components/admin/team_gestion/HomeTeamGestion.tsx` (HomeTeamGestion) |


> **Note :** Les messages liés aux équipes permettent de gérer la création, la modification et la suppression d'équipes, ainsi que la gestion de leurs membres. Le rôle "admin" donne des droits spécifiques sur l'équipe.

---

## 8. Canaux

### Table des messages liés aux canaux

| **Message**                               | **Format**                                                                       | **Exemple de contenu**                                                                                                                                                                                          | **Émetteur**                  | **Récepteur**                 |
| ----------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------- |
| **channels_list_request**                 | { teamId?: string }                                                              | { teamId: "t1" }                                                                                                                                                                                                | EquipesPage (frontend)        | ChannelsService (backend)     |
| **channels_list_response**                | { etat: boolean, channels?: Channel[], error?: string }                          | { etat: true, channels: [{ id: "c1", name: "Général", teamId: "t1", isPublic: true, isMember: true }] }                                                                                                         | ChannelsService (backend)     | EquipesPage (frontend)        |
| **channel_create_request**                | { name: string, teamId: string, isPublic: boolean, members?: string[] }          | { name: "Marketing", teamId: "t1", isPublic: false, members: ["u2", "u3"] }                                                                                                                                     | ChannelForm (frontend)        | ChannelsService (backend)     |
| **channel_create_response**               | { etat: boolean, channel?: Channel, error?: string }                             | { etat: true, channel: { id: "c2", name: "Marketing", teamId: "t1", isPublic: false } }                                                                                                                         | ChannelsService (backend)     | ChannelForm (frontend)        |
| **channel_update_request**                | { id: string, name?: string, isPublic?: boolean }                                | { id: "c1", name: "Général Updated", isPublic: true }                                                                                                                                                           | ChannelForm (frontend)        | ChannelsService (backend)     |
| **channel_update_response**               | { etat: boolean, channel?: Channel, error?: string }                             | { etat: true, channel: { id: "c1", name: "Général Updated", teamId: "t1", isPublic: true } }                                                                                                                    | ChannelsService (backend)     | ChannelForm (frontend)        |
| **channel_delete_request**                | { channelId: string }                                                            | { channelId: "c1" }                                                                                                                                                                                             | ChannelForm (frontend)        | ChannelsService (backend)     |
| **channel_delete_response**               | { etat: boolean, channelId?: string, error?: string }                            | { etat: true, channelId: "c1" }                                                                                                                                                                                 | ChannelsService (backend)     | ChannelForm (frontend)        |
| **channel_leave_request**                 | { channelId: string }                                                            | { channelId: "c1" }                                                                                                                                                                                             | ChannelView (frontend)        | ChannelsService (backend)     |
| **channel_leave_response**                | { etat: boolean, channelId?: string, error?: string }                            | { etat: true, channelId: "c1" }                                                                                                                                                                                 | ChannelsService (backend)     | ChannelView (frontend)        |
| **channel_members_request**               | { channelId: string }                                                            | { channelId: "c1" }                                                                                                                                                                                             | ChannelView (frontend)        | ChannelsService (backend)     |
| **channel_members_response**              | { etat: boolean, channelId?: string, members?: ChannelMember[], error?: string } | { etat: true, channelId: "c1", members: [{ id: "cm1", userId: "u1", firstname: "John", lastname: "Doe", role: "admin" }] }                                                                                      | ChannelsService (backend)     | ChannelView (frontend)        |
| **channel_add_member_request**            | { channelId: string, userId: string }                                            | { channelId: "c1", userId: "u3" }                                                                                                                                                                               | ChannelForm (frontend)        | ChannelsService (backend)     |
| **channel_add_member_response**           | { etat: boolean, channelId?: string, member?: ChannelMember, error?: string }    | { etat: true, channelId: "c1", member: { id: "cm3", channelId: "c1", userId: "u3", role: "member" } }                                                                                                           | ChannelsService (backend)     | ChannelForm (frontend)        |
| **channel_remove_member_request**         | { channelId: string, userId: string }                                            | { channelId: "c1", userId: "u3" }                                                                                                                                                                               | ChannelForm (frontend)        | ChannelsService (backend)     |
| **channel_remove_member_response**        | { etat: boolean, channelId?: string, userId?: string, error?: string }           | { etat: true, channelId: "c1", userId: "u3" }                                                                                                                                                                   | ChannelsService (backend)     | ChannelForm (frontend)        |
| **channel_posts_request**                 | { channelId: string }                                                            | { channelId: "c1" }                                                                                                                                                                                             | ChannelView (frontend)        | ChannelPostsService (backend) |
| **channel_posts_response**                | { etat: boolean, posts?: ChannelPost[], error?: string }                         | { etat: true, posts: [{ id: "p1", channelId: "c1", content: "Bonjour à tous", authorId: "u1" , authorName: "John Doe", authorAvatar: "placeholder.png", createdAt: Date, updatedAt: Date, responseCount: 3 }] } | ChannelPostsService (backend) | ChannelView (frontend)        |
| **channel_post_create_request**           | { channelId: string, content: string }                                           | { channelId: "c1", content: "Nouveau message pour l'équipe" }                                                                                                                                                   | ChannelView (frontend)        | ChannelPostsService (backend) |
| **channel_post_create_response**          | { etat: boolean, post?: ChannelPost, error?: string }                            | { etat: true, post: { id: "p2", channelId: "c1", content: "Nouveau message pour l'équipe", authorId: "u1" } }                                                                                                   | ChannelPostsService (backend) | ChannelView (frontend)        |
| **channel_post_response_create_request**  | { postId: string, content: string }                                              | { postId: "p1", content: "Réponse à un message" }                                                                                                                                                               | PostItem (frontend)           | ChannelPostsService (backend) |
| **channel_post_response_create_response** | { etat: boolean, response?: ChannelPostResponse, error?: string }                | { etat: true, response: { id: "r1", postId: "p1", content: "Réponse à un message", authorId: "u1" , authorName: "John Trois", authorAvatar: "placeholder.png", createdAt: Date, updatedAt: Date } }             | ChannelPostsService (backend) | PostItem (frontend)           |

### Composants du système (Canaux)

| **Message** | **Fichier émetteur** | **Fichier récepteur** |
|---|---|---|
| **channels_list_request** | `FRONTEND/app/equipes/page.tsx` (EquipesPage) | Backend - `ChannelsService` |
| **channels_list_response** | Backend - `ChannelsService` | `FRONTEND/app/equipes/page.tsx` (EquipesPage) |
| **channel_create_request** | `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm) | Backend - `ChannelsService` |
| **channel_create_response** | Backend - `ChannelsService` | `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm) |
| **channel_update_request** | `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm) | Backend - `ChannelsService` |
| **channel_update_response** | Backend - `ChannelsService` | `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm) |
| **channel_delete_request** | `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm), `FRONTEND/app/equipes/components/channels/ChannelView.tsx` (ChannelView) | Backend - `ChannelsService` |
| **channel_delete_response** | Backend - `ChannelsService` | `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm), `FRONTEND/app/equipes/components/channels/ChannelView.tsx` (ChannelView) |
| **channel_leave_request** | `FRONTEND/app/equipes/components/channels/ChannelView.tsx` (ChannelView) | Backend - `ChannelsService` |
| **channel_leave_response** | Backend - `ChannelsService` | `FRONTEND/app/equipes/components/channels/ChannelView.tsx` (ChannelView) |
| **channel_members_request** | `FRONTEND/app/equipes/components/channels/ChannelView.tsx` (ChannelView) | Backend - `ChannelsService` |
| **channel_members_response** | Backend - `ChannelsService` | `FRONTEND/app/equipes/components/channels/ChannelView.tsx` (ChannelView) |
| **channel_add_member_request** | `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm) | Backend - `ChannelsService` |
| **channel_add_member_response** | Backend - `ChannelsService` | `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm) |
| **channel_remove_member_request** | `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm) | Backend - `ChannelsService` |
| **channel_remove_member_response** | Backend - `ChannelsService` | `FRONTEND/app/equipes/components/channels/ChannelForm.tsx` (ChannelForm) |
| **channel_posts_request** | `FRONTEND/app/equipes/components/channels/ChannelView.tsx` (ChannelView) | Backend - `ChannelPostsService` |
| **channel_posts_response** | Backend - `ChannelPostsService` | `FRONTEND/app/equipes/components/channels/ChannelView.tsx` (ChannelView) |
| **channel_post_create_request** | `FRONTEND/app/equipes/components/channels/ChannelView.tsx` (ChannelView) | Backend - `ChannelPostsService` |
| **channel_post_create_response** | Backend - `ChannelPostsService` | `FRONTEND/app/equipes/components/channels/ChannelView.tsx` (ChannelView) |
| **channel_post_response_create_request** | `FRONTEND/app/equipes/components/channels/PostItem.tsx` (PostItem) | Backend - `ChannelPostsService` |
| **channel_post_response_create_response** | Backend - `ChannelPostsService` | `FRONTEND/app/equipes/components/channels/PostItem.tsx` (PostItem) |


> **Note :** Les canaux sont des espaces de discussion au sein des équipes. Ils peuvent être publics (tous les membres de l'équipe peuvent les rejoindre) ou privés (sur invitation uniquement). La communication au sein des canaux se fait via des posts et des réponses à ces posts.

---

## 9. Appels Audio / Vidéo

Les messages d'appel audio/vidéo utilisent le protocole WebRTC pour la communication peer-to-peer, avec Socket.IO comme couche de signalisation. Le backend sert de relais pour les messages de signalisation mais ne traite jamais les flux audio/vidéo.

> **Note :** Les types TypeScript référencés ci-dessous sont définis dans `FRONTENDV2/src/types/Call.ts`.

---

### 9.0 — `authenticate:session`

**Description :** Authentifie le socket de l'utilisateur au moment de la connexion. Associe le `userId` au socket côté serveur pour pouvoir router les messages d'appel.

**Structure JSON attendue :**

```json
{
  "userId": "string"
}
```

**Exemple de flux :**

```
Client (Alice) → Serveur
{ "userId": "6601a2f3e4b0c12d34567890" }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `useCallBase.ts` — hook `useCallBase()` |
| Récepteur | `SocketIO.ts` — handler `connection` |

**Qui envoie :** Le **frontend** (via `useCallBase`) émet ce message automatiquement à la connexion socket.

**Qui reçoit et que fait-il :** Le **backend** (`SocketIO.ts`) stocke le `userId` dans `socket.data.userId`. Cet identifiant est ensuite utilisé par `CallSignaling` pour router les messages d'appel vers le bon socket.

---

### 9.1 — `contacts:list`

**Description :** Demande la liste des contacts disponibles pour initier un appel.

**Structure JSON attendue :**

```json
{
  "excludeEmail": "string (optionnel)"
}
```

**Exemple de flux :**

```
Client (Alice) → Serveur
{ "excludeEmail": "alice@example.com" }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `ContactPickerModal.tsx` — composant `ContactPickerModal` |
| Récepteur | `SocketIO.ts` — handler `contacts:list` |

**Qui envoie :** Le **frontend** (`ContactPickerModal`) émet ce message quand l'utilisateur ouvre le sélecteur de contacts pour lancer un appel.

**Qui reçoit et que fait-il :** Le **backend** (`SocketIO.ts`) interroge la base de données pour récupérer tous les utilisateurs sauf celui exclu, puis répond avec `contacts:list:response`.

---

### 9.1b — `contacts:list:response`

**Description :** Retourne la liste des contacts avec leur statut en ligne.

**Structure JSON attendue :**

```json
[
  {
    "id": "string",
    "firstname": "string",
    "lastname": "string",
    "picture": "string",
    "is_online": "boolean"
  }
]
```

**Exemple de flux :**

```
Serveur → Client (Alice)
[
    { "id": "6601a2f3...", "firstname": "Bob", "lastname": "Martin", "picture": "bob.png", "is_online": true },
    { "id": "6601b4c5...", "firstname": "Charlie", "lastname": "Dupont", "picture": "", "is_online": false }
]
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `SocketIO.ts` — handler `contacts:list` |
| Récepteur | `ContactPickerModal.tsx` — listener `contacts:list:response` |

**Qui envoie :** Le **backend** (`SocketIO.ts`) après avoir récupéré les utilisateurs en base.

**Qui reçoit et que fait-il :** Le **frontend** (`ContactPickerModal`) affiche la liste des contacts avec indicateur de présence. Retourne un tableau vide `[]` en cas d'erreur.

---

### 9.2 — `call:initiate`

**Description :** Initie un nouvel appel audio ou vidéo vers un ou plusieurs utilisateurs.

**Structure JSON attendue :**

```json
{
  "callId": "string",
  "callType": "'audio' | 'video' (optionnel, défaut: 'audio')",
  "targetUserIds": "string[]",
  "callerName": "string",
  "callerPicture": "string",
  "isGroupCall": "boolean"
}
```

**Exemple de flux :**

```
Client (Alice) → Serveur
{
    "callId": "call-550e8400-e29b-41d4-a716-446655440000",
    "callType": "audio",
    "targetUserIds": ["6601b4c5e4b0c12d34567891"],
    "callerName": "Alice Dupont",
    "callerPicture": "alice.png",
    "isGroupCall": false
}
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `useCallBase.ts` — fonction `startCall()` |
| Récepteur | `CallSignaling.ts` — méthode `handleInitiate()` |
| Store | `ActiveCallStore.ts` — stockage de l'appel actif |

**Qui envoie :** Le **frontend** (`useCallBase`) quand l'utilisateur clique sur le bouton d'appel après avoir sélectionné ses contacts. Le `callId` est généré côté client via `crypto.randomUUID()`.

**Qui reçoit et que fait-il :** Le **backend** (`CallSignaling`) :

1. Vérifie que l'appelant n'est pas déjà en appel (sinon → `call:error`)
2. Crée l'appel dans `ActiveCallStore`
3. Ajoute l'appelant comme premier participant
4. Joint le socket à la room `call:{callId}`
5. Envoie `call:incoming` à chaque `targetUserId`

---

### 9.3 — `call:incoming`

**Description :** Notifie un utilisateur qu'il reçoit un appel entrant. Déclenche l'affichage du `IncomingCallModal` et la sonnerie.

**Structure JSON attendue :**

```json
{
  "callId": "string",
  "callType": "'audio' | 'video'",
  "callerId": "string",
  "callerName": "string",
  "callerPicture": "string",
  "isGroupCall": "boolean",
  "participants": "ParticipantInfo[]"
}
```

**Exemple de flux :**

```
Serveur → Client (Bob)
{
    "callId": "call-550e8400-e29b-41d4-a716-446655440000",
    "callType": "audio",
    "callerId": "6601a2f3e4b0c12d34567890",
    "callerName": "Alice Dupont",
    "callerPicture": "alice.png",
    "isGroupCall": false,
    "participants": [
        { "userId": "6601a2f3...", "socketId": "abc123", "firstname": "Alice", "lastname": "Dupont", "picture": "alice.png", "joinedAt": 1709712000000 }
    ]
}
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `CallSignaling.ts` — méthode `handleInitiate()` |
| Récepteur | `useCallSocketListeners.ts` — listener `call:incoming` |
| UI | `IncomingCallModal.tsx` — affichage modal + sonnerie |

**Qui envoie :** Le **backend** (`CallSignaling`) envoie ce message individuellement à chaque socket cible (pas en broadcast room, car les cibles n'ont pas encore rejoint la room).

**Qui reçoit et que fait-il :** Le **frontend** (`useCallSocketListeners`) :

1. Stocke les informations de l'appel dans le state `incomingCall`
2. Le composant `IncomingCallModal` s'affiche avec le nom/photo de l'appelant
3. La sonnerie (`ringtone.mp3`) se lance en boucle
4. L'utilisateur peut accepter (`acceptCall`) ou refuser (`rejectCall`)

---

### 9.4 — `call:error`

**Description :** Signale une erreur lors d'une opération d'appel (ex: l'utilisateur est déjà en appel).

**Structure JSON attendue :**

```json
{
  "message": "string"
}
```

**Exemple de flux :**

```
Serveur → Client (Alice)
{ "message": "You are already in a call" }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `CallSignaling.ts` — méthode `handleInitiate()` |
| Récepteur | `useCallSocketListeners.ts` — listener `call:error` |

**Qui envoie :** Le **backend** (`CallSignaling`) quand une opération d'appel échoue.

**Qui reçoit et que fait-il :** Le **frontend** (`useCallSocketListeners`) log l'erreur dans la console et nettoie l'état de l'appel en cours.

---

### 9.5 — `call:accept`

**Description :** L'utilisateur destinataire accepte l'appel entrant.

**Structure JSON attendue :**

```json
{
  "callId": "string",
  "userName": "string",
  "userPicture": "string"
}
```

**Exemple de flux :**

```
Client (Bob) → Serveur
{
    "callId": "call-550e8400-e29b-41d4-a716-446655440000",
    "userName": "Bob Martin",
    "userPicture": "bob.png"
}
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `useCallBase.ts` — fonction `acceptCall()` |
| Récepteur | `CallSignaling.ts` — méthode `handleAccept()` |

**Qui envoie :** Le **frontend** (`useCallBase`) quand l'utilisateur clique sur le bouton accepter dans `IncomingCallModal`.

**Qui reçoit et que fait-il :** Le **backend** (`CallSignaling`) :

1. Ajoute l'utilisateur comme participant dans `ActiveCallStore`
2. Joint le socket à la room `call:{callId}`
3. Broadcast `call:user-joined` aux autres participants de la room
4. Envoie `call:participants-list` uniquement au nouvel arrivant

---

### 9.6 — `call:user-joined`

**Description :** Notifie les participants existants qu'un nouvel utilisateur a rejoint l'appel.

**Structure JSON attendue :**

```json
{
  "callId": "string",
  "userId": "string",
  "userName": "string",
  "userPicture": "string",
  "socketId": "string"
}
```

**Exemple de flux :**

```
Serveur → Room call:{callId} (sauf Bob)
{
    "callId": "call-550e8400-e29b-41d4-a716-446655440000",
    "userId": "6601b4c5e4b0c12d34567891",
    "userName": "Bob Martin",
    "userPicture": "bob.png",
    "socketId": "xyz789"
}
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `CallSignaling.ts` — méthode `handleAccept()` |
| Récepteur | `useCallSocketListeners.ts` — listener `call:user-joined` |

**Qui envoie :** Le **backend** (`CallSignaling`) en broadcast à la room (via `socket.to()`, exclut l'émetteur).

**Qui reçoit et que fait-il :** Le **frontend** (`useCallSocketListeners`) ajoute le nouveau participant à la liste et initie une connexion WebRTC (envoi d'un `call:offer`) vers ce nouveau pair.

---

### 9.7 — `call:participants-list`

**Description :** Envoie la liste des participants déjà présents dans l'appel au nouvel arrivant.

**Structure JSON attendue :**

```json
{
  "callId": "string",
  "participants": [
    {
      "userId": "string",
      "socketId": "string",
      "firstname": "string",
      "lastname": "string",
      "picture": "string",
      "joinedAt": "number (timestamp ms)"
    }
  ]
}
```

**Exemple de flux :**

```
Serveur → Client (Bob, le nouvel arrivant)
{
    "callId": "call-550e8400-e29b-41d4-a716-446655440000",
    "participants": [
        { "userId": "6601a2f3...", "socketId": "abc123", "firstname": "Alice", "lastname": "Dupont", "picture": "alice.png", "joinedAt": 1709712000000 }
    ]
}
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `CallSignaling.ts` — méthode `handleAccept()` |
| Récepteur | `useCallSocketListeners.ts` — listener `call:participants-list` |
| WebRTC | `usePeerConnections.ts` — création des offres SDP |

**Qui envoie :** Le **backend** (`CallSignaling`) envoie uniquement au socket du nouvel arrivant (pas broadcast).

**Qui reçoit et que fait-il :** Le **frontend** (`useCallSocketListeners`) reçoit la liste et, pour chaque participant existant, crée une `RTCPeerConnection` et envoie un `call:offer` SDP pour établir la connexion audio peer-to-peer.

---

### 9.8 — `call:offer`

**Description :** Transmet une offre SDP WebRTC d'un pair à un autre pour établir la connexion audio/vidéo.

**Structure JSON attendue (émis par le frontend) :**

```json
{
  "callId": "string",
  "fromUserId": "string",
  "toUserId": "string",
  "sdp": "RTCSessionDescriptionInit"
}
```

**Structure JSON reçue (relayée par le backend, sans `toUserId`) :**

```json
{
  "callId": "string",
  "fromUserId": "string",
  "sdp": "RTCSessionDescriptionInit"
}
```

**Exemple de flux :**

```
Client (Bob) → Serveur → Client (Alice)

Envoi:   { "callId": "call-550e...", "fromUserId": "6601b4c5...", "toUserId": "6601a2f3...", "sdp": { "type": "offer", "sdp": "v=0\r\n..." } }
Relayé:  { "callId": "call-550e...", "fromUserId": "6601b4c5...", "sdp": { "type": "offer", "sdp": "v=0\r\n..." } }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `usePeerConnections.ts` — fonction `createPeerConnection()` |
| Relais | `CallSignaling.ts` — méthode `handleOffer()` |
| Récepteur | `useCallSocketListeners.ts` — listener `call:offer` |

**Qui envoie :** Le **frontend** (`usePeerConnections`) après avoir créé une `RTCPeerConnection` et généré une offre SDP via `createOffer()`.

**Qui reçoit et que fait-il :**

- Le **backend** (`CallSignaling`) route le message vers le socket du `toUserId` cible, en retirant le champ `toUserId` du payload.
- Le **frontend** destinataire (`useCallSocketListeners`) reçoit l'offre, crée sa propre `RTCPeerConnection`, applique le SDP distant (`setRemoteDescription`), puis répond avec `call:answer`.

---

### 9.9 — `call:answer`

**Description :** Transmet une réponse SDP WebRTC en retour d'une offre.

**Structure JSON attendue (émis par le frontend) :**

```json
{
  "callId": "string",
  "fromUserId": "string",
  "toUserId": "string",
  "sdp": "RTCSessionDescriptionInit"
}
```

**Structure JSON reçue (relayée par le backend, sans `toUserId`) :**

```json
{
  "callId": "string",
  "fromUserId": "string",
  "sdp": "RTCSessionDescriptionInit"
}
```

**Exemple de flux :**

```
Client (Alice) → Serveur → Client (Bob)

Envoi:   { "callId": "call-550e...", "fromUserId": "6601a2f3...", "toUserId": "6601b4c5...", "sdp": { "type": "answer", "sdp": "v=0\r\n..." } }
Relayé:  { "callId": "call-550e...", "fromUserId": "6601a2f3...", "sdp": { "type": "answer", "sdp": "v=0\r\n..." } }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `usePeerConnections.ts` — après `createAnswer()` |
| Relais | `CallSignaling.ts` — méthode `handleAnswer()` |
| Récepteur | `useCallSocketListeners.ts` — listener `call:answer` |

**Qui envoie :** Le **frontend** (`usePeerConnections`) après avoir reçu une offre, créé une réponse SDP et l'avoir appliquée localement.

**Qui reçoit et que fait-il :**

- Le **backend** (`CallSignaling`) route vers le socket du `toUserId`.
- Le **frontend** destinataire applique le SDP distant via `setRemoteDescription`. La connexion WebRTC est maintenant établie et le flux audio circule en P2P.

---

### 9.10 — `call:ice-candidate`

**Description :** Échange de candidats ICE pour la traversée NAT (permet aux pairs de se découvrir à travers les pare-feux et routeurs).

**Structure JSON attendue (émis par le frontend) :**

```json
{
  "callId": "string",
  "fromUserId": "string",
  "toUserId": "string",
  "candidate": "RTCIceCandidateInit"
}
```

**Structure JSON reçue (relayée par le backend, sans `toUserId`) :**

```json
{
  "callId": "string",
  "fromUserId": "string",
  "candidate": "RTCIceCandidateInit"
}
```

**Exemple de flux :**

```
Client (Bob) → Serveur → Client (Alice)

Envoi:   { "callId": "call-550e...", "fromUserId": "6601b4c5...", "toUserId": "6601a2f3...", "candidate": { "candidate": "candidate:1 1 UDP ...", "sdpMid": "0", "sdpMLineIndex": 0 } }
Relayé:  { "callId": "call-550e...", "fromUserId": "6601b4c5...", "candidate": { "candidate": "candidate:1 1 UDP ...", "sdpMid": "0", "sdpMLineIndex": 0 } }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `usePeerConnections.ts` — callback `onicecandidate` |
| Relais | `CallSignaling.ts` — méthode `handleIceCandidate()` |
| Récepteur | `useCallSocketListeners.ts` — listener `call:ice-candidate` |

**Qui envoie :** Le **frontend** (`usePeerConnections`) automatiquement à chaque fois que le navigateur découvre un nouveau candidat ICE via l'événement `onicecandidate` de la `RTCPeerConnection`.

**Qui reçoit et que fait-il :**

- Le **backend** (`CallSignaling`) route vers le socket du `toUserId`.
- Le **frontend** destinataire ajoute le candidat à sa `RTCPeerConnection` via `addIceCandidate()`. Ce processus est appelé "trickle ICE" — les candidats arrivent progressivement pendant la négociation.

---

### 9.11 — `call:reject`

**Description :** L'utilisateur destinataire refuse l'appel entrant.

**Structure JSON attendue :**

```json
{
  "callId": "string"
}
```

**Exemple de flux :**

```
Client (Bob) → Serveur
{ "callId": "call-550e8400-e29b-41d4-a716-446655440000" }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `useCallBase.ts` — fonction `rejectCall()` |
| Récepteur | `CallSignaling.ts` — méthode `handleReject()` |

**Qui envoie :** Le **frontend** (`useCallBase`) quand l'utilisateur clique sur le bouton refuser dans `IncomingCallModal`. La sonnerie s'arrête (cleanup du `useEffect`).

**Qui reçoit et que fait-il :** Le **backend** (`CallSignaling`) :

1. Broadcast `call:user-rejected` à la room de l'appel
2. Si l'appel n'est pas un appel de groupe et qu'il reste ≤ 1 participant, termine l'appel via `endCall()`

---

### 9.12 — `call:user-rejected`

**Description :** Notifie les participants qu'un utilisateur a refusé l'appel.

**Structure JSON attendue :**

```json
{
  "callId": "string",
  "userId": "string"
}
```

**Exemple de flux :**

```
Serveur → Room call:{callId}
{ "callId": "call-550e8400-e29b-41d4-a716-446655440000", "userId": "6601b4c5e4b0c12d34567891" }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `CallSignaling.ts` — méthode `handleReject()` |
| Récepteur | `useCallSocketListeners.ts` — listener `call:user-rejected` |

**Qui envoie :** Le **backend** (`CallSignaling`) en broadcast à la room.

**Qui reçoit et que fait-il :** Le **frontend** (`useCallSocketListeners`) retire l'utilisateur de la liste des participants en attente.

---

### 9.13 — `call:hangup`

**Description :** L'utilisateur raccroche et quitte l'appel en cours.

**Structure JSON attendue :**

```json
{
  "callId": "string"
}
```

**Exemple de flux :**

```
Client (Alice) → Serveur
{ "callId": "call-550e8400-e29b-41d4-a716-446655440000" }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `useCallBase.ts` — fonction `hangUp()` |
| Récepteur | `CallSignaling.ts` — méthode `handleHangup()` |

**Qui envoie :** Le **frontend** (`useCallBase`) quand l'utilisateur clique sur le bouton raccrocher dans l'interface d'appel.

**Qui reçoit et que fait-il :** Le **backend** (`CallSignaling`) appelle `removeUserFromCall()` qui :

1. Retire le participant de `ActiveCallStore`
2. Quitte la room socket
3. Si 0 participant restant, ou si 1 seul restant en appel non-groupe → `endCall()` (envoie `call:ended`)
4. Sinon → broadcast `call:user-left` aux participants restants

---

### 9.14 — `call:user-left`

**Description :** Notifie les participants qu'un utilisateur a quitté l'appel (mais l'appel continue).

**Structure JSON attendue :**

```json
{
  "callId": "string",
  "userId": "string"
}
```

**Exemple de flux :**

```
Serveur → Room call:{callId}
{ "callId": "call-550e8400-e29b-41d4-a716-446655440000", "userId": "6601a2f3e4b0c12d34567890" }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `CallSignaling.ts` — méthode `removeUserFromCall()` |
| Récepteur | `useCallSocketListeners.ts` — listener `call:user-left` |

**Qui envoie :** Le **backend** (`CallSignaling`) en broadcast à la room quand un participant quitte mais que l'appel continue (appel de groupe avec ≥ 2 restants).

**Qui reçoit et que fait-il :** Le **frontend** (`useCallSocketListeners`) :

1. Ferme la `RTCPeerConnection` associée à cet utilisateur
2. Retire le participant de la liste affichée dans l'UI

---

### 9.15 — `call:ended`

**Description :** Notifie tous les participants que l'appel est terminé.

**Structure JSON attendue :**

```json
{
  "callId": "string"
}
```

**Exemple de flux :**

```
Serveur → Room call:{callId} (tous les sockets)
{ "callId": "call-550e8400-e29b-41d4-a716-446655440000" }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `CallSignaling.ts` — méthode `endCall()` |
| Récepteur | `useCallSocketListeners.ts` — listener `call:ended` |

**Qui envoie :** Le **backend** (`CallSignaling`) via `io.to()` (inclut tous les sockets de la room, y compris celui qui raccroche). Ensuite, tous les sockets quittent la room et l'appel est supprimé de `ActiveCallStore`.

**Qui reçoit et que fait-il :** Le **frontend** (`useCallSocketListeners`) :

1. Ferme toutes les `RTCPeerConnection` actives
2. Arrête les flux audio locaux (`MediaStream.getTracks().forEach(t => t.stop())`)
3. Réinitialise l'état de l'appel à `idle`
4. Affiche un toast "Appel terminé"

---

### 9.16 — `call:mute-toggle`

**Description :** Signale aux autres participants qu'un utilisateur a activé/désactivé son micro.

**Structure JSON attendue (émis par le frontend) :**

```json
{
  "callId": "string",
  "isMuted": "boolean"
}
```

**Structure JSON reçue (relayée par le backend, avec `userId` ajouté) :**

```json
{
  "callId": "string",
  "userId": "string",
  "isMuted": "boolean"
}
```

**Exemple de flux :**

```
Client (Alice) → Serveur → Room (sauf Alice)

Envoi:   { "callId": "call-550e...", "isMuted": true }
Relayé:  { "callId": "call-550e...", "userId": "6601a2f3...", "isMuted": true }
```

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | `useCallBase.ts` — fonction `toggleMute()` |
| Relais | `CallSignaling.ts` — méthode `handleMuteToggle()` |
| Récepteur | `useCallSocketListeners.ts` — listener `call:mute-toggle` |

**Qui envoie :** Le **frontend** (`useCallBase`) quand l'utilisateur clique sur le bouton mute. Le frontend désactive aussi la track audio locale immédiatement (`audioTrack.enabled = false`).

**Qui reçoit et que fait-il :**

- Le **backend** (`CallSignaling`) ajoute le `userId` (depuis `socket.data.userId`) et broadcast à la room via `socket.to()` (exclut l'émetteur).
- Le **frontend** destinataire met à jour l'état `isMuted` du participant dans l'UI (icône micro barré).

---

### 9.17 — `disconnect` (événement système Socket.IO)

**Description :** Déclenché automatiquement quand un utilisateur perd sa connexion (fermeture de page, perte réseau, etc.).

**Structure JSON attendue :** Aucun payload (événement système Socket.IO).

**Composants du système :**
| Composant | Fichier |
|-----------|---------|
| Émetteur | Socket.IO (automatique) |
| Récepteur | `CallSignaling.ts` — méthode `handleDisconnect()` |

**Qui envoie :** Le **runtime Socket.IO** automatiquement lors de la déconnexion d'un socket.

**Qui reçoit et que fait-il :** Le **backend** (`CallSignaling`) :

1. Cherche si l'utilisateur était dans un appel actif via `ActiveCallStore.getCallByUserId()`
2. Si oui, appelle `removeUserFromCall()` (même logique que `call:hangup`)
3. Cela garantit que les appels sont nettoyés même si l'utilisateur ferme brutalement son navigateur

---

### Résumé des messages audio/vidéo

| **Message**              | **Direction**                 | **Rôle**                         |
| ------------------------ | ----------------------------- | -------------------------------- |
| `authenticate:session`   | Frontend → Backend            | Authentification socket          |
| `contacts:list`          | Frontend → Backend            | Demande liste contacts           |
| `contacts:list:response` | Backend → Frontend            | Retour liste contacts            |
| `call:initiate`          | Frontend → Backend            | Démarrer un appel                |
| `call:incoming`          | Backend → Frontend (ciblé)    | Notification appel entrant       |
| `call:error`             | Backend → Frontend            | Erreur d'appel                   |
| `call:accept`            | Frontend → Backend            | Accepter l'appel                 |
| `call:user-joined`       | Backend → Room (broadcast)    | Nouveau participant              |
| `call:participants-list` | Backend → Frontend (ciblé)    | Liste des participants existants |
| `call:offer`             | Frontend → Backend → Frontend | Offre SDP WebRTC                 |
| `call:answer`            | Frontend → Backend → Frontend | Réponse SDP WebRTC               |
| `call:ice-candidate`     | Frontend → Backend → Frontend | Candidat ICE                     |
| `call:reject`            | Frontend → Backend            | Refuser l'appel                  |
| `call:user-rejected`     | Backend → Room (broadcast)    | Notification refus               |
| `call:hangup`            | Frontend → Backend            | Raccrocher                       |
| `call:user-left`         | Backend → Room (broadcast)    | Participant parti                |
| `call:ended`             | Backend → Room (broadcast)    | Appel terminé                    |
| `call:mute-toggle`       | Frontend → Backend → Room     | Toggle micro                     |
| `disconnect`             | Système → Backend             | Déconnexion auto                 |

---
