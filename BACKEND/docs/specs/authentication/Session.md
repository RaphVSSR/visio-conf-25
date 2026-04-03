# SessionManager

**Source**: `BACKEND/src/models/services/authentication/SessionManager.ts`

Classe statique qui gère la liaison socket-utilisateur via les rooms Socket.io et `express-session`. Les sessions sont stockées dans MongoDB via `connect-mongodb-session`. Le mapping entre sockets et utilisateurs est maintenu dans `socket.request.session.userId` et les rooms Socket.io nommées par userId.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `io` | `Server` (socket.io, private static) | — | Référence à l'instance du serveur Socket.io |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `bindToServer` | `io: Server` | `void` | Stocke la référence au serveur Socket.io |
| `bind` | `socketId: string, userId: string` | `void` | Écrit `userId` dans `socket.request.session`, sauvegarde la session, ajoute le socket à la room userId |
| `unbind` | `socketId: string` | `void` | Lit `session.userId`, quitte la room userId, supprime `session.userId`, sauvegarde la session |
| `getUserId` | `socketId: string` | `string \| null` | Lit et retourne `socket.request.session.userId`, ou null si absent |
| `getUserSocketIds` | `userId: string` | `string[]` | Retourne tous les socketIds dans la room Socket.io nommée par userId |
| `hasActiveSessions` | `userId: string` | `boolean` | Retourne true si la room userId existe et contient au moins un socket |
| `refreshSession` | `socketId: string` | `void` | Met à jour `session.cookie.maxAge` avec la durée configurée, sauvegarde la session |
| `getSessionDurationMs` | — | `number` | Parse la variable d'env `SESSION_DURATION` et retourne la durée en millisecondes |
| `parseExpiryToMs` | `expiry: string` (private static) | `number` | Convertit le format `{number}{s\|m\|h\|d}` en millisecondes, défaut à 24h si invalide |

## Détails

La variable d'env `SESSION_DURATION` accepte le format `{number}{s|m|h|d}` (ex. `"24h"`, `"30m"`, `"7d"`). Défaut à `"24h"` si non définie ou non parseable.

Toutes les méthodes sont statiques. Pas d'instanciation nécessaire — appeler `SessionManager.bindToServer(io)` au démarrage, puis utiliser les méthodes statiques directement.

`bind()` et `unbind()` appellent tous deux `session.save()` pour persister les changements dans le store de sessions MongoDB. Le join/leave des rooms Socket.io maintient le mapping en mémoire synchronisé pour `getUserSocketIds()` et `hasActiveSessions()`.

## Flux

Voir [auth-flows.md](../../flows/auth-flows.md)
