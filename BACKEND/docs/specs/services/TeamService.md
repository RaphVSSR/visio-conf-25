# Référence de la classe TeamService — VisioConf

**Fichier source** : `BACKEND/src/models/services/TeamService.ts`
**nomDInstance** : `"TeamService"`

---

## 1. Description

`TeamService` gère toutes les opérations sur les équipes et leurs membres. Chaque action vérifie l'authentification via `resolveUserId()` et l'autorisation (rôle admin d'équipe pour les mutations). Utilise le pattern de messages consolidé avec une Map de handlers via `register()` et un dispatcher.

---

## 2. Messages

### Reçus (3 consolidés)

| Message | Valeurs du champ type | Description |
|---------|----------------------|-------------|
| `team_get` | `list`, `all` | Opérations de lecture sur les équipes |
| `team_action` | `create`, `update`, `delete`, `leave` | Opérations d'écriture sur les équipes |
| `team_member` | `list`, `add`, `remove` | Opérations de gestion des membres |

### Émis (3 réponses consolidées)

| Message | Valeurs du champ type | Description |
|---------|----------------------|-------------|
| `team_get_response` | `list`, `all` | Réponse à la requête, contient `etat: boolean` |
| `team_action_response` | `create`, `update`, `delete`, `leave` | Réponse à l'action, contient `etat: boolean` |
| `team_member_response` | `list`, `add`, `remove` | Réponse aux opérations sur les membres, contient `etat: boolean` |

---

## 3. Méthodes privées

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `resolveUserId` | `socketId: string` | `string \| null` | Résout le socketId en userId via SessionManager |
| `registerHandler` | `messageName: string, handler: MessageHandler` | `void` | Enregistre un handler dans la Map interne |
| `send` | `socketIds: string \| string[], messageName: string, payload: unknown` | `void` | Envoie un message via le controleur |

---

## 4. Dispatchers

| Dispatcher | Message entrant | Types dispatchés | Description |
|------------|-----------------|------------------|-------------|
| `handleTeamQuery` | `team_get` | `list`, `all` | Route vers les handlers de lecture selon le `type` |
| `handleTeamAction` | `team_action` | `create`, `update`, `delete`, `leave` | Route vers les handlers d'écriture selon le `type` |
| `handleTeamMember` | `team_member` | `list`, `add`, `remove` | Route vers les handlers de membres selon le `type` |

---

## 5. Handlers

### Requêtes d'équipe

| Handler | Type | Payload reçu | Payload de réponse | Description |
|---------|------|--------------|--------------------|-------------|
| `getTeamsList` | `list` | `{}` | `{ type: "list", etat, teams[] }` | Retourne uniquement les équipes dont l'utilisateur est membre, avec leur rôle |
| `getAllTeams` | `all` | `{}` | `{ type: "all", etat, teams[] }` | Retourne toutes les équipes du système |

### Actions sur les équipes

| Handler | Type | Payload reçu | Payload de réponse | Description |
|---------|------|--------------|--------------------|-------------|
| `createTeam` | `create` | `{ name, description?, picture?, members[] }` | `{ type: "create", etat, team }` | Crée une équipe, ajoute le créateur comme admin, ajoute les membres spécifiés comme "member" |
| `updateTeam` | `update` | `{ id, name?, description?, picture? }` | `{ type: "update", etat, team }` | Admin requis. Met à jour uniquement les champs fournis |
| `deleteTeam` | `delete` | `{ teamId }` | `{ type: "delete", etat, teamId }` | Admin requis. Cascade : supprime les channels, posts, réponses, membres de channel et membres d'équipe |
| `leaveTeam` | `leave` | `{ teamId }` | `{ type: "leave", etat, teamId }` | Interdit si dernier admin |

### Membres d'équipe

| Handler | Type | Payload reçu | Payload de réponse | Description |
|---------|------|--------------|--------------------|-------------|
| `getTeamMembers` | `list` | `{ teamId }` | `{ type: "list", etat, members[] }` | Retourne tous les membres avec les infos utilisateur peuplées (firstname, lastname, picture) |
| `addTeamMember` | `add` | `{ teamId, userId }` | `{ type: "add", etat, teamId, userId }` | Admin requis. Empêche les doublons |
| `removeTeamMember` | `remove` | `{ teamId, userId }` | `{ type: "remove", etat, teamId, userId }` | Admin requis. Impossible de retirer un admin |

---

## 6. Formats de réponse

### Team (formaté)

```typescript
{ id, name, description, picture, createdBy, createdAt, updatedAt, role }
```

### TeamMember (formaté)

```typescript
{ id, userId, firstname, lastname, picture, role, joinedAt }
```

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `Team` | CRUD via `Team.model` | Modèle Mongoose d'équipe |
| `TeamMember` | CRUD via `TeamMember.model` | Modèle Mongoose de membre d'équipe |
| `Channel` | Suppression en cascade via `Channel.model` | Supprime les channels lors de la suppression d'équipe |
| `ChannelMember` | Suppression en cascade | Supprime les membres de channel lors de la suppression d'équipe |
| `ChannelPost` | Suppression en cascade | Supprime les posts lors de la suppression d'équipe |
| `ChannelPostResponse` | Suppression en cascade | Supprime les réponses lors de la suppression d'équipe |
| `SessionManager` | Auth via méthodes statiques | Résout le socketId en userId |
| `ListeMessages` | Config messages via `getMessagesByDomain("team")` | Fournit la liste des messages reçus pour l'inscription |
