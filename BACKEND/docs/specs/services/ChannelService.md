# Référence du ChannelService — VisioConf

**Fichier source** : `BACKEND/src/models/services/ChannelService.ts`
**Classe parente** : `ControllerService` (abstract)
**nomDInstance** : `"ChannelService"`

---

## 1. Description

`ChannelService` gère toutes les opérations liées aux canaux, posts et réponses au sein des équipes. Chaque action vérifie l'authentification via `resolveUserId()` et les autorisations (rôle admin canal pour les mutations).

---

## 2. Messages

### Émis (15)

`channels`, `channel`, `channel_creating_status`, `channel_updating_status`, `channel_deleting_status`, `channel_members`, `channel_member_adding_status`, `channel_member_removing_status`, `channel_leaving_status`, `posts`, `user_post`, `post_publishing_status`, `post_updating_status`, `post_deleting_status`, `post_answering_status`

### Reçus (15)

`get_channels`, `get_channel`, `create_channel`, `update_channel`, `delete_channel`, `get_channel_members`, `add_channel_member`, `remove_channel_member`, `leave_channel`, `get_posts`, `get_user_post`, `publish_post`, `update_post`, `delete_post`, `answer_post`

---

## 3. Méthodes privées

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `resolveUserId` | `socketId: string` | `Promise<string \| null>` | Résout le socketId vers l'userId via Session |
| `getConnectedChannelMemberSocketIds` | `channelId: string` | `Promise<string[]>` | Retourne les socketIds des membres connectés d'un canal |
| `getConnectedTeamMemberSocketIds` | `teamId: string` | `Promise<string[]>` | Retourne les socketIds des membres connectés d'une équipe |

---

## 4. Handlers

### Canaux

| Handler | Payload reçu | Logique | Broadcast |
|---------|--------------|---------|-----------|
| `getChannels` | `{ teamId }` | Retourne les canaux publics + canaux privés dont l'user est membre | Non (émetteur seul) |
| `getChannel` | `{ channelId }` | Retourne un canal avec vérification de visibilité | Non |
| `createChannel` | `{ name, isPublic, teamId, members? }` | Crée le canal, ajoute le créateur comme admin. Si public: ajoute tous les membres de l'équipe. Si privé: ajoute les membres spécifiés | Oui (tous les membres de l'équipe) |
| `updateChannel` | `{ id, name, isPublic, teamId, members? }` | Admin requis. Si changement public→privé: retire les non-listés. Si privé→public: ajoute tous les membres manquants | Non |
| `deleteChannel` | `{ channelId }` | Admin requis. Cascade: supprime posts, réponses et membres | Non |

### Membres

| Handler | Payload reçu | Logique | Broadcast |
|---------|--------------|---------|-----------|
| `getChannelMembers` | `{ channelId }` | Vérifie membership sur canaux privés. Populate user (firstname, lastname, picture) | Non |
| `addChannelMember` | `{ channelId, userId }` | Admin requis. Empêche les doublons | Non |
| `removeChannelMember` | `{ channelId, userId }` | Admin requis. Interdit de retirer un admin | Non |
| `leaveChannel` | `{ channelId }` | Interdit si dernier admin | Non |

### Posts

| Handler | Payload reçu | Logique | Broadcast |
|---------|--------------|---------|-----------|
| `getChannelPosts` | `{ channelId }` | Vérifie membership sur canaux privés. Retourne posts avec réponses populées | Non |
| `getUserPost` | `{ channelId, userId }` | Filtre les posts par auteur | Non |
| `publishPost` | `{ channelId, content }` | Membership requis | Oui (membres connectés du canal) |
| `updatePost` | `{ postId, content }` | Auteur requis | Non |
| `deletePost` | `{ postId }` | Auteur OU admin du canal. Cascade: supprime les réponses | Non |
| `answerPost` | `{ postId, content }` | Membership requis. Interdit de répondre à son propre post. Incrémente `responseCount` | Oui (membres connectés du canal) |

---

## 5. Format des réponses

### Channel formaté

```typescript
{ id, name, isPublic, createdBy, createdAt }
```

### ChannelMember formaté

```typescript
{ id, userId, firstname, lastname, picture, role, joinedAt }
```

### Post formaté

```typescript
{ id, channelId, content, authorId, authorFirstname, authorLastname, authorPicture, createdAt, updatedAt, responseCount, responses[] }
```

### Response formatée

```typescript
{ id, postId, content, authorId, authorFirstname, authorLastname, authorPicture, createdAt, updatedAt }
```

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `Channel` | CRUD via `Channel.model` | Modèle Mongoose des canaux |
| `ChannelMember` | CRUD via `ChannelMember.model` | Modèle Mongoose des membres |
| `ChannelPost` | CRUD via `ChannelPost.model` | Modèle Mongoose des posts |
| `ChannelPostResponse` | CRUD via `ChannelPostResponse.model` | Modèle Mongoose des réponses |
| `Team` | Lecture via `Team.model` | Pour récupérer les membres de l'équipe |
| `TeamMember` | Lecture via `TeamMember.model` | Pour broadcast aux membres de l'équipe |
| `User` | Populate via `User.model` | Infos auteur (firstname, lastname, picture) |
| `Session` | Auth via `Session.model` | Résolution socketId → userId |
