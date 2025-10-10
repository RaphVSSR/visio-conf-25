# Documentation de la classe TeamsService

## Vue d'ensemble

La classe `TeamsService` est responsable de la gestion des équipes dans l'application Visioconf. Elle permet aux utilisateurs de créer, gérer (ou quitter) des équipes collaboratives. Elle utilise un modèle de communication basé sur des messages pour interagir avec d'autres composants du système via un contrôleur central.

## Architecture

`TeamsService` s'inscrit dans une architecture orientée messages où chaque service communique via un contrôleur central qui route les messages entre les différents composants. Cette approche permet un découplage fort entre les services.

## Propriétés

| Propriété               | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `controleur`            | Référence au contrôleur central qui gère les messages    |
| `nomDInstance`          | Identifiant unique de l'instance du service              |
| `verbose`               | Flag pour l'affichage des logs de débogage               |
| `listeDesMessagesEmis`  | Liste des types de messages que le service peut émettre  |
| `listeDesMessagesRecus` | Liste des types de messages que le service peut recevoir |

## Messages gérés

### Messages reçus

| Message                      | Format                                                     | Exemple de contenu                                                                     | Émetteur                 |
| ---------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------ |
| `teams_list_request`         | `{ }`                                                      | `{ }`                                                                                  | EquipesPage (frontend)   |
| `team_create_request`        | `{ name: string, description?: string, picture?: string }` | `{ name: "Équipe Dev", description: "Équipe de développement", picture: "team1.jpg" }` | TeamForm (frontend)      |
| `team_update_request`        | `{ teamId: string, name?: string, description?: string }`  | `{ teamId: "t1", name: "Équipe Dev Updated" }`                                         | TeamForm (frontend)      |
| `team_delete_request`        | `{ teamId: string }`                                       | `{ teamId: "t1" }`                                                                     | TeamsList (frontend)     |
| `team_leave_request`         | `{ teamId: string }`                                       | `{ teamId: "t1" }`                                                                     | TeamsList (frontend)     |
| `team_members_request`       | `{ teamId: string }`                                       | `{ teamId: "t1" }`                                                                     | TeamView (frontend)      |
| `team_add_member_request`    | `{ teamId: string, userEmail: string }`                    | `{ teamId: "t1", userEmail: "user@example.com" }`                                      | AddMemberForm (frontend) |
| `team_remove_member_request` | `{ teamId: string, userId: string }`                       | `{ teamId: "t1", userId: "u2" }`                                                       | MembersList (frontend)   |
| `all_teams_request`          | `{ }`                                                      | `{ }`                                                                                  | AdminPage (frontend)     |

### Messages émis

| Message                       | Format                                                                | Exemple de contenu                                                                              | Récepteur                |
| ----------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------ |
| `teams_list_response`         | `{ etat: boolean, teams?: Team[], error?: string }`                   | `{ etat: true, teams: [{ id: "t1", name: "Équipe Dev", description: "...", memberCount: 5 }] }` | EquipesPage (frontend)   |
| `team_create_response`        | `{ etat: boolean, team?: Team, error?: string }`                      | `{ etat: true, team: { id: "t1", name: "Équipe Dev", description: "..." } }`                    | TeamForm (frontend)      |
| `team_update_response`        | `{ etat: boolean, team?: Team, error?: string }`                      | `{ etat: true, team: { id: "t1", name: "Équipe Dev Updated" } }`                                | TeamForm (frontend)      |
| `team_delete_response`        | `{ etat: boolean, teamId?: string, error?: string }`                  | `{ etat: true, teamId: "t1" }`                                                                  | TeamsList (frontend)     |
| `team_leave_response`         | `{ etat: boolean, teamId?: string, error?: string }`                  | `{ etat: true, teamId: "t1" }`                                                                  | TeamsList (frontend)     |
| `team_members_response`       | `{ etat: boolean, members?: TeamMember[], error?: string }`           | `{ etat: true, members: [{ userId: "u1", firstname: "John", role: "admin" }] }`                 | TeamView (frontend)      |
| `team_add_member_response`    | `{ etat: boolean, member?: TeamMember, error?: string }`              | `{ etat: true, member: { userId: "u2", firstname: "Jane", role: "member" } }`                   | AddMemberForm (frontend) |
| `team_remove_member_response` | `{ etat: boolean, userId?: string, teamId?: string, error?: string }` | `{ etat: true, userId: "u2", teamId: "t1" }`                                                    | MembersList (frontend)   |
| `all_teams_response`          | `{ etat: boolean, teams?: Team[], error?: string }`                   | `{ etat: true, teams: [{ id: "t1", name: "Équipe Dev", memberCount: 5, owner: "John Doe" }] }`  | AdminPage (frontend)     |

## Méthodes

### `constructor(controleur, nom)`

Initialise le service et l'inscrit auprès du contrôleur.

**Paramètres:**

-   `controleur`: Le contrôleur central
-   `nom`: Le nom d'instance du service

### `traitementMessage(mesg)`

Point d'entrée principal pour le traitement des messages reçus. Cette méthode agit comme un routeur qui délègue le traitement aux méthodes spécialisées.

**Paramètres:**

-   `mesg`: Le message à traiter

**Fonctionnement:**

1. Identifie le type de message en vérifiant la présence de propriétés spécifiques
2. Délègue le traitement à la méthode spécialisée correspondante:
    - `teams_list_request` → `handleTeamsList`
    - `team_create_request` → `handleTeamCreate`
    - `team_update_request` → `handleTeamUpdate`
    - `team_delete_request` → `handleTeamDelete`
    - `team_leave_request` → `handleTeamLeave`
    - `team_members_request` → `handleTeamMembers`
    - `team_add_member_request` → `handleTeamAddMember`
    - `team_remove_member_request` → `handleTeamRemoveMember`
    - `all_teams_request` → `handleAllTeams`

