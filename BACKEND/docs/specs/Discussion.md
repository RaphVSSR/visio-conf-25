# Référence du Modèle Discussion — VisioConf

**Fichier source** : `BACKEND/src/models/Discussion.ts`
**Classe parente** : `Collection` (abstract)
**Collection MongoDB** : `Discussion`

---

## 1. Schema complet

### Discussion

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('d1...')` |
| `uuid` | `String` | oui | — | — | Identifiant unique de la discussion | `"discu-001"` |
| `name` | `String` | non | `""` | — | Nom de la discussion | `"Projet Web"` |
| `description` | `String` | non | `""` | — | Description de la discussion | `""` |
| `creator` | `ObjectId` | oui | — | `User` | Créateur de la discussion | `ObjectId('u1...')` |
| `type` | `String` | oui | `"unique"` | — | Type de discussion. Enum: `"unique"`, `"group"` | `"group"` |
| `members` | `ObjectId[]` | oui | — | `User` | Liste des participants | `[ObjectId('u1...'), ObjectId('u2...')]` |
| `date_created` | `Date` | oui | `Date.now` | — | Date de création | `2026-03-01T09:55:00Z` |
| `messages` | `Message[]` | non | `[]` | — | Messages de la discussion (sous-document, voir ci-dessous) | voir ci-dessous |

### Message (sous-document embedded)

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `uuid` | `String` | oui | — | — | Identifiant unique du message | `"msg-001"` |
| `content` | `String` | oui | — | — | Contenu du message | `"Salut l'équipe !"` |
| `sender` | `ObjectId` | oui | — | `User` | Expéditeur du message | `ObjectId('u1...')` |
| `date_created` | `Date` | oui | `Date.now` | — | Date d'envoi | `2026-03-01T10:00:00Z` |
| `react_list` | `Reaction[]` | non | `[]` | — | Liste des réactions (sous-document, voir ci-dessous) | `[{ user: ObjectId('u2...'), type: "like" }]` |
| `status` | `String` | oui | `"sent"` | — | Statut du message. Enum: `"sent"`, `"read"` | `"sent"` |

### Reaction (sous-document embedded dans Message)

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `user` | `ObjectId` | oui | — | `User` | Utilisateur ayant réagi | `ObjectId('u2...')` |
| `type` | `String` | oui | `"like"` | — | Type de réaction. Enum: `"like"`, `"love"`, `"haha"`, `"wow"`, `"sad"`, `"angry"` | `"like"` |

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<DiscuType>` | `protected static` | Schéma Mongoose de la collection |
| `model` | `Model<DiscuType>` | `static` | Modèle Mongoose (singleton via `mongoose.models`) |
| `modelInstance` | `Document<DiscuType>` | `public` | Instance du document Mongoose |
| `areVirtualsInitialized` | `boolean` | `private static` | IIFE qui initialise les virtuals au chargement |
| `areMethodsInitialized` | `boolean` | `private static` | IIFE qui initialise les méthodes du schéma au chargement |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description |
|-----|------|--------|-------------|
| `models` | `object` | `mongoose.models` | Cache des modèles Mongoose enregistrés |
| `VERBOSE` | `env` | `process.env.VERBOSE` | Active les logs d'injection |
| `VERBOSE_LVL` | `env` | `process.env.VERBOSE_LVL` | Niveau de verbosité (3 = détaillé) |

---

## 4. Méthodes

