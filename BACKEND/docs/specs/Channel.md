# Référence du Modèle Channel — VisioConf

**Fichiers sources** : `BACKEND/src/models/Channel.ts` + `ChannelMember.ts` + `ChannelPost.ts` + `ChannelPostResponse.ts`
**Classe parente** : `Collection` (abstract) — les quatre classes
**Collections MongoDB** : `Channel`, `ChannelMember`, `ChannelPost`, `ChannelPostResponse`

---

## 1. Schema complet

### Channel

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('ch1...')` |
| `name` | `String` | oui | — | — | Nom du canal (trimmed) | `"Général"` |
| `teamId` | `ObjectId` | oui | — | — | Équipe parente (pas de ref déclarée) | `ObjectId('t1...')` |
| `isPublic` | `Boolean` | non | `true` | — | Visibilité du canal | `true` |
| `createdBy` | `ObjectId` | oui | — | `User` | Créateur du canal | `ObjectId('u1...')` |
| `createdAt` | `Date` | non | `Date.now` | — | Date de création | `2026-03-01T10:00:00Z` |
| `updatedAt` | `Date` | non | `Date.now` | — | Date de dernière modification | `2026-03-01T10:00:00Z` |
| `members` | `ObjectId[]` | non | `[]` | `Channelmember` | Liste des membres du canal | `[ObjectId('cm1...')]` |

### ChannelMember

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('cm1...')` |
| `channelId` | `ObjectId` | oui | — | `Channel` | Référence vers le canal | `ObjectId('ch1...')` |
| `userId` | `ObjectId` | oui | — | `User` | Référence vers l'utilisateur | `ObjectId('u1...')` |
| `role` | `String` | non | `"member"` | — | Rôle dans le canal. Enum: `"admin"`, `"member"` | `"admin"` |
| `joinedAt` | `Date` | non | `Date.now` | — | Date d'arrivée dans le canal | `2026-03-01T10:00:00Z` |

### ChannelPost

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('p1...')` |
| `channelId` | `ObjectId` | oui | — | `Channel` | Canal parent | `ObjectId('ch1...')` |
| `content` | `String` | oui | — | — | Contenu du post | `"Bienvenue !"` |
| `authorId` | `ObjectId` | oui | — | `User` | Auteur du post | `ObjectId('u1...')` |
| `createdAt` | `Date` | non | `Date.now` | — | Date de création | `2026-03-01T10:00:00Z` |
| `updatedAt` | `Date` | non | `Date.now` | — | Date de dernière modification | `2026-03-01T10:00:00Z` |
| `responseCount` | `Number` | non | `0` | — | Nombre de réponses (dénormalisé pour les performances) | `3` |

### ChannelPostResponse

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('r1...')` |
| `postId` | `ObjectId` | oui | — | `ChannelPost` | Post parent | `ObjectId('p1...')` |
| `content` | `String` | oui | — | — | Contenu de la réponse | `"Merci !"` |
| `authorId` | `ObjectId` | oui | — | `User` | Auteur de la réponse | `ObjectId('u2...')` |
| `createdAt` | `Date` | non | `Date.now` | — | Date de création | `2026-03-01T10:05:00Z` |
| `updatedAt` | `Date` | non | `Date.now` | — | Date de dernière modification | `2026-03-01T10:05:00Z` |

---

## 2. Propriétés de la classe

### Channel

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<ChannelType>` | `protected static` | Schéma Mongoose |
| `model` | `Model<ChannelType>` | `static` | Modèle Mongoose |
| `modelInstance` | `Document<ChannelType>` | `public` | Instance du document |

### ChannelMember

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<ChannelMemberType>` | `protected static` | Schéma Mongoose |
| `model` | `Model<ChannelMemberType>` | `static` | Modèle Mongoose |
| `modelInstance` | `Document<ChannelMemberType>` | `public` | Instance du document |
| `areIndexesInitialized` | `void` | `private static` | IIFE qui initialise les index au chargement |

