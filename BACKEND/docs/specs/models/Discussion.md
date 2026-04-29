# Discussion

**Source**: `BACKEND/src/models/Discussion.ts`

Représente une conversation par messagerie directe entre utilisateurs, en tête-à-tête ou en groupe. Contient des sous-documents de messages embarqués avec réactions et statut de lecture. Étend Collection.

## Schema

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| uuid | String (required) | `"a1b2c3-..."` | Identifiant unique de la discussion |
| name | String | `"Discussion John et Janny"` | Nom d'affichage (défaut : "") |
| description | String | `"Project chat"` | Description optionnelle (défaut : "") |
| creator | ObjectId (required, ref: User) | `ObjectId("...")` | Utilisateur qui a créé la discussion |
| type | String (required, enum) | `"unique"` | Type de discussion : "unique" ou "group" (défaut : "unique") |
| members | ObjectId[] (required, ref: User) | `[ObjectId("...")]` | Utilisateurs participants |
| date_created | Date (required) | `2026-03-30T...` | Horodatage de création (défaut : Date.now) |
| messages | Subdocument[] | voir ci-dessous | Tableau de messages embarqués |

### Sous-document Messages

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| uuid | String (required) | `"x1y2z3-..."` | Identifiant unique du message |
| content | String (required) | `"Hello!"` | Texte du message |
| sender | ObjectId (required, ref: User) | `ObjectId("...")` | Utilisateur qui a envoyé le message |
| date_created | Date (required) | `2026-03-30T...` | Horodatage d'envoi (défaut : Date.now) |
| react_list | Subdocument[] | voir ci-dessous | Tableau de réactions |
| status | String (required, enum) | `"sent"` | Statut du message : "sent" ou "read" (défaut : "sent") |

### Sous-document React

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| user | ObjectId (required, ref: User) | `ObjectId("...")` | Utilisateur qui a réagi |
| type | String (required, enum) | `"like"` | Un parmi : "like", "love", "haha", "wow", "sad", "angry" (défaut : "like") |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| constructor | dataToConstruct (DiscuType) | Discussion | Crée une nouvelle instance Discussion |
| save | -- | Promise\<void\> | Persiste l'instance, lance TracedError en cas d'échec |
| flushAll (static) | -- | Promise | Supprime tous les documents Discussion |
| injectTest (static) | -- | Promise\<void\> | Injecte 5 discussions de test avec des messages entre utilisateurs existants |
| findManyByUser (static) | user (UserType & { _id: number }) | Promise | Trouve toutes les discussions où l'utilisateur est membre, peuple les membres et expéditeurs de messages |
| findPopulateMembersByDiscussionId (static) | uuid (string) | Promise | Trouve une discussion par uuid, peuple les membres et expéditeurs de messages avec is_online |

## Détails

- DiscuType exporté pour usage externe
- Virtuels définis via IIFE : `discussionMembersCount` (members.length), `discussionMessagesCount` (messages.length), `info` (retourne les champs principaux sans les messages)
- Méthode d'instance du schema : `findLastMessage` retourne le dernier message de la discussion
- findManyByUser peuple : firstname, lastname, picture, socket_id, uuid
- findPopulateMembersByDiscussionId peuple en plus : is_online