### Méthodes de classe

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: DiscuType` | `Discussion` | instance | Crée une instance Discussion |
| `save` | — | `Promise<void>` | instance | Sauvegarde en base de données |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime toutes les discussions |
| `injectTest` | — | `Promise<void>` | static | **[DEV]** Injecte 5 discussions de test (2 uniques + 2 groupes + 1 unique) avec des messages préremplis. En production, les discussions sont créées via les messages Socket.io |
| `findManyByUser` | `user: UserType & { _id: number }` | `Promise<Document[]>` | static | Trouve toutes les discussions d'un utilisateur, avec populate sur members et messages.sender |
| `findPopulateMembersByDiscussionId` | `uuid: string` | `Promise<Document \| null>` | static | Trouve une discussion par uuid, avec populate sur members et messages.sender |

### Virtuals

| Virtual | Retour | Description |
|---------|--------|-------------|
| `discussionMembersCount` | `number` | Nombre de membres de la discussion |
| `discussionMessagesCount` | `number` | Nombre de messages dans la discussion |
| `info` | `DiscuType` | Retourne un objet résumé de la discussion (uuid, name, description, creator, type, members, date_created) |

### Méthodes du schéma

| Méthode | Retour | Description |
|---------|--------|-------------|
| `findLastMessage` | `Message` | Retourne le dernier message de la discussion (accède à `this.discussion_messages`) |

---

## 5. Catalogue des messages associés

### Client → Serveur (5 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `discuss_list_request` | `{}` | Demande la liste des discussions de l'utilisateur |
| `users_search_request` | `{ query: string }` | Recherche d'utilisateurs (pour créer une discussion) |
| `discuss_remove_member_request` | `{ discussionId: string, memberId: string }` | Retirer un membre d'une discussion |
| `discuss_remove_message_request` | `{ discussionId: string, messageId: string }` | Supprimer un message d'une discussion |
| `message_status_request` | `{ discussionId: string, messageId: string, status: string }` | Mettre à jour le statut d'un message (sent → read) |

Autres messages liés (dans ListeMessages mais gérés par d'autres services) :

| Message | Payload | Description |
|---------|---------|-------------|
| `messages_get_request` | `{ discussionId: string }` | Demande l'historique des messages |
| `message_send_request` | `{ discussionId: string, content: string }` | Envoi d'un message |

### Serveur → Client (5 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `discuss_list_response` | `{ discussions: Discussion[] }` | Réponse avec les discussions |
| `users_search_response` | `{ users: User[] }` | Réponse avec les utilisateurs trouvés |
| `discuss_remove_member_response` | `{ success: boolean }` | Confirmation de retrait d'un membre |
| `discuss_remove_message_response` | `{ success: boolean }` | Confirmation de suppression d'un message |
| `message_status_response` | `{ success: boolean }` | Confirmation de la mise à jour du statut |

Autres messages liés :

| Message | Payload | Description |
|---------|---------|-------------|
| `messages_get_response` | `{ messages: Message[] }` | Réponse avec l'historique |
| `message_send_response` | `{ message: Message }` | Confirmation d'envoi |

**Total : 7 client→serveur + 7 serveur→client = 14 messages**

---

## 6. Types TypeScript

```typescript
type DiscuType = {
    uuid: string,
    name: string,
    description?: string,
    creator: Types.ObjectId,
    type?: string,
    members: Types.ObjectId[],
    date_created?: Date,
    messages?: {
        uuid: string,
        content: string,
        sender: Types.ObjectId,
        date_created: Date,
        react_list?: {
            user: Types.ObjectId,
            type: string,
        },
        status?: string,
    }[],
}
```

---

## 7. Relations avec autres modèles

| Modèle | Relation | Description |
|--------|----------|-------------|
| `User` | Discussion.creator → User | Créateur de la discussion |
| `User` | Discussion.members[] → User | Participants de la discussion (populate sur `firstname lastname picture socket_id uuid`) |
| `User` | Discussion.messages[].sender → User | Expéditeur de chaque message (populate sur `firstname lastname picture socket_id uuid`) |
| `User` | Discussion.messages[].react_list[].user → User | Utilisateur ayant réagi |
| `reactIcon` | — | Le sous-modèle reactIcon (`reactIcon.ts`) définit les types de réactions disponibles, documenté ici dans le schéma Reaction |

---

## 8. Index et contraintes

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |

Aucun index personnalisé défini. Les messages sont stockés en sous-documents embedded (pas de collection séparée).

---

## 9. Exemples

### Créer une discussion avec des messages

```typescript
const discu = new Discussion({
    uuid: "discu-001",
    name: "Projet Web",
    creator: userId1,
    type: "group",
    members: [userId1, userId2, userId3],
    messages: [
        { uuid: "msg-001", content: "Salut l'équipe !", sender: userId1, date_created: new Date(), status: "sent" },
        { uuid: "msg-002", content: "Salut !", sender: userId2, date_created: new Date(), status: "read",
          react_list: [{ user: userId1, type: "like" }] },
    ],
});
await discu.save();
```

### Requêter les discussions d'un utilisateur

```typescript
const discussions = await Discussion.findManyByUser(user);
// → Populate sur members (firstname, lastname, picture, socket_id, uuid) et messages.sender

const discu = await Discussion.findPopulateMembersByDiscussionId("discu-001");
// → Discussion avec members et messages.sender populated
```

### Virtuals

```typescript
discu.discussionMembersCount  // → 3
discu.discussionMessagesCount // → 2
discu.info                    // → { uuid: "discu-001", name: "Projet Web", type: "group", members: [...], ... }
```

### Document MongoDB

```json
{
    "_id": "ObjectId('d1...')",
    "uuid": "discu-001",
    "name": "Projet Web",
    "creator": "ObjectId('u1...')",
    "type": "group",
    "members": ["ObjectId('u1...')", "ObjectId('u2...')", "ObjectId('u3...')"],
    "messages": [
        { "uuid": "msg-001", "content": "Salut l'équipe !", "sender": "ObjectId('u1...')",
          "date_created": "2026-03-01T10:00:00.000Z", "status": "sent", "react_list": [] },
        { "uuid": "msg-002", "content": "Salut !", "sender": "ObjectId('u2...')",
          "date_created": "2026-03-01T10:01:00.000Z", "status": "read",
          "react_list": [{ "user": "ObjectId('u1...')", "type": "like" }] }
    ],
    "date_created": "2026-03-01T09:55:00.000Z"
}
```

### Message Socket.io — envoyer un message

```typescript
// Client
{ id: socketId, message_send_request: { discussionId: "discu-001", content: "Bonne idée !" } }

// Serveur
{ id: socketId, message_send_response: { message: { uuid: "msg-003", content: "Bonne idée !", sender: "u1...", status: "sent" } } }
```
