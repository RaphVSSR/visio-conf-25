# Référence de la classe ChannelService — VisioConf

**Fichier source** : `BACKEND/src/models/services/ChannelService.ts`
**nomDInstance** : `"ChannelService"`

---

## 1. Description

`ChannelService` gère toutes les opérations sur les channels, membres, posts et réponses au sein des équipes. Chaque action vérifie l'authentification via `resolveUserId()` et l'autorisation (rôle admin de channel pour les mutations). Utilise le pattern de messages consolidé avec une Map de handlers via `register()` et un dispatcher.

---

## 2. Messages

### Reçus (4 consolidés)

| Message | Valeurs du champ type | Description |
|---------|----------------------|-------------|
| `channel_get` | `list`, `single` | Opérations de lecture sur les channels |
| `channel_action` | `create`, `update`, `delete` | Opérations d'écriture sur les channels |
| `channel_member` | `list`, `add`, `remove`, `leave` | Opérations de gestion des membres |
| `channel_post` | `list`, `user`, `publish`, `update`, `delete`, `answer` | Opérations sur les posts et réponses |

### Émis (4 réponses consolidées)

| Message | Valeurs du champ type | Description |
|---------|----------------------|-------------|
| `channel_get_response` | `list`, `single` | Réponse à la requête, contient `etat: boolean` |
| `channel_action_response` | `create`, `update`, `delete` | Réponse à l'action, contient `etat: boolean` |
| `channel_member_response` | `list`, `add`, `remove`, `leave` | Réponse aux opérations sur les membres, contient `etat: boolean` |
| `channel_post_response` | `list`, `user`, `publish`, `update`, `delete`, `answer` | Réponse aux opérations sur les posts, contient `etat: boolean` |

---

## 3. Méthodes privées

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `resolveUserId` | `socketId: string` | `string \| null` | Résout le socketId en userId via SessionManager |
| `registerHandler` | `messageName: string, handler: MessageHandler` | `void` | Enregistre un handler dans la Map interne |
| `send` | `socketIds: string \| string[], messageName: string, payload: unknown` | `void` | Envoie un message via le controleur |
| `getConnectedChannelMemberSocketIds` | `channelId: string` | `Promise<string[]>` | Retourne les socketIds des membres connectés du channel |
| `getConnectedTeamMemberSocketIds` | `teamId: string` | `Promise<string[]>` | Retourne les socketIds des membres connectés de l'équipe |

---

## 4. Dispatchers

| Dispatcher | Message entrant | Types dispatchés | Description |
|------------|-----------------|------------------|-------------|
| `handleChannelQuery` | `channel_get` | `list`, `single` | Route vers les handlers de lecture selon le `type` |
| `handleChannelAction` | `channel_action` | `create`, `update`, `delete` | Route vers les handlers d'écriture selon le `type` |
| `handleChannelMember` | `channel_member` | `list`, `add`, `remove`, `leave` | Route vers les handlers de membres selon le `type` |
| `handleChannelPost` | `channel_post` | `list`, `user`, `publish`, `update`, `delete`, `answer` | Route vers les handlers de posts selon le `type` |

---

## 5. Handlers

### Requêtes de channel

| Handler | Type | Payload reçu | Payload de réponse | Diffusion | Description |
|---------|------|--------------|--------------------|-----------|-------------|
| `getChannels` | `list` | `{ teamId }` | `{ type: "list", etat, channels[] }` | Non | Retourne les channels publics + les channels privés dont l'utilisateur est membre |
| `getChannel` | `single` | `{ channelId }` | `{ type: "single", etat, channel }` | Non | Retourne un channel unique avec vérification de visibilité |

### Actions sur les channels

