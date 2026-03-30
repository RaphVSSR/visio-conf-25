# Referentiel de la classe AuthSync — VisioConf (Frontend)

**Fichier source** : `FRONTENDV2/src/services/auth/AuthSync.ts`
**Types** : `FRONTENDV2/src/services/auth/AuthSync.types.ts`

---

## 1. Description

`AuthSync` gere toute l'authentification frontend via `MessageClientAdapter` (Socket.io). Elle s'abonne a 3 messages du serveur (`login_response`, `authenticate_response`, `register_response`) et dispatche les mises a jour de state React via un callback `setState`.

Les sessions sont gerees cote serveur par `connect-mongodb-session` (cookie-based). Le logout et le refresh de session passent par des routes REST (`/auth/logout`, `/auth/refresh`).

---

## 2. Proprietes de la classe

| Propriete | Type | Visibilite | Description |
|-----------|------|------------|-------------|
| `socket` | `MessageClientAdapter` | `private` | Wrapper Socket.io pour l'envoi/reception des messages |
| `onStateChange` | `StateUpdater` | `private` | Callback `setState` du AuthContext |
| `expiryTimer` | `ReturnType<typeof setTimeout> \| null` | `private` | Timer d'avertissement d'expiration de session |

---

## 3. Variables et constantes

| Nom | Type | Description | Exemple |
|-----|------|-------------|---------|
| `BACKEND_URL` | `string` | URL du backend pour les requetes REST | `"http://localhost:3220"` |
| `REACT_APP_SESSION_EXPIRY_WARNING_MS` | `env` | Millisecondes avant expiration pour afficher l'avertissement | `"1800000"` (30 min) |

---

## 4. Methodes

| Methode | Parametres | Retour | Description |
|---------|------------|--------|-------------|
| `constructor` | `socket: MessageClientAdapter, onStateChange: StateUpdater` | `AuthSync` | S'abonne aux 3 messages response, envoie `authenticate` des que le socket est pret |
| `login` | `email: string, password: string` | `void` | Envoie `login` avec email, password, et `navigator.userAgent` comme deviceInfo |
| `register` | `data: { password, firstname, lastname, email, phone }` | `void` | Envoie `register` |
| `logout` | — | `Promise<void>` | POST `/auth/logout` (REST), clear timer, reset state |
| `refreshSession` | — | `Promise<void>` | POST `/auth/refresh` (REST), relance timer si `refreshed` |
| `destroy` | — | `void` | Nettoie le timer d'expiration et se desabonne des 3 messages |
| `startExpiryTimer` | `expiresAt: number` | `void` | `private` — Double timer : avertissement puis expiration |
| `clearExpiryTimer` | — | `void` | `private` — Annule le timer en cours |

---

## 5. Inscription aux messages

```typescript
new AuthSync(socket, setState)

// Abonnements (serveur -> client) — 3 messages
socket.on("login_response", handleLoginResponse)         // status: success | failure
socket.on("authenticate_response", handleAuthenticateResponse) // status: success | failure
socket.on("register_response", handleRegisterResponse)   // status: success | failure

// Envois (client -> serveur) — 3 messages Socket.io
socket.send("login", { email, password, deviceInfo })
socket.send("register", { password, firstname, lastname, email, phone })
socket.send("authenticate", {})

// Requetes REST (client -> serveur) — 2 endpoints
fetch("POST /auth/logout", { credentials: "include" })
fetch("POST /auth/refresh", { credentials: "include" })
```

---

## 6. Catalogue des messages

**Total : 3 client->serveur (Socket.io) + 2 client->serveur (REST) + 3 serveur->client = 8 messages**

### Client -> Serveur (Socket.io)

| Message | Payload | Description |
|---------|---------|-------------|
| `login` | `{ email: string, password: string, deviceInfo: string }` | Connexion avec identifiants |
| `register` | `{ password, firstname, lastname, email, phone }` | Creation de compte |
| `authenticate` | `{}` | Re-authentification via cookie (page refresh, reconnexion socket) |

### Client -> Serveur (REST)

| Endpoint | Methode | Description |
|----------|---------|-------------|
| `/auth/logout` | `POST` | Deconnexion volontaire, destroy session + clear cookie |
| `/auth/refresh` | `POST` | Prolongation de session, renvoie `{ status, expiresAt }` |

### Serveur -> Client

| Message | Status | Payload | Action sur le state |
|---------|--------|---------|---------------------|
| `login_response` | `success` | `{ user, expiresAt }` | `isAuthenticated: true`, lance le timer |
| `login_response` | `failure` | `{ reason }` | `loginRejected: true` |
| `authenticate_response` | `success` | `{ user, expiresAt }` | `isAuthenticated: true`, lance le timer |
| `authenticate_response` | `failure` | `{ reason }` | Reset du state (non authentifie) |
| `register_response` | `success` | `{ user, expiresAt }` | `isAuthenticated: true`, lance le timer |
| `register_response` | `failure` | `{ reason }` | `isLoading: false` |

---

## 7. Flux par scenario

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

type AuthState = {
    user: AuthUser | null
    isAuthenticated: boolean
    isLoading: boolean
    expiresAt: number | null
    showExpiryWarning: boolean
    loginRejected: boolean
}

type AuthActions = {
    login: (email: string, password: string) => void
    register: (data: { password, firstname, lastname, email, phone }) => void
    logout: () => void
    refreshSession: () => void
    dismissExpiryWarning: () => void
}

type AuthContextType = AuthState & AuthActions & { socket: MessageClientAdapter | null }
```

---

## 9. Relations

| Classe | Relation | Description |
|--------|----------|-------------|
| `MessageClientAdapter` | AuthSync utilise socket.on/off/send | Communication Socket.io |
| `AuthContext` | AuthContext cree et detruit AuthSync | Le provider React gere le lifecycle |
