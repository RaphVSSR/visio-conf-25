# TeamService

**Source**: `BACKEND/src/models/services/TeamService.ts`

Gère toutes les opérations sur les équipes incluant le CRUD sur les équipes et la gestion des membres. Utilise le pattern pub/sub du contrôleur avec une Map de handlers pour le dispatch des messages. Chaque opération vérifie l'authentification via SessionManager. Le rôle admin sur l'équipe est requis pour les mutations (update, delete, ajout/suppression de membre).

## Messages

| Nom | Direction | Payload (types) | Exemple | Description |
|-----|-----------|-----------------|---------|-------------|
| `team_get` | client->server | `{ type: "list" }` ou `{ type: "all" }` | `{ type: "list" }` | Requête des équipes de l'utilisateur ou de toutes les équipes |
| `team_get_response` | server->client | `{ type: string, etat: boolean, teams?: [], error?: string }` | `{ type: "list", etat: true, teams: [...] }` | Réponse avec les données des équipes ou erreur |
| `team_action` | client->server | `{ type: "create"\|"update"\|"delete"\|"leave", ... }` | `{ type: "create", name: "Dev", members: ["id1"] }` | Créer, mettre à jour, supprimer ou quitter une équipe |
| `team_action_response` | server->client | `{ type: string, etat: boolean, team?: {}, teamId?: string, error?: string }` | `{ type: "create", etat: true, team: {...} }` | Réponse à l'action sur l'équipe |
| `team_member` | client->server | `{ type: "list"\|"add"\|"remove", teamId: string, userId?: string }` | `{ type: "add", teamId: "abc", userId: "xyz" }` | Opérations sur les membres d'une équipe |
| `team_member_response` | server->client | `{ type: string, etat: boolean, members?: [], teamId?: string, error?: string }` | `{ type: "list", etat: true, members: [...] }` | Réponse à l'opération sur les membres |

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `controleur` | `any` | - | Instance du contrôleur pour la messagerie pub/sub |
| `nomDInstance` | `string` | `"TeamService"` | Nom d'enregistrement auprès du contrôleur |
| `handlers` | `Map<string, MessageHandler>` | - | Map privée associant le nom du message à la fonction de traitement |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `constructor` | `controleur: any, name: string` | `TeamService` | Stocke la référence au contrôleur et le nom d'instance |
| `register` | - | `void` | Enregistre les 3 handlers et souscrit auprès du contrôleur |
| `traitementMessage` | `msg: any` | `void` | Extrait la clé d'action du message et délègue au handler correspondant |
| `registerHandler` | `messageName: string, handler: MessageHandler` | `void` | Privé. Ajoute un handler à la Map interne |
| `send` | `socketIds: string \| string[], messageName: string, payload: unknown` | `void` | Privé. Envoie un message via controleur.envoie |
| `resolveUserId` | `socketId: string` | `string \| null` | Privé. Résout un socketId en userId via SessionManager |
| `handleTeamQuery` | `socketId: string, payload: { type: string }` | `void` | Privé. Dispatche vers getTeamsList ou getAllTeams |
| `handleTeamAction` | `socketId: string, payload: { type: string }` | `void` | Privé. Dispatche vers create/update/delete/leaveTeam |
| `handleTeamMember` | `socketId: string, payload: { type: string }` | `void` | Privé. Dispatche vers list/add/removeTeamMember |
| `getTeamsList` | `socketId: string` | `Promise<void>` | Privé. Retourne les équipes où l'utilisateur est membre, inclut le rôle de l'utilisateur par équipe |
| `getAllTeams` | `socketId: string` | `Promise<void>` | Privé. Retourne toutes les équipes du système |
| `createTeam` | `socketId: string, payload: { name, description?, picture?, members[] }` | `Promise<void>` | Privé. Crée l'équipe, ajoute le créateur comme admin, ajoute les membres spécifiés comme "member" |
| `updateTeam` | `socketId: string, payload: { id, name?, description?, picture? }` | `Promise<void>` | Privé. Admin requis. Met à jour uniquement les champs fournis |
| `deleteTeam` | `socketId: string, payload: { teamId }` | `Promise<void>` | Privé. Admin requis. En cascade : supprime toutes les réponses aux posts des channels, posts, membres des channels, channels, membres de l'équipe, puis l'équipe |
| `leaveTeam` | `socketId: string, payload: { teamId }` | `Promise<void>` | Privé. Interdit si dernier admin |
| `getTeamMembers` | `socketId: string, payload: { teamId }` | `Promise<void>` | Privé. Retourne tous les membres avec les infos utilisateur peuplées (firstname, lastname, picture) |
| `addTeamMember` | `socketId: string, payload: { teamId, userId }` | `Promise<void>` | Privé. Admin requis. Empêche les doublons |
| `removeTeamMember` | `socketId: string, payload: { teamId, userId }` | `Promise<void>` | Privé. Admin requis. Ne peut pas supprimer un admin |

## Détails

- Forme de l'équipe formatée : `{ id, name, description, picture, createdBy, createdAt, updatedAt, role }` (role inclus uniquement dans les réponses getTeamsList et createTeam).
- Forme du membre formaté : `{ id, userId, firstname, lastname, picture, role, joinedAt }`.
- Ordre de cascade deleteTeam : pour chaque channel de l'équipe -> supprime les réponses aux posts, posts, membres du channel -> supprime tous les channels -> supprime les membres de l'équipe -> supprime l'équipe.
- Toutes les réponses vont uniquement au socket demandeur (pas de pattern de diffusion dans ce service).

## Flux

Voir [team-flows.md](../../flows/team-flows.md)
