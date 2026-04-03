# UserService

**Source**: `BACKEND/src/models/services/UserService.ts`

Gère les opérations de requête et de mise à jour des utilisateurs. Distinct de AuthService qui gère le login/inscription/session. Utilise le pattern pub/sub du contrôleur avec une Map de handlers pour le dispatch des messages. Les opérations admin (mise à jour du statut/rôles) sont gardées par AccessRoleGuard.

## Messages

| Nom | Direction | Payload (types) | Exemple | Description |
|-----|-----------|-----------------|---------|-------------|
| `user_get` | client->server | `{ type: "list" }` ou `{ type: "info", userId: string }` ou `{ type: "search", query: string }` | `{ type: "search", query: "john" }` | Requête utilisateurs : lister les actifs, obtenir les infos, ou rechercher |
| `user_get_response` | server->client | `{ type: string, etat: boolean, users?: [], user?: {}, error?: string }` | `{ type: "list", etat: true, users: [...] }` | Réponse avec les données utilisateur ou erreur |
| `user_update` | client->server | `{ type: "profile"\|"status"\|"roles", ... }` | `{ type: "profile", firstname: "John" }` | Mise à jour du profil, statut ou rôles de l'utilisateur |
| `user_update_response` | server->client | `{ type: string, etat: boolean, userId?: string, status?: string, roles?: string[], error?: string }` | `{ type: "profile", etat: true }` | Réponse à l'opération de mise à jour |

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `controleur` | `any` | - | Instance du contrôleur pour la messagerie pub/sub |
| `nomDInstance` | `string` | `"UserService"` | Nom d'enregistrement auprès du contrôleur |
| `handlers` | `Map<string, MessageHandler>` | - | Map privée associant le nom du message à la fonction de traitement |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `constructor` | `controleur: any, name: string` | `UserService` | Stocke la référence au contrôleur et le nom d'instance |
| `register` | - | `void` | Enregistre les deux handlers et souscrit auprès du contrôleur |
| `traitementMessage` | `msg: any` | `void` | Extrait la clé d'action du message et délègue au handler correspondant |
| `registerHandler` | `messageName: string, handler: MessageHandler` | `void` | Privé. Ajoute un handler à la Map interne |
| `send` | `socketIds: string \| string[], messageName: string, payload: unknown` | `void` | Privé. Envoie un message via controleur.envoie |
| `resolveUserId` | `socketId: string` | `string \| null` | Privé. Résout un socketId en userId via SessionManager |
| `handleUserQuery` | `socketId: string, payload: { type: string }` | `void` | Privé. Dispatche vers getUsersList, getUserInfo ou searchUsers |
| `handleUserUpdate` | `socketId: string, payload: { type: string }` | `void` | Privé. Dispatche vers updateUser, updateUserStatus ou updateUserRoles |
| `getUsersList` | `socketId: string` | `Promise<void>` | Privé. Retourne tous les utilisateurs actifs avec les champs : id, firstname, lastname, email, picture, isOnline, job |
| `getUserInfo` | `socketId: string, payload: { userId: string }` | `Promise<void>` | Privé. Retourne les infos complètes de l'utilisateur incluant desc, phone, dateCreated |
| `searchUsers` | `socketId: string, payload: { query: string }` | `Promise<void>` | Privé. Recherche regex insensible à la casse sur firstname, lastname, email. Limité à 20 résultats |
| `updateUser` | `socketId: string, payload: Record<string, any>` | `Promise<void>` | Privé. Met à jour son propre profil. Champs autorisés : firstname, lastname, phone, job, desc, picture |
| `updateUserStatus` | `socketId: string, payload: { userId: string, status: string }` | `Promise<void>` | Privé. Admin requis via AccessRoleGuard. Met à jour le statut de l'utilisateur cible |
| `updateUserRoles` | `socketId: string, payload: { userId: string, roles: string[] }` | `Promise<void>` | Privé. Admin requis via AccessRoleGuard. Met à jour les rôles de l'utilisateur cible |

## Détails

- getUsersList ne retourne que les utilisateurs avec le statut "active".
- searchUsers filtre sur le statut "active" et recherche sur firstname, lastname ou email en utilisant une regex insensible à la casse.
- updateUser approche par liste blanche : seuls les champs firstname, lastname, phone, job, desc, picture sont acceptés. Les autres champs du payload sont ignorés.
- updateUserStatus et updateUserRoles utilisent AccessRoleGuard.requireRole(socketId, "admin") pour l'autorisation, retournant la raison du garde en cas d'échec.

## Flux

Voir [user-flows.md](../../flows/user-flows.md)