| Handler | Type | Payload reçu | Payload de réponse | Diffusion | Description |
|---------|------|--------------|--------------------|-----------|-------------|
| `createChannel` | `create` | `{ name, isPublic, teamId, members? }` | `{ type: "create", etat, channel }` | Oui (membres de l'équipe) | Crée un channel, ajoute le créateur comme admin. Si public : ajoute tous les membres de l'équipe. Si privé : ajoute les membres spécifiés |
| `updateChannel` | `update` | `{ id, name, isPublic, teamId, members? }` | `{ type: "update", etat, channel }` | Oui (membres de l'équipe) | Admin requis. Synchronise les membres lors du basculement public/privé |
| `deleteChannel` | `delete` | `{ channelId }` | `{ type: "delete", etat, channelId }` | Oui (membres de l'équipe) | Admin requis. Cascade : supprime les posts, réponses et membres |

### Membres de channel

| Handler | Type | Payload reçu | Payload de réponse | Diffusion | Description |
|---------|------|--------------|--------------------|-----------|-------------|
| `getChannelMembers` | `list` | `{ channelId }` | `{ type: "list", etat, members[] }` | Non | Vérifie l'appartenance sur les channels privés. Peuple les infos utilisateur |
| `addChannelMember` | `add` | `{ channelId, userId }` | `{ type: "add", etat, channelId, userId }` | Non | Admin requis. Empêche les doublons |
| `removeChannelMember` | `remove` | `{ channelId, userId }` | `{ type: "remove", etat, channelId, userId }` | Non | Admin requis. Impossible de retirer un admin |
| `leaveChannel` | `leave` | `{ channelId }` | `{ type: "leave", etat, channelId }` | Non | Interdit si dernier admin |

### Posts de channel

| Handler | Type | Payload reçu | Payload de réponse | Diffusion | Description |
|---------|------|--------------|--------------------|-----------|-------------|
| `getChannelPosts` | `list` | `{ channelId }` | `{ type: "list", etat, posts[] }` | Non | Vérifie l'appartenance sur les channels privés. Retourne les posts avec les réponses imbriquées |
| `getUserPost` | `user` | `{ channelId, userId }` | `{ type: "user", etat, posts[] }` | Non | Filtre les posts par auteur |
| `publishPost` | `publish` | `{ channelId, content }` | `{ type: "publish", etat, post }` | Oui (membres du channel) | Appartenance requise |
| `updatePost` | `update` | `{ postId, content }` | `{ type: "update", etat, postId, content }` | Non | Auteur requis |
| `deletePost` | `delete` | `{ postId }` | `{ type: "delete", etat, postId }` | Non | Auteur OU admin du channel. Cascade : supprime les réponses |
| `answerPost` | `answer` | `{ postId, content }` | `{ type: "answer", etat, postId, response }` | Oui (membres du channel) | Appartenance requise. Impossible de répondre à son propre post. Incrémente `responseCount` |

---

## 6. Formats de réponse

### Channel (formaté)

```typescript
{ id, name, isPublic, createdBy, createdAt }
```

### ChannelMember (formaté)

```typescript
{ id, userId, firstname, lastname, picture, role, joinedAt }
```

### Post (formaté)

```typescript
{ id, channelId, content, authorId, authorFirstname, authorLastname, authorPicture, createdAt, updatedAt, responseCount, responses[] }
```

### Response (formaté)

```typescript
{ id, postId, content, authorId, authorFirstname, authorLastname, authorPicture, createdAt, updatedAt }
```

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `Channel` | CRUD via `Channel.model` | Modèle Mongoose de channel |
| `ChannelMember` | CRUD via `ChannelMember.model` | Modèle Mongoose de membre de channel |
| `ChannelPost` | CRUD via `ChannelPost.model` | Modèle Mongoose de post |
| `ChannelPostResponse` | CRUD via `ChannelPostResponse.model` | Modèle Mongoose de réponse |
| `TeamMember` | Lecture via `TeamMember.model` | Pour la diffusion aux membres de l'équipe et l'ajout automatique aux channels publics |
| `SessionManager` | Auth via méthodes statiques | Résout le socketId en userId et récupère les IDs de sockets connectés |
| `ListeMessages` | Config messages via `getMessagesByDomain("channel")` | Fournit la liste des messages reçus pour l'inscription |