### ChannelPost

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<ChannelPostType>` | `protected static` | Schéma Mongoose |
| `model` | `Model<ChannelPostType>` | `static` | Modèle Mongoose |
| `modelInstance` | `Document<ChannelPostType>` | `public` | Instance du document |
| `areIndexesInitialized` | `void` | `private static` | IIFE qui initialise les index au chargement |

### ChannelPostResponse

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<ChannelPostResponseType>` | `protected static` | Schéma Mongoose |
| `model` | `Model<ChannelPostResponseType>` | `static` | Modèle Mongoose |
| `modelInstance` | `Document<ChannelPostResponseType>` | `public` | Instance du document |
| `areIndexesInitialized` | `void` | `private static` | IIFE qui initialise les index au chargement |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description |
|-----|------|--------|-------------|
| `models` | `object` | `mongoose.models` | Cache des modèles Mongoose enregistrés |
| `VERBOSE` | `env` | `process.env.VERBOSE` | Active les logs d'injection |
| `VERBOSE_LVL` | `env` | `process.env.VERBOSE_LVL` | Niveau de verbosité (3 = détaillé) |

---

## 4. Méthodes

### Channel

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: ChannelType` | `Channel` | instance | Crée une instance Channel |
| `save` | — | `Promise<void>` | instance | Sauvegarde en base |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime tous les canaux |
| `injectTest` | — | `Promise<void>` | static | **[DEV]** Injecte des canaux de test pour chaque équipe existante (Général + canaux additionnels selon le nom de l'équipe). En production, les canaux sont créés via `channel_create_request` |

### ChannelMember

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: ChannelMemberType` | `ChannelMember` | instance | Crée une instance ChannelMember |
| `save` | — | `Promise<void>` | instance | Sauvegarde en base |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime tous les membres de canal |

### ChannelPost

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: ChannelPostType` | `ChannelPost` | instance | Crée une instance ChannelPost |
| `save` | — | `Promise<void>` | instance | Sauvegarde en base |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime tous les posts |
| `injectTest` | — | `Promise<void>` | static | **[DEV]** Injecte 2 posts par canal + des réponses pour chaque membre non-admin |

### ChannelPostResponse

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: ChannelPostResponseType` | `ChannelPostResponse` | instance | Crée une instance ChannelPostResponse |
| `save` | — | `Promise<void>` | instance | Sauvegarde en base |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime toutes les réponses |

---

## 5. Catalogue des messages associés

Pattern consolidé : 4 messages C→S (`channel_get`, `channel_action`, `channel_member`, `channel_post`) avec champ `type` discriminant — 4 réponses S→C symétriques. Les réponses portent `type` (opération) + `etat` (`true`/`false`) + `error?` en cas d'échec.

Service : `BACKEND/src/models/services/ChannelService.ts`. Domaine `channel` dans `ListeMessages.ts`. Le périmètre de diffusion dépend de `isPublic` :
- Canal public → tous les sockets de l'équipe (via `TeamService.getTeamSocketIds`).
- Canal privé → uniquement les sockets membres du canal (`ChannelService.getChannelSocketIds`).

### Client → Serveur

