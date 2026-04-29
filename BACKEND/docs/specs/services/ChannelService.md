# ChannelService

**Source**: `BACKEND/src/models/services/ChannelService.ts`

Gère toutes les opérations sur les channels incluant le CRUD sur les channels, la gestion des membres, les posts et les réponses aux posts au sein des équipes. Utilise le pattern pub/sub du contrôleur avec une Map de handlers pour le dispatch des messages. Chaque opération vérifie l'authentification via SessionManager. Le rôle admin sur le channel est requis pour les mutations (update, delete, ajout/suppression de membre).

## Messages

| Nom | Direction | Payload (types) | Exemple | Description |
|-----|-----------|-----------------|---------|-------------|
| `channel_get` | client->server | `{ type: "list", teamId: string }` ou `{ type: "single", channelId: string }` | `{ type: "list", teamId: "abc123" }` | Requête de channels par équipe ou channel unique |
| `channel_get_response` | server->client | `{ type: string, etat: boolean, channels?: [], channel?: {}, error?: string }` | `{ type: "list", etat: true, channels: [...] }` | Réponse avec les données du channel ou erreur |
| `channel_action` | client->server | `{ type: "create"\|"update"\|"delete", ... }` | `{ type: "create", name: "general", isPublic: true, teamId: "abc" }` | Créer, mettre à jour ou supprimer un channel |
| `channel_action_response` | server->client | `{ type: string, etat: boolean, channel?: {}, channelId?: string, error?: string }` | `{ type: "create", etat: true, channel: {...} }` | Réponse à l'action sur le channel |
| `channel_member` | client->server | `{ type: "list"\|"add"\|"remove"\|"leave", channelId: string, userId?: string }` | `{ type: "add", channelId: "abc", userId: "xyz" }` | Opérations sur les membres d'un channel |
| `channel_member_response` | server->client | `{ type: string, etat: boolean, members?: [], channelId?: string, error?: string }` | `{ type: "list", etat: true, members: [...] }` | Réponse à l'opération sur les membres |
| `channel_post` | client->server | `{ type: "list"\|"user"\|"publish"\|"update"\|"delete"\|"answer", ... }` | `{ type: "publish", channelId: "abc", content: "hello" }` | Opérations sur les posts d'un channel |
| `channel_post_response` | server->client | `{ type: string, etat: boolean, posts?: [], post?: {}, postId?: string, error?: string }` | `{ type: "publish", etat: true, post: {...} }` | Réponse à l'opération sur les posts |

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `controleur` | `any` | - | Instance du contrôleur pour la messagerie pub/sub |
| `nomDInstance` | `string` | `"ChannelService"` | Nom d'enregistrement auprès du contrôleur |
| `handlers` | `Map<string, MessageHandler>` | - | Map privée associant le nom du message à la fonction de traitement |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `constructor` | `controleur: any, name: string` | `ChannelService` | Stocke la référence au contrôleur et le nom d'instance |
| `register` | - | `void` | Enregistre les 4 handlers et souscrit auprès du contrôleur |
| `traitementMessage` | `msg: any` | `void` | Extrait la clé d'action du message et délègue au handler correspondant |
| `registerHandler` | `messageName: string, handler: MessageHandler` | `void` | Privé. Ajoute un handler à la Map interne |
| `send` | `socketIds: string \| string[], messageName: string, payload: unknown` | `void` | Privé. Envoie un message via controleur.envoie |
| `resolveUserId` | `socketId: string` | `string \| null` | Privé. Résout un socketId en userId via SessionManager |
| `getConnectedChannelMemberSocketIds` | `channelId: string` | `Promise<string[]>` | Privé. Retourne les IDs socket de tous les membres connectés du channel |
| `getConnectedTeamMemberSocketIds` | `teamId: string` | `Promise<string[]>` | Privé. Retourne les IDs socket de tous les membres connectés de l'équipe |
| `handleChannelQuery` | `socketId: string, payload: { type: string }` | `void` | Privé. Dispatche vers getChannels ou getChannel |
| `handleChannelAction` | `socketId: string, payload: { type: string }` | `void` | Privé. Dispatche vers create/update/deleteChannel |
| `handleChannelMember` | `socketId: string, payload: { type: string }` | `void` | Privé. Dispatche vers list/add/remove/leaveChannel members |
| `handleChannelPost` | `socketId: string, payload: { type: string }` | `void` | Privé. Dispatche vers list/user/publish/update/delete/answer post |
| `getChannels` | `socketId: string, payload: { teamId: string }` | `Promise<void>` | Privé. Retourne les channels publics + channels privés où l'utilisateur est membre |
| `getChannel` | `socketId: string, payload: { channelId: string }` | `Promise<void>` | Privé. Retourne un channel unique avec vérification de visibilité |
| `createChannel` | `socketId: string, payload: { name, isPublic, teamId, members? }` | `Promise<void>` | Privé. Crée le channel, ajoute le créateur comme admin. Public : ajoute tous les membres de l'équipe. Privé : ajoute les membres spécifiés. Diffuse à l'équipe |
| `updateChannel` | `socketId: string, payload: { id, name, isPublic, teamId, members? }` | `Promise<void>` | Privé. Admin requis. Synchronise les membres lors du basculement public/privé. Diffuse à l'équipe |
| `deleteChannel` | `socketId: string, payload: { channelId }` | `Promise<void>` | Privé. Admin requis. En cascade : supprime les réponses aux posts, les posts, les membres, puis le channel. Diffuse à l'équipe |
| `getChannelMembers` | `socketId: string, payload: { channelId }` | `Promise<void>` | Privé. Vérifie l'appartenance sur les channels privés. Peuple les infos utilisateur |
| `addChannelMember` | `socketId: string, payload: { channelId, userId }` | `Promise<void>` | Privé. Admin requis. Empêche les doublons |
| `removeChannelMember` | `socketId: string, payload: { channelId, userId }` | `Promise<void>` | Privé. Admin requis. Ne peut pas supprimer un admin |
| `leaveChannel` | `socketId: string, payload: { channelId }` | `Promise<void>` | Privé. Interdit si dernier admin |
| `getChannelPosts` | `socketId: string, payload: { channelId }` | `Promise<void>` | Privé. Retourne les posts avec les réponses imbriquées, triés par createdAt ascendant |
| `getUserPost` | `socketId: string, payload: { channelId, userId }` | `Promise<void>` | Privé. Filtre les posts par auteur |
| `publishPost` | `socketId: string, payload: { channelId, content }` | `Promise<void>` | Privé. Appartenance requise. Diffuse aux membres du channel |
| `updatePost` | `socketId: string, payload: { postId, content }` | `Promise<void>` | Privé. Auteur uniquement |
| `deletePost` | `socketId: string, payload: { postId }` | `Promise<void>` | Privé. Auteur ou admin du channel. En cascade : supprime les réponses |
| `answerPost` | `socketId: string, payload: { postId, content }` | `Promise<void>` | Privé. Ne peut pas répondre à son propre post. Incrémente responseCount. Diffuse aux membres du channel |

## Détails

- Cibles de diffusion : channel_action_response va à tous les membres connectés de l'équipe. channel_post_response (publish/answer) va à tous les membres connectés du channel. Les autres réponses vont uniquement au socket demandeur.
- Forme du channel formaté : `{ id, name, isPublic, createdBy, createdAt }`
- Forme du membre formaté : `{ id, userId, firstname, lastname, picture, role, joinedAt }`
- Forme du post formaté : `{ id, channelId, content, authorId, authorFirstname, authorLastname, authorPicture, createdAt, updatedAt, responseCount, responses[] }`
- Forme de la réponse formatée : `{ id, postId, content, authorId, authorFirstname, authorLastname, authorPicture, createdAt, updatedAt }`

## Flux

Voir [channel-flows.md](../../flows/channel-flows.md)
