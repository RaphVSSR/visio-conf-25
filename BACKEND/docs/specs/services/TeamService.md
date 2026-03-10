# Référence du TeamService — VisioConf

**Fichier source** : `BACKEND/src/models/services/TeamService.ts`
**Classe parente** : `ControllerService` (abstract)
**nomDInstance** : `"TeamService"`

---

## 1. Description

`TeamService` gère toutes les opérations liées aux équipes et à leurs membres. Chaque action vérifie l'authentification via `resolveUserId()` et les autorisations (rôle admin équipe pour les mutations).

---

## 2. Messages

### Émis (9)

`teams_list_response`, `all_teams_response`, `team_create_response`, `team_update_response`, `team_delete_response`, `team_leave_response`, `team_members_response`, `team_add_member_response`, `team_remove_member_response`

### Reçus (9)

`teams_list_request`, `all_teams_request`, `team_create_request`, `team_update_request`, `team_delete_request`, `team_leave_request`, `team_members_request`, `team_add_member_request`, `team_remove_member_request`

---

## 3. Méthodes privées

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `resolveUserId` | `socketId: string` | `Promise<string \| null>` | Résout le socketId vers l'userId via Session |

---

## 4. Handlers

| Handler | Payload reçu | Logique |
|---------|--------------|---------|
| `getTeamsList` | `{}` | Retourne uniquement les équipes dont l'utilisateur est membre, avec son rôle |
| `getAllTeams` | `{}` | Retourne toutes les équipes du système |
| `createTeam` | `{ name, description?, picture?, members[] }` | Crée l'équipe, ajoute le créateur comme admin, ajoute les membres spécifiés comme "member" |
| `updateTeam` | `{ id, name?, description?, picture? }` | Admin requis. Met à jour uniquement les champs fournis |
| `deleteTeam` | `{ teamId }` | Admin requis. Cascade: supprime canaux, posts, réponses, membres canal et membres équipe |
| `leaveTeam` | `{ teamId }` | Interdit si dernier admin |
| `getTeamMembers` | `{ teamId }` | Retourne tous les membres avec infos user populées (firstname, lastname, picture) |
| `addTeamMember` | `{ teamId, userId }` | Admin requis. Empêche les doublons |
| `removeTeamMember` | `{ teamId, userId }` | Admin requis. Interdit de retirer un admin |

---

## 5. Format des réponses

### Team formaté (liste)

```typescript
{ id, name, description, picture, createdBy, createdAt, updatedAt, role }
```

### TeamMember formaté

```typescript
{ id, userId, firstname, lastname, picture, role, joinedAt }
```

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `Team` | CRUD via `Team.model` | Modèle Mongoose des équipes |
| `TeamMember` | CRUD via `TeamMember.model` | Modèle Mongoose des membres |
| `Channel` | Cascade delete via `Channel.model` | Suppression des canaux lors du delete team |
| `ChannelMember` | Cascade delete | Suppression des membres canal |
| `ChannelPost` | Cascade delete | Suppression des posts |
| `ChannelPostResponse` | Cascade delete | Suppression des réponses |
| `User` | Populate via `User.model` | Infos membre (firstname, lastname, picture) |
| `Session` | Auth via `Session.model` | Résolution socketId → userId |