| Message | `type` | Payload | Handler |
|---------|--------|---------|---------|
| `channel_get` | `list` | `{ teamId }` | `getChannels` (filtre la visibilité par membership pour les privés) |
| `channel_get` | `single` | `{ channelId }` | `getChannel` |
| `channel_action` | `create` | `{ teamId, name, isPublic, members?: string[] }` | `createChannel` (si public, attache tous les membres de l'équipe) |
| `channel_action` | `update` | `{ channelId, name, isPublic, teamId, members?: string[] }` | `updateChannel` (admin uniquement, réconciliation membres) |
| `channel_action` | `delete` | `{ channelId }` | `deleteChannel` (admin uniquement, cascade posts/responses/members) |
| `channel_member` | `list` | `{ channelId }` | `getChannelMembers` (membres populés) |
| `channel_member` | `add` | `{ channelId, userId }` | `addChannelMember` (admin uniquement) |
| `channel_member` | `remove` | `{ channelId, userId }` | `removeChannelMember` (admin uniquement, refus si cible admin) |
| `channel_member` | `leave` | `{ channelId }` | `leaveChannel` (refus si dernier admin) |
| `channel_post` | `list` | `{ channelId }` | `getChannelPosts` (posts triés `createdAt` ASC, réponses incluses) |
| `channel_post` | `user` | `{ channelId, userId }` | `getUserPost` (posts d'un utilisateur précis) |
| `channel_post` | `publish` | `{ channelId, content }` | `publishPost` (membre uniquement) |
| `channel_post` | `update` | `{ postId, content }` | `updatePost` (auteur uniquement) |
| `channel_post` | `delete` | `{ postId }` | `deletePost` (auteur ou admin du canal) |
| `channel_post` | `answer` | `{ postId, content }` | `answerPost` (membre, refus si auteur du post) |

### Serveur → Client

| Message | `type` | Payload (succès) | Diffusion |
|---------|--------|------------------|-----------|
| `channel_get_response` | `list` | `{ etat: true, channels: FormattedChannel[] }` | demandeur |
| `channel_get_response` | `single` | `{ etat: true, channel: FormattedChannel }` | demandeur |
| `channel_action_response` | `create` | `{ etat: true, channel }` | équipe (public) ou membres (privé) |
| `channel_action_response` | `update` | `{ etat: true, channel }` | équipe ou membres |
| `channel_action_response` | `delete` | `{ etat: true, channelId }` | équipe ou membres avant suppression |
| `channel_member_response` | `list` | `{ etat: true, channelId, members: FormattedMember[] }` | demandeur |
| `channel_member_response` | `add` | `{ etat: true, channelId, userId }` | membres du canal |
| `channel_member_response` | `remove` | `{ etat: true, channelId, userId }` | membres restants + sockets de la cible |
| `channel_member_response` | `leave` | `{ etat: true, channelId }` | demandeur |
| `channel_post_response` | `list` | `{ etat: true, channelId, posts: FormattedPost[] }` | demandeur |
| `channel_post_response` | `user` | `{ etat: true, posts: FormattedPost[] }` | demandeur |
| `channel_post_response` | `publish` | `{ etat: true, post: FormattedPost }` | membres du canal |
| `channel_post_response` | `update` | `{ etat: true, postId, channelId, content, updatedAt }` | membres du canal |
| `channel_post_response` | `delete` | `{ etat: true, postId, channelId }` | membres du canal |
| `channel_post_response` | `answer` | `{ etat: true, postId, response: FormattedResponse }` | membres du canal |

Tous les échecs : `{ etat: false, type, error: <code> }`.

### Codes d'erreur

`not_authenticated`, `channel_not_found`, `post_not_found`, `not_a_member`, `already_a_member`, `admin_required`, `cannot_remove_admin`, `last_admin_cannot_leave`, `not_the_author`, `not_authorized`, `cannot_answer_own_post`.

### Formats normalisés

```ts
type FormattedChannel = {
    id: string, name: string, isPublic: boolean,
    createdBy: string, createdAt: Date,
}

type FormattedMember = {
    id: string, userId: string,
    firstname?, lastname?, picture?,
    role: "admin" | "member", joinedAt: Date,
}

type FormattedPost = {
    id, channelId, content,
    authorId, authorFirstname?, authorLastname?, authorPicture?,
    createdAt, updatedAt,
    responseCount: number,
    responses: FormattedResponse[],
}

type FormattedResponse = {
    id, postId, content,
    authorId, authorFirstname?, authorLastname?, authorPicture?,
    createdAt, updatedAt,
}
```

**Total : 4 messages C→S × 15 dispatches + 4 messages S→C × 15 dispatches**

---

## 6. Types TypeScript

```typescript
type ChannelType = {
    name: string,
    teamId: Types.ObjectId,
    isPublic: boolean,
    createdBy: Types.ObjectId,
    createdAt?: Date,
    updatedAt?: Date,
    members?: Types.ObjectId[],
}

type ChannelMemberType = {
    channelId: Types.ObjectId,
    userId: Types.ObjectId,
    role?: string,
    joinedAt?: Date,
}

type ChannelPostType = {
    channelId: Types.ObjectId,
    content: string,
    authorId: Types.ObjectId,
    createdAt?: Date,
    updatedAt?: Date,
    responseCount?: number,
}

type ChannelPostResponseType = {
    postId: Types.ObjectId,
    content: string,
    authorId: Types.ObjectId,
    createdAt?: Date,
    updatedAt?: Date,
}
```

---

## 7. Relations avec autres modèles

| Modèle | Relation | Description |
|--------|----------|-------------|
| `Team` | Channel.teamId → Team | Chaque canal appartient à une équipe |
| `User` | Channel.createdBy → User | Créateur du canal |
| `User` | ChannelMember.userId → User | Membre du canal |
| `Channel` | ChannelMember.channelId → Channel | Canal d'appartenance |
| `Channel` | ChannelPost.channelId → Channel | Canal du post |
| `User` | ChannelPost.authorId → User | Auteur du post |
| `ChannelPost` | ChannelPostResponse.postId → ChannelPost | Post parent de la réponse |
| `User` | ChannelPostResponse.authorId → User | Auteur de la réponse |
| `Channel` | Channel.members[] → ChannelMember | Membres du canal (embedded refs) |

---

## 8. Index et contraintes

### Channel

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |

### ChannelMember

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |
| `channelId_userId` | `{ channelId: 1, userId: 1 }` | unique | Empêche les doublons de membres dans un canal |

### ChannelPost

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |
| `channelId_createdAt` | `{ channelId: 1, createdAt: -1 }` | compound | Optimise les requêtes de posts triés par date dans un canal |

### ChannelPostResponse

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |
| `postId_createdAt` | `{ postId: 1, createdAt: 1 }` | compound | Optimise les requêtes de réponses triées par date pour un post |

---

## 9. Exemples

### Créer un canal avec un membre et un post

```typescript
const channel = new Channel({
    name: "Général",
    teamId: teamId,
    isPublic: true,
    createdBy: userId,
});
await channel.save();

const member = new ChannelMember({
    channelId: channel.modelInstance._id,
    userId: userId,
    role: "admin",
});
await member.save();

const post = new ChannelPost({
    channelId: channel.modelInstance._id,
    content: "Bienvenue sur le canal !",
    authorId: userId,
});
await post.save();

const response = new ChannelPostResponse({
    postId: post.modelInstance._id,
    content: "Merci !",
    authorId: otherUserId,
});
await response.save();
```

### Documents MongoDB

```json
// Channel
{ "_id": "ObjectId('ch1...')", "name": "Général", "teamId": "ObjectId('t1...')", "isPublic": true,
  "createdBy": "ObjectId('u1...')", "members": ["ObjectId('cm1...')"] }

// ChannelPost
{ "_id": "ObjectId('p1...')", "channelId": "ObjectId('ch1...')", "content": "Bienvenue sur le canal !",
  "authorId": "ObjectId('u1...')", "responseCount": 1, "createdAt": "2026-03-01T10:00:00.000Z" }

// ChannelPostResponse
{ "_id": "ObjectId('r1...')", "postId": "ObjectId('p1...')", "content": "Merci !",
  "authorId": "ObjectId('u2...')", "createdAt": "2026-03-01T10:05:00.000Z" }
```

### Message Socket.io — publier un post

```typescript
// Client
{ id: socketId, channel_post: { type: "publish", channelId: "ch1...", content: "Hello tout le monde !" } }

// Serveur (broadcast aux membres du canal)
{ id: [s1, s2], channel_post_response: { type: "publish", etat: true, post: { id, channelId, content, authorId, responseCount: 0, responses: [] } } }
```
