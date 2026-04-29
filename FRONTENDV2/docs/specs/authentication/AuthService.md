# AuthSync

**Source**: `FRONTENDV2/src/services/auth/AuthSync.ts` + `FRONTENDV2/src/services/auth/AuthSync.types.ts`

Gère l'authentification frontend via les messages Socket.io et les endpoints REST. S'abonne à 3 messages de réponse serveur (`login_response`, `authenticate_response`, `register_response`), envoie les mises à jour d'état à React via un callback `setState`, et gère les timers d'expiration de session. Au démarrage du socket, envoie automatiquement `authenticate` et configure la logique de reconnexion. La déconnexion et le rafraîchissement de session utilisent des routes REST (`/auth/logout`, `/auth/refresh`).

## Messages

| Nom | Direction | Payload (types) | Exemple | Description |
|-----|-----------|-----------------|---------|-------------|
| `login` | client -> server | `{ email: string, password: string }` | `{ email: "a@b.com", password: "abc" }` | Connexion avec identifiants |
| `register` | client -> server | `{ password: string, firstname: string, lastname: string, email: string, phone: string }` | `{ password: "x", firstname: "John", ... }` | Création de compte |
| `authenticate` | client -> server | `{}` | `{}` | Ré-authentification via cookie (rechargement de page, reconnexion socket) |
| `login_response` | server -> client | `{ status: "success" \| "failure", user?: AuthUser, expiresAt?: number }` | `{ status: "success", user: {...}, expiresAt: 17... }` | En cas de succès : définit l'utilisateur + démarre le timer d'expiration. En cas d'échec : définit `loginRejected: true` |
| `authenticate_response` | server -> client | `{ status: "success" \| "failure", user?: AuthUser, expiresAt?: number }` | `{ status: "success", user: {...} }` | En cas de succès : définit l'utilisateur + démarre le timer d'expiration. En cas d'échec : réinitialise l'état d'authentification |
| `register_response` | server -> client | `{ status: "success" \| "failure", user?: AuthUser, expiresAt?: number }` | `{ status: "failure" }` | En cas de succès : définit l'utilisateur + démarre le timer d'expiration. En cas d'échec : définit `isLoading: false` |
| `POST /auth/logout` | client -> server (REST) | — | — | Détruit la session et supprime le cookie |
| `POST /auth/refresh` | client -> server (REST) | — | Response: `{ status: "refreshed", expiresAt: number }` | Prolonge la session, relance le timer d'expiration |

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `socket` | `MessageClientAdapter` (private) | — | Wrapper Socket.io pour l'envoi/réception de messages |
| `onStateChange` | `StateUpdater` (private) | — | Callback React `setState` provenant de AuthContext |
| `expiryTimer` | `ReturnType<typeof setTimeout> \| null` (private) | — | Référence du timer d'avertissement d'expiration en cours |
| `BACKEND_URL` | `string` (module const) | `"http://localhost:3220"` | URL du backend depuis la variable d'environnement `REACT_APP_BACKEND_API_URL` |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `constructor` | `socket: MessageClientAdapter, onStateChange: StateUpdater` | `AuthSync` | S'abonne aux 3 messages de réponse, envoie `authenticate` quand le socket est prêt, configure le handler de reconnexion |
| `login` | `email: string, password: string` | `void` | Définit `isLoading: true`, réinitialise `loginRejected`, envoie le message `login` |
| `register` | `data: { password: string, firstname: string, lastname: string, email: string, phone: string }` | `void` | Définit `isLoading: true`, envoie le message `register` |
| `logout` | — | `Promise<void>` | Envoie un POST à `/auth/logout`, efface le timer d'expiration, réinitialise l'état d'authentification |
| `refreshSession` | — | `Promise<void>` | Envoie un POST à `/auth/refresh`, relance le timer si `status: "refreshed"`, sinon réinitialise l'état d'authentification |
| `destroy` | — | `void` | Efface le timer d'expiration, se désabonne des 3 messages de réponse |
| `startExpiryTimer` | `expiresAt: number` (private) | `void` | Timer à deux étapes : affiche d'abord l'avertissement (`showExpiryWarning: true`), puis réinitialise l'état d'authentification à l'expiration |
| `clearExpiryTimer` | — (private) | `void` | Annule le timer d'expiration actif |

## Types

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `AuthUser` | object | `{ _id: "abc", firstname: "John", ... }` | Données utilisateur avec `_id`, `firstname`, `lastname`, `email`, `phone`, `status`, `job`, `desc`, `picture`, `is_online`, `disturb_status`, `roles: string[]` |
| `AuthState` | object | `{ user: null, isAuthenticated: false, ... }` | Contient `user`, `isAuthenticated`, `isLoading`, `expiresAt`, `showExpiryWarning`, `loginRejected` |
| `AuthActions` | object | — | Contient `login`, `register`, `logout`, `refreshSession`, `dismissExpiryWarning` |
| `AuthContextType` | `AuthState & AuthActions & { socket: MessageClientAdapter \| null }` | — | Type de contexte complet utilisé par AuthContext |
| `StateUpdater` | `(updater: (prev: AuthState) => AuthState) => void` | — | Callback de type React setState |

## Détails

- Le décalage du timer d'avertissement est piloté par la variable d'environnement `REACT_APP_SESSION_EXPIRY_WARNING_MS`
- À la reconnexion du socket, renvoie automatiquement `authenticate` pour restaurer la session
- La déconnexion utilise `credentials: "include"` pour envoyer le cookie de session avec la requête REST

## Flux

Voir [auth-flows.md](../../flows/auth-flows.md)
