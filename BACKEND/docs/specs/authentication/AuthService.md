# Référence de la classe AuthService — VisioConf

**Fichier source** : `BACKEND/src/models/services/authentication/AuthService.ts`
**Classe parente** : Aucune (autonome)

---

## 1. Description

`AuthService` est le service gérant toute l'authentification via le pattern pub/sub du controleur. Il gère le login, l'inscription, l'authentification, les opérations de session (déconnexion, rafraîchissement, approbation multi-session) et la déconnexion socket. Contrairement à la version précédente, il n'étend plus `ControllerService` — il possède ses propres références `controleur`, `nomDInstance`, Map `handlers` et Map `pendingRequests`. La gestion des sessions est déléguée à `SessionManager` (en mémoire). Les sessions basées sur les cookies via `connect-mongodb-session` remplacent l'approche précédente par sessionStorage.

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `controleur` | `any` | `public` | Référence au controleur pour l'envoi/réception de messages |
| `nomDInstance` | `string` | `public` | `"AuthService"` — nom d'inscription dans le controleur |
| `handlers` | `Map<string, MessageHandler>` | `private` | Map des noms de messages vers leurs fonctions de traitement |
| `pendingRequests` | `Map<string, PendingSessionRequest>` | `private` | Map des demandes d'approbation multi-session en attente, indexées par requestId |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description | Exemple |
|-----|------|--------|-------------|---------|
| `SESSION_APPROVAL_TIMEOUT_SECONDS` | `env` | `process.env.SESSION_APPROVAL_TIMEOUT_SECONDS \|\| "60"` | Délai d'expiration pour l'approbation multi-session (secondes) | `"60"`, `"120"` |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `register` | — | `void` | instance | Enregistre tous les handlers via `registerHandler()` et appelle `controleur.inscription()` avec les listes de messages entrants/sortants |
| `traitementMessage` | `msg: any` | `void` | instance | Dispatcher principal. Extrait la clé d'action du message, recherche le handler dans la Map, l'exécute |
| `registerHandler` | `messageName: string, handler: MessageHandler` | `void` | `private` | Enregistre une fonction de traitement dans la Map `handlers` |
| `send` | `socketIds: string \| string[], messageName: string, payload: unknown` | `void` | `private` | Encapsule `controleur.envoie()`, normalise socketIds en tableau |
| `login` | `socketId: string, payload: { email, password, deviceInfo }` | `Promise<void>` | `private` | Authentification par identifiants. Déclenche le flux multi-session si des sessions actives existent |
| `authenticate` | `socketId: string` | `Promise<void>` | `private` | Reconnexion basée sur les cookies. Pas de payload — userId résolu depuis `SessionManager.getUserId(socketId)`. Renvoie les demandes en attente en cas de succès |
| `handleRegister` | `socketId: string, payload: { password, firstname, lastname, email, phone }` | `Promise<void>` | `private` | Crée un compte, hache le mot de passe, lie la session |
| `handleSession` | `socketId: string, payload: { type, ... }` | `void` | `private` | Dispatcher pour les sous-commandes de session. Route par `payload.type` vers les sous-handlers |
| `userDisconnect` | `socketId: string` | `Promise<void>` | `private` | Déconnexion volontaire. Délie la session via `SessionManager.unbind()` |
| `sessionRefresh` | `socketId: string` | `Promise<void>` | `private` | Rafraîchit l'expiration de la session via `SessionManager.refreshSession()` |
| `sessionPendingChoice` | `socketId: string, payload: { requestId, accepted }` | `void` | `private` | Route la décision d'acceptation/rejet pour l'approbation multi-session |
| `socketDisconnect` | `socketId: string` | `void` | `private` | Gère la déconnexion socket (depuis CanalSocketio). Délie la session |
| `createManualSessionValidation` | `socketId: string, user: any, deviceInfo: string` | `void` | `private` | Crée une demande d'approbation en attente avec délai d'expiration |
| `succeedManualSessionValidation` | `requestId: string` | `Promise<void>` | `private` | Accepte une demande en attente. Lie la session et notifie |
| `rejectManualSessionValidation` | `requestId: string, reason: string` | `Promise<void>` | `private` | Rejette une demande en attente. Notifie le demandeur |
| `resendPendingRequests` | `userId: string, socketId: string` | `void` | `private` | Renvoie toutes les demandes d'approbation en attente d'un utilisateur vers un socket nouvellement authentifié |
| `bindSession` | `socketId: string, userId: string` | `number` (expiresAt) | `private static` | Appelle `SessionManager.bind()`, retourne le timestamp `expiresAt` |
| `sanitizeUser` | `user: Record<string, any>` | `object` | `private static` | Supprime le champ `password` de l'objet utilisateur |
| `parseDeviceInfo` | `ua: string` | `string` | `private static` | Parse la chaîne user-agent en format lisible (ex. "Chrome sur Windows") |
| `hashPassword` | `password: string` | `string` | `private static` | Hash SHA256 du mot de passe |
| `verifyPassword` | `password: string, hash: string` | `boolean` | `private static` | Compare le hash SHA256 du mot de passe avec le hash stocké |