### `handleTeamsList(mesg)`

Récupère la liste des équipes auxquelles l'utilisateur connecté appartient.

**Paramètres:**

-   `mesg`: Le message contenant la demande de liste d'équipes

**Fonctionnement:**

1. Récupère l'utilisateur connecté via le `socketId`
2. Recherche toutes les équipes où l'utilisateur est membre
3. Inclut les informations de base des équipes et le nombre de membres
4. Répond avec `teams_list_response`

### `handleTeamCreate(mesg)`

Crée une nouvelle équipe avec l'utilisateur connecté comme propriétaire/administrateur.

**Paramètres:**

-   `mesg`: Le message contenant les données de création d'équipe

**Fonctionnement:**

1. Valide les données d'entrée (nom requis)
2. Crée l'équipe en base de données
3. Ajoute automatiquement l'utilisateur créateur comme membre administrateur
4. Crée un canal général par défaut pour l'équipe
5. Répond avec `team_create_response`

### `handleTeamUpdate(mesg)`

Met à jour les informations d'une équipe existante.

**Paramètres:**

-   `mesg`: Le message contenant les données de mise à jour

**Fonctionnement:**

1. Vérifie que l'utilisateur est administrateur de l'équipe
2. Met à jour les champs autorisés (nom, description)
3. Répond avec `team_update_response`

### `handleTeamDelete(mesg)`

Supprime une équipe et tous ses canaux associés.

**Paramètres:**

-   `mesg`: Le message contenant l'ID de l'équipe à supprimer

**Fonctionnement:**

1. Vérifie que l'utilisateur est propriétaire de l'équipe
2. Supprime tous les canaux de l'équipe
3. Supprime tous les membres de l'équipe
4. Supprime l'équipe elle-même
5. Répond avec `team_delete_response`

### `handleTeamLeave(mesg)`

Permet à un utilisateur de quitter une équipe.

**Paramètres:**

-   `mesg`: Le message contenant l'ID de l'équipe à quitter

**Fonctionnement:**

1. Vérifie que l'utilisateur est membre de l'équipe
2. Empêche le propriétaire de quitter s'il y a d'autres membres
3. Supprime l'utilisateur de tous les canaux de l'équipe
4. Supprime l'adhésion de l'utilisateur
5. Répond avec `team_leave_response`

### `handleTeamMembers(mesg)`

Récupère la liste des membres d'une équipe.

**Paramètres:**

-   `mesg`: Le message contenant l'ID de l'équipe

**Fonctionnement:**

1. Vérifie que l'utilisateur est membre de l'équipe
2. Récupère tous les membres avec leurs informations de profil
3. Inclut les rôles et dates d'adhésion
4. Répond avec `team_members_response`

### `handleTeamAddMember(mesg)`

Ajoute un nouveau membre à une équipe par email.

**Paramètres:**

-   `mesg`: Le message contenant l'ID de l'équipe et l'email du nouvel utilisateur

**Fonctionnement:**

1. Vérifie que l'utilisateur est administrateur de l'équipe
2. Recherche l'utilisateur par email
3. Vérifie que l'utilisateur n'est pas déjà membre
4. Ajoute l'utilisateur comme membre
5. Répond avec `team_add_member_response`

### `handleTeamRemoveMember(mesg)`

Retire un membre d'une équipe.

**Paramètres:**

-   `mesg`: Le message contenant l'ID de l'équipe et l'ID de l'utilisateur à retirer

**Fonctionnement:**

1. Vérifie que l'utilisateur connecté est administrateur
2. Empêche la suppression du propriétaire
3. Retire l'utilisateur de tous les canaux de l'équipe
4. Supprime l'adhésion
5. Répond avec `team_remove_member_response`

### `handleAllTeams(mesg)`

Récupère toutes les équipes du système (fonction administrative).

**Paramètres:**

-   `mesg`: Le message de demande

**Fonctionnement:**

1. Vérifie les permissions administratives de l'utilisateur
2. Récupère toutes les équipes avec statistiques
3. Répond avec `all_teams_response`

## Modèles de données

### Team

```javascript
{
  id: string,
  name: string,
  description?: string,
  picture?: string,
  ownerId: string,
  isPublic: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### TeamMember

```javascript
{
  teamId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member',
}
```

## Sécurité

-   **Contrôle d'accès**: Vérification des permissions avant chaque opération
-   **Propriétaire unique**: Seul le propriétaire peut supprimer une équipe ou en changer la propriété
-   **Rôles hiérarchiques**: owner > admin > member avec permissions différenciées
-   **Validation des entrées**: Vérification de tous les paramètres reçus
-   **Isolation des données**: Chaque utilisateur ne voit que ses équipes

## Flux de travail typiques

### Création d'équipe

1. **Frontend**: Envoi de `team_create_request` avec nom et description
2. **TeamsService**: Création de l'équipe et ajout du créateur comme propriétaire
3. **ChannelsService**: Création automatique du canal "général"
4. **Response**: Confirmation avec les données de l'équipe créée

### Gestion des membres

1. **Frontend**: Envoi de `team_add_member_request` avec email
2. **TeamsService**: Vérification des permissions et recherche de l'utilisateur
3. **Database**: Ajout du nouveau membre
4. **Response**: Confirmation avec les données du membre ajouté

## Intégration avec d'autres services

-   **ChannelsService**: Création automatique de canaux lors de la création d'équipe
-   **UsersService**: Récupération des informations utilisateur pour les membres
-   **SocketIdentificationService**: Identification de l'utilisateur connecté via socketId
-   **DriveService**: Partage de fichiers au niveau équipe
