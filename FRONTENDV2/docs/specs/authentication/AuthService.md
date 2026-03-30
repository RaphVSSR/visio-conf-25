# Référence de la classe AuthSync — VisioConf (Frontend)

**Fichier source** : `FRONTENDV2/src/services/auth/AuthSync.ts`
**Types** : `FRONTENDV2/src/services/auth/AuthSync.types.ts`

---

## 1. Description

`AuthSync` gère toute l'authentification frontend via `MessageClientAdapter` (Socket.io). Elle s'abonne à 4 messages groupés du serveur (`login_response`, `authenticate_response`, `register_response`, `session_response`) et dispatche les mises à jour de state React via un callback `setState`.

Les sessions sont gérées côté serveur par `connect-mongodb-session` (cookie-based) — aucun sessionStorage n'est utilisé.

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `socket` | `MessageClientAdapter` | `private` | Wrapper Socket.io pour l'envoi/réception des messages |
| `onStateChange` | `StateUpdater` | `private` | Callback `setState` du AuthContext |
| `expiryTimer` | `ReturnType<typeof setTimeout> \| null` | `private` | Timer d'avertissement d'expiration de session |

---

## 3. Variables et constantes

| Nom | Type | Description | Exemple |
|-----|------|-------------|---------|
| `REACT_APP_SESSION_EXPIRY_WARNING_MS` | `env` | Millisecondes avant expiration pour afficher l'avertissement | `"1800000"` (30 min) |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `constructor` | `socket: MessageClientAdapter, onStateChange: StateUpdater` | `AuthSync` | S'abonne aux 4 messages response, envoie `authenticate` dès que le socket est prêt |
| `login` | `email: string, password: string` | `void` | Envoie `login` avec email, password, et `navigator.userAgent` comme deviceInfo |
| `register` | `data: { password, firstname, lastname, email, phone }` | `void` | Envoie `register` |
| `logout` | — | `void` | Envoie `session { type: "disconnect" }` |
| `refreshSession` | — | `void` | Envoie `session { type: "refresh" }` |
| `respondToPendingSession` | `requestId: string, accepted: boolean` | `void` | Envoie `session { type: "pending_choice", requestId, accepted }` |
| `destroy` | — | `void` | Nettoie le timer d'expiration et se désabonne des 4 messages |
| `startExpiryTimer` | `expiresAt: number` | `void` | `private` — Double timer : avertissement puis expiration |
| `clearExpiryTimer` | — | `void` | `private` — Annule le timer en cours |

---

## 5. Inscription aux messages

```typescript
new AuthSync(socket, setState)

// Abonnements (serveur → client) — 4 messages groupés
socket.on("login_response", handleLoginResponse)         // status: success | failure | pending
socket.on("authenticate_response", handleAuthenticateResponse) // status: success | failure
socket.on("register_response", handleRegisterResponse)   // status: success | failure
socket.on("session_response", handleSessionResponse)     // status: refreshed | expired | disconnected | pending_request | pending_accepted | pending_rejected

// Envois (client → serveur) — 4 messages
socket.send("login", { email, password, deviceInfo })
socket.send("register", { password, firstname, lastname, email, phone })
socket.send("authenticate", {})
socket.send("session", { type: "disconnect" | "refresh" | "pending_choice", ... })
```

---

## 6. Catalogue des messages

**Total : 4 client→serveur + 4 serveur→client = 8 messages**

### Client → Serveur

| Message | Payload | Description |
|---------|---------|-------------|
| `login` | `{ email: string, password: string, deviceInfo: string }` | Connexion avec identifiants |
| `register` | `{ password, firstname, lastname, email, phone }` | Création de compte |
| `authenticate` | `{}` | Ré-authentification via cookie (page refresh, reconnexion socket) |
| `session` | `{ type: "disconnect" }` | Déconnexion volontaire |
| `session` | `{ type: "refresh" }` | Prolongation de session |
| `session` | `{ type: "pending_choice", requestId: string, accepted: boolean }` | Réponse à une demande d'approbation multi-session |

### Serveur → Client

| Message | Status | Payload | Action sur le state |
|---------|--------|---------|---------------------|
| `login_response` | `success` | `{ user, expiresAt }` | `isAuthenticated: true`, lance le timer |
| `login_response` | `failure` | `{ reason }` | `loginRejected: true` si était en pending |
| `login_response` | `pending` | `{ requestId }` | `pendingLoginRequestId: requestId` |
| `authenticate_response` | `success` | `{ user, expiresAt }` | `isAuthenticated: true`, lance le timer |
| `authenticate_response` | `failure` | `{ reason }` | Reset du state (non authentifié) |
| `register_response` | `success` | `{ user, expiresAt }` | `isAuthenticated: true`, lance le timer |
| `register_response` | `failure` | `{ reason }` | `isLoading: false` |
| `session_response` | `disconnected` | `{}` | Clear timer, reset complet du state |
| `session_response` | `refreshed` | `{ expiresAt }` | Nouveau `expiresAt`, relance le timer |
| `session_response` | `expired` | `{}` | Clear timer, reset complet du state |
| `session_response` | `pending_request` | `{ requestId, deviceInfo, requesterInfo }` | Ajoute à `pendingSessionRequests[]` |
| `session_response` | `pending_accepted` | `{ requestId }` | Retire de `pendingSessionRequests[]` |
| `session_response` | `pending_rejected` | `{ requestId }` | Retire de `pendingSessionRequests[]` |

---

## 7. Flux par scénario

> Voir [auth-flows.md](../../flows/auth-flows.md)

---

## 8. Types TypeScript

```typescript
type StateUpdater = (updater: (prev: AuthState) => AuthState) => void

type AuthUser = {
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

type PendingSessionRequest = {
    requestId: string
    deviceInfo: string
    requesterInfo: string
}

type AuthState = {
    user: AuthUser | null
    isAuthenticated: boolean
    isLoading: boolean
    expiresAt: number | null
    pendingLoginRequestId: string | null
    pendingSessionRequests: PendingSessionRequest[]
    showExpiryWarning: boolean
    loginRejected: boolean
}

type AuthActions = {
    login: (email: string, password: string) => void
    register: (data: { password, firstname, lastname, email, phone }) => void
    logout: () => void
    refreshSession: () => void
    respondToPendingSession: (requestId: string, accepted: boolean) => void
    dismissExpiryWarning: () => void
}

type AuthContextType = AuthState & AuthActions & { socket: MessageClientAdapter | null }
```

---

## 9. Relations

| Classe | Relation | Description |
|--------|----------|-------------|
| `MessageClientAdapter` | AuthSync utilise socket.on/off/send | Communication Socket.io |
| `AuthContext` | AuthContext crée et détruit AuthSync | Le provider React gère le lifecycle |