---

## 5. Inscription au Controleur

```typescript
const authService = new AuthService(controleur, "AuthService")
authService.register()
```

Dans `register()`, l'enregistrement des handlers et l'inscription au controleur se produisent :

```typescript
register() {
    this.registerHandler("login", this.login)
    this.registerHandler("authenticate", this.authenticate)
    this.registerHandler("register", this.handleRegister)
    this.registerHandler("session", this.handleSession)
    this.registerHandler("socket_disconnect", this.socketDisconnect)

    const outgoing = [...getMessagesByDomain("auth").received, ...getMessagesByDomain("socket").received]
    this.controleur.inscription(this, outgoing, [...this.handlers.keys()])
}
```

Sortants (le serveur peut émettre) : `login_response`, `register_response`, `authenticate_response`, `session_response`, `socket_disconnect`
Entrants (le serveur écoute) : `login`, `authenticate`, `register`, `session`, `socket_disconnect`

---

## 6. Catalogue des messages

**Total : 4 client-vers-serveur + 4 serveur-vers-client + 1 interne = 9 noms de messages**

### Client vers Serveur (4 messages + 1 interne)

| Message | Payload | Description | Exemple |
|---------|---------|-------------|---------|
| `login` | `{ email: string, password: string, deviceInfo: string }` | Connexion avec identifiants | `{ login: { email: "dev@visioconf.com", password: "a1b2c3...", deviceInfo: "Mozilla/5.0..." }, id: "xK9mP2..." }` |
| `register` | `{ password: string, firstname: string, lastname: string, email: string, phone: string }` | Création de compte | `{ register: { password: "mdp", firstname: "Jean", lastname: "Dupont", email: "jean@example.com", phone: "0612345678" }, id: "xK9mP2..." }` |
| `authenticate` | — (pas de payload, cookie envoyé automatiquement) | Reconnexion via session basée sur cookie | `{ authenticate: {}, id: "xK9mP2..." }` |
| `session` | `{ type: "disconnect" \| "refresh" \| "pending_choice", ... }` | Dispatcher d'opérations de session | `{ session: { type: "refresh" }, id: "xK9mP2..." }` |
| `socket_disconnect` | `string` (socketId) | Interne — déclenché par CanalSocketio lors de la déconnexion socket | `{ socket_disconnect: "xK9mP2...", id: "canalsocketio" }` |

#### Sous-types de `session`

| type | Champs additionnels | Description | Exemple |
|------|---------------------|-------------|---------|
| `"disconnect"` | — | Déconnexion volontaire | `{ session: { type: "disconnect" }, id: "xK9..." }` |
| `"refresh"` | — | Prolonger l'expiration de la session | `{ session: { type: "refresh" }, id: "xK9..." }` |
| `"pending_choice"` | `requestId: string, accepted: boolean` | Décision d'approbation multi-session | `{ session: { type: "pending_choice", requestId: "f47ac...", accepted: true }, id: "xK9..." }` |

