# Documentation des Messages – VisioConf

Ce document décrit l'ensemble des messages utilisés dans l'application VisioConf, en précisant pour chacun :

-   **Format** attendu (les propriétés et leur type)
-   **Exemple de contenu** (un exemple représentatif)
-   **Émetteur** (la partie applicative qui envoie le message)
-   **Récepteur** (la partie applicative qui traite ou consomme le message)

> **Note :** Pour la plupart des messages `request`, le message `response` correspondant a les rôles inversés :
>
> -   _Émetteur de la response_ = _Récepteur de la request_
> -   _Récepteur de la response_ = _Émetteur de la request_

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

> **Note :** Les canaux sont des espaces de discussion au sein des équipes. Ils peuvent être publics (tous les membres de l'équipe peuvent les rejoindre) ou privés (sur invitation uniquement). La communication au sein des canaux se fait via des posts et des réponses à ces posts.

---

## Conclusion

Cette documentation est un point de départ pour la gestion des messages dans l'application VisioConf. Elle peut être étendue à mesure que de nouvelles fonctionnalités ou améliorations sont ajoutées à l'application.

Si vous avez des questions ou souhaitez ajouter de nouveaux messages, n'hésitez pas à consulter le code et à suivre les conventions mentionnées ci-dessus.
