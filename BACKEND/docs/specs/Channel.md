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

### Client → Serveur (12 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `channels_list_request` | `{ teamId: string }` | Demande les canaux d'une équipe |
| `channel_create_request` | `{ teamId: string, name: string, isPublic?: boolean }` | Création d'un canal |
| `channel_update_request` | `{ channelId: string, data: Partial<ChannelType> }` | Mise à jour d'un canal |
| `channel_delete_request` | `{ channelId: string }` | Suppression d'un canal |
| `channel_leave_request` | `{ channelId: string }` | Quitter un canal |
| `channel_members_request` | `{ channelId: string }` | Demande la liste des membres d'un canal |
| `channel_add_member_request` | `{ channelId: string, userId: string }` | Ajouter un membre à un canal |
| `channel_remove_member_request` | `{ channelId: string, userId: string }` | Retirer un membre d'un canal |
| `channel_posts_request` | `{ channelId: string }` | Demande les posts d'un canal |
| `channel_post_create_request` | `{ channelId: string, content: string }` | Création d'un post |
| `channel_post_responses_request` | `{ postId: string }` | Demande les réponses d'un post |
| `channel_post_response_create_request` | `{ postId: string, content: string }` | Création d'une réponse |

### Serveur → Client (12 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `channels_list_response` | `{ channels: Channel[] }` | Réponse avec les canaux |
| `channel_create_response` | `{ channel: Channel }` | Confirmation de création |
| `channel_update_response` | `{ channel: Channel }` | Confirmation de mise à jour |
| `channel_delete_response` | `{ success: boolean }` | Confirmation de suppression |
| `channel_leave_response` | `{ success: boolean }` | Confirmation de départ |
| `channel_members_response` | `{ members: ChannelMember[] }` | Réponse avec les membres |
| `channel_add_member_response` | `{ member: ChannelMember }` | Confirmation d'ajout |
| `channel_remove_member_response` | `{ success: boolean }` | Confirmation de retrait |
| `channel_posts_response` | `{ posts: ChannelPost[] }` | Réponse avec les posts |
| `channel_post_create_response` | `{ post: ChannelPost }` | Confirmation de création |
| `channel_post_responses_response` | `{ responses: ChannelPostResponse[] }` | Réponse avec les réponses |
| `channel_post_response_create_response` | `{ response: ChannelPostResponse }` | Confirmation de création |

**Total : 12 client→serveur + 12 serveur→client = 24 messages**

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

### Message Socket.io — créer un post

```typescript
// Client
{ id: socketId, channel_post_create_request: { channelId: "ch1...", content: "Hello tout le monde !" } }

// Serveur
{ id: socketId, channel_post_create_response: { post: { channelId: "ch1...", content: "Hello tout le monde !", authorId: "u1...", responseCount: 0 } } }
```