### Serveur vers Client (4 messages de réponse)

| Message | Valeurs de statut | Payload par statut | Exemple |
|---------|-------------------|-------------------|---------|
| `login_response` | `"success"` | `{ status, user: User, expiresAt: number }` | `{ login_response: { status: "success", user: {...}, expiresAt: 170... }, id: ["xK9..."] }` |
| | `"failure"` | `{ status, reason: "user_not_found" \| "wrong_password" \| "rejected" \| "timeout" }` | `{ login_response: { status: "failure", reason: "wrong_password" }, id: ["xK9..."] }` |
| | `"pending"` | `{ status, requestId: string }` | `{ login_response: { status: "pending", requestId: "f47ac..." }, id: ["xK9..."] }` |
| `register_response` | `"success"` | `{ status, user: User, expiresAt: number }` | `{ register_response: { status: "success", user: {...}, expiresAt: 170... }, id: ["xK9..."] }` |
| | `"failure"` | `{ status, reason: "email_already_exists" \| string }` | `{ register_response: { status: "failure", reason: "email_already_exists" }, id: ["xK9..."] }` |
| `authenticate_response` | `"success"` | `{ status, user: User, expiresAt: number }` | `{ authenticate_response: { status: "success", user: {...}, expiresAt: 170... }, id: ["xK9..."] }` |
| | `"failure"` | `{ status, reason: "session_expired" \| "user_not_found" }` | `{ authenticate_response: { status: "failure", reason: "session_expired" }, id: ["xK9..."] }` |
| `session_response` | `"disconnected"` | `{ status }` | `{ session_response: { status: "disconnected" }, id: ["xK9..."] }` |
| | `"refreshed"` | `{ status, expiresAt: number }` | `{ session_response: { status: "refreshed", expiresAt: 170... }, id: ["xK9..."] }` |
| | `"expired"` | `{ status }` | `{ session_response: { status: "expired" }, id: ["xK9..."] }` |
| | `"failure"` | `{ status, reason: "not_authenticated" }` | `{ session_response: { status: "failure", reason: "not_authenticated" }, id: ["xK9..."] }` |
| | `"pending_request"` | `{ status, requestId: string, requesterInfo: string, deviceInfo: string }` | `{ session_response: { status: "pending_request", requestId: "f47ac...", requesterInfo: "Jean Dupont", deviceInfo: "Chrome sur Windows" }, id: ["aB3n..."] }` |
| | `"pending_accepted"` | `{ status, requestId: string }` | `{ session_response: { status: "pending_accepted", requestId: "f47ac..." }, id: ["aB3n..."] }` |
| | `"pending_rejected"` | `{ status, requestId: string }` | `{ session_response: { status: "pending_rejected", requestId: "f47ac..." }, id: ["aB3n..."] }` |

### Dispatch (traitementMessage)

| Clé du message | Méthode handler | Payload |
|----------------|-----------------|---------|
| `login` | `this.login` | `{ email, password, deviceInfo }` |
| `authenticate` | `this.authenticate` | — (pas de payload) |
| `register` | `this.handleRegister` | `{ firstname, lastname, email, password, phone }` |
| `session` | `this.handleSession` → dispatche par `type` | `{ type: "disconnect" \| "refresh" \| "pending_choice", ... }` |
| `socket_disconnect` | `this.socketDisconnect` | `string` (socketId) |

### Table d'assignation

| Message | Émetteur | Récepteur |
|---------|----------|-----------|
| `login` | AuthContext (LoginForm) | AuthService |
| `register` | AuthContext (SignupForm) | AuthService |
| `authenticate` | AuthContext | AuthService |
| `session { type: "disconnect" }` | AuthContext | AuthService |
| `session { type: "refresh" }` | AuthContext | AuthService |
| `session { type: "pending_choice" }` | AuthContext | AuthService |
| `login_response` | AuthService | AuthContext |
| `register_response` | AuthService | AuthContext |
| `authenticate_response` | AuthService | AuthContext |
| `session_response` | AuthService | AuthContext |

---

## 7. Flux de scénarios

> Voir [auth-flows.md](../../flows/auth-flows.md)

---

## 8. Types TypeScript

```typescript
type MessageHandler = (socketId: string, payload: any) => void

type PendingSessionRequest = {
    socketId: string
    userId: string
    user: any
    deviceInfo: string
    timeout: NodeJS.Timeout
}

class AuthService {
    controleur: any
    nomDInstance: string
    private handlers: Map<string, MessageHandler>
    private pendingRequests: Map<string, PendingSessionRequest>
    register(): void
    traitementMessage(msg: any): void
}

interface User {
    _id: string
    firstname: string
    lastname: string
    email: string
    phone: string
    status: string
    job: string
    desc: string
    picture: string
    is_online: boolean
    disturb_status: string
    roles: string[]
}

interface LoginPayload {
    email: string
    password: string
    deviceInfo: string
}

interface RegisterPayload {
    password: string
    firstname: string
    lastname: string
    email: string
    phone: string
}

interface SessionPayload {
    type: "disconnect" | "refresh" | "pending_choice"
    requestId?: string
    accepted?: boolean
}

interface LoginResponse {
    status: "success" | "failure" | "pending"
    user?: User
    expiresAt?: number
    reason?: "user_not_found" | "wrong_password" | "rejected" | "timeout"
    requestId?: string
}

interface RegisterResponse {
    status: "success" | "failure"
    user?: User
    expiresAt?: number
    reason?: "email_already_exists" | string
}

interface AuthenticateResponse {
    status: "success" | "failure"
    user?: User
    expiresAt?: number
    reason?: "session_expired" | "user_not_found"
}

interface SessionResponse {
    status: "disconnected" | "refreshed" | "expired" | "failure"
          | "pending_request" | "pending_accepted" | "pending_rejected"
    expiresAt?: number
    reason?: "not_authenticated"
    requestId?: string
    requesterInfo?: string
    deviceInfo?: string
}
```

---

## 9. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `SessionManager` | AuthService -> SessionManager.bind/unbind/getUserId/etc. | Gestion des sessions en mémoire (remplace le modèle MongoDB Session) |
| `User` | AuthService -> User.getUser(), User constructor | Recherche et création d'utilisateurs |
| `Controller` (controleur) | AuthService <-> Controller (messages) | Reçoit et émet des messages via le pub/sub du controleur |
| `ListeMessages` | AuthService -> getMessagesByDomain() | Récupère les listes de messages entrants/sortants pour l'inscription |

---

## 10. Exemples

### Inscription au controleur

```typescript
const authService = new AuthService(controleur, "AuthService")
authService.register()
```

### Flux complet de connexion (messages)

```typescript
// 1. Le client envoie via CanalSocketio :
{ id: "xK9...", login: { email: "dev@visioconf.com", password: sha256("d3vV1s10C0nf"), deviceInfo: "Mozilla/5.0..." } }

// 2. AuthService.traitementMessage() recherche "login" dans la Map handlers -> appelle this.login()
// 3. Réponse (pas de sessions actives) :
{ id: ["xK9..."], login_response: { status: "success", user: { firstname: "Admin", ... }, expiresAt: 1709312400000 } }

// 3bis. Réponse (sessions actives — flux multi-session) :
{ id: ["xK9..."], login_response: { status: "pending", requestId: "f47ac10b-..." } }
```

### Sous-commande de session (déconnexion)

```typescript
// Le client envoie :
{ id: "xK9...", session: { type: "disconnect" } }

// Le serveur répond :
{ id: ["xK9..."], session_response: { status: "disconnected" } }
```
