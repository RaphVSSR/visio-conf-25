# Référence de la classe AuthService — VisioConf (Frontend)

**Fichier source** : `FRONTENDV2/src/services/auth/AuthService.ts`
**Classe parente** : `ControllerService` (abstract)
**Types** : `FRONTENDV2/src/services/auth/AuthService.types.ts`

---

## 1. Description

`AuthService` est le service frontend qui gère toute l'authentification via le pattern pub/sub du controleur. Il émet les messages vers le serveur (login, register, authenticate, etc.) et réagit aux réponses (login_success, auth_failure, etc.) en mettant à jour le state React via un callback `setState`.

C'est le miroir frontend du `AuthService` backend — il utilise les mêmes messages mais côté émission/réception inversé.

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `onStateChange` | `StateUpdater` | `private` | Callback `setState` du AuthContext pour mettre à jour le state React |
| `expiryTimer` | `ReturnType<typeof setTimeout> \| null` | `private` | Timer d'avertissement d'expiration de session |
| `nomDInstance` | `string` | `readonly` (hérité) | `"AuthService"` |
| `controleur` | `Controller` | `protected readonly` (hérité) | Référence au controleur |
| `messagesEmitted` | `string[]` | `readonly` (hérité) | Messages que ce service émet vers le serveur |
| `messagesReceived` | `string[]` | `readonly` (hérité) | Messages que ce service écoute du serveur |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description | Exemple |
|-----|------|--------|-------------|---------|
| `MESSAGES_EMITTED` | `string[]` | 6 messages | Messages envoyés au serveur | `["authenticate", "login", ...]` |
| `MESSAGES_RECEIVED` | `string[]` | 13 messages | Messages reçus du serveur | `["auth_success", "auth_failure", ...]` |
| `REACT_APP_SESSION_STORAGE_KEY` | `env` | `process.env.REACT_APP_SESSION_STORAGE_KEY` | Clé sessionStorage pour le sessionId | `"visioconf_session"` |
| `REACT_APP_SESSION_EXPIRY_WARNING_MS` | `env` | `process.env.REACT_APP_SESSION_EXPIRY_WARNING_MS` | Millisecondes avant expiration pour afficher l'avertissement | `"1800000"` (30 min) |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `controleur: Controller, onStateChange: StateUpdater` | `AuthService` | instance | S'inscrit au controleur, restaure la session depuis sessionStorage, configure la reconnexion Socket.io |
| `traitementMessage` | `mesg: ControllerMessage` | `void` | instance | Dispatcher principal. Route les 13 messages reçus vers les mises à jour de state correspondantes |
| `login` | `email: string, password: string` | `void` | instance | Envoie le message `login` avec email, password, et `navigator.userAgent` comme deviceInfo |
| `register` | `data: { password, firstname, lastname, email, phone }` | `void` | instance | Envoie le message `register` |
| `logout` | — | `void` | instance | Envoie `user_disconnect` et supprime le sessionId du sessionStorage |
| `refreshSession` | — | `void` | instance | Envoie `session_refresh` pour prolonger la session active |
| `respondToPendingSession` | `requestId: string, accepted: boolean` | `void` | instance | Envoie `session_pending_choice` avec la décision accept/reject |
| `destroy` | — | `void` | instance (override) | Nettoie le timer d'expiration et se désinscrit du controleur |
| `reconnect` | — | `void` | `private` | Ré-authentifie via sessionStorage après une reconnexion Socket.io |
| `startExpiryTimer` | `expiresAt: number` | `void` | `private` | Configure un double timer : avertissement (WARNING_MS avant) puis expiration (à expiresAt) |
| `clearExpiryTimer` | — | `void` | `private` | Annule le timer d'expiration en cours |

### Fonctions utilitaires (module-level)

| Fonction | Paramètres | Retour | Description |
|----------|------------|--------|-------------|
| `getSessionId` | — | `string \| null` | Lit le sessionId depuis sessionStorage |
| `setSessionId` | `value: string` | `void` | Écrit le sessionId dans sessionStorage |
| `clearSessionId` | — | `void` | Supprime le sessionId du sessionStorage |

---

## 5. Inscription au Controleur

```typescript
new AuthService(controleur, setState)
// → super(controleur, "AuthService", MESSAGES_EMITTED, MESSAGES_RECEIVED)

// Émis (client → serveur)
["authenticate", "login", "register", "user_disconnect", "session_refresh", "session_pending_choice"]

// Reçus (serveur → client)
["auth_success", "auth_failure", "login_success", "login_failure", "login_pending",
 "registration_success", "registration_failure", "user_disconnect_success",
 "session_refreshed", "session_expired",
 "session_pending", "session_pending_accepted", "session_pending_rejected"]
```

---

## 6. Catalogue des messages

**Total : 6 client→serveur + 13 serveur→client = 19 messages**

### Client → Serveur (6 messages émis)

| Message | Payload | Description |
|---------|---------|-------------|
| `authenticate` | `{ sessionId: string }` | Reconnexion via sessionStorage (page refresh, reconnexion socket) |
| `login` | `{ email: string, password: string, deviceInfo: string }` | Connexion avec identifiants. `deviceInfo` = `navigator.userAgent` |
| `register` | `{ password: string, firstname: string, lastname: string, email: string, phone: string }` | Création de compte |
| `user_disconnect` | `{}` | Déconnexion volontaire |
| `session_refresh` | `{}` | Demande de prolongation de session |
| `session_pending_choice` | `{ requestId: string, accepted: boolean }` | Réponse à une demande d'approbation multi-session |

### Serveur → Client (13 messages reçus)

| Message | Payload | Action sur le state |
|---------|---------|---------------------|
| `auth_success` | `{ user: AuthUser, expiresAt: number }` | `isAuthenticated: true`, charge user, lance le timer d'expiration |
| `auth_failure` | `{ reason: string }` | Clear sessionStorage, reset du state (non authentifié) |
| `login_success` | `{ user: AuthUser, expiresAt: number, sessionId: string }` | Stocke sessionId, `isAuthenticated: true`, lance le timer |
| `login_failure` | `{ reason: string }` | Clear sessionStorage, `loginRejected: true` si était en pending |
| `login_pending` | `{ requestId: string }` | `pendingLoginRequestId: requestId`, `isLoading: false` |
| `registration_success` | `{ user: AuthUser, expiresAt: number, sessionId: string }` | Stocke sessionId, `isAuthenticated: true`, lance le timer |
| `registration_failure` | `{ reason: string }` | `isLoading: false` |
| `user_disconnect_success` | `{}` | Clear timer, clear sessionStorage, reset complet du state |
| `session_refreshed` | `{ expiresAt: number }` | Nouveau `expiresAt`, relance le timer, `showExpiryWarning: false` |
| `session_expired` | `{}` | Clear timer, clear sessionStorage, reset complet du state |
| `session_pending` | `{ requestId, deviceInfo, requesterInfo }` | Ajoute à `pendingSessionRequests[]` |
| `session_pending_accepted` | `{ requestId: string }` | Retire de `pendingSessionRequests[]` |
| `session_pending_rejected` | `{ requestId: string }` | Retire de `pendingSessionRequests[]` |

---

## 7. Flux par scénario (côté frontend)

### Flow 1 — Initialisation (montage du AuthProvider)

```
AuthContext.useEffect()
    │
    ├─ new Controleur()
    ├─ SocketIO.init(controleur)
    ├─ authRef = new AuthService(controleur, setState)
    │       │
    │       ├─ super() → inscription au controleur
    │       ├─ sessionStorage.getItem(SESSION_KEY)
    │       │
    │   ┌───┴───┐
    │   Existe  N'existe pas
    │   │       │
    │   │   setState({ isLoading: false })
    │   │
    │   SocketIO.onReady(() => {
    │       socket.io.on("reconnect", reconnect)
    │       sendMessage({ authenticate: { sessionId } })
    │   })
```

### Flow 2 — Login (depuis LoginForm)

```
LoginForm.handleSubmit()
    │
    ├─ authService.login(email, password)
    │   ├─ setState({ isLoading: true, loginRejected: false })
    │   └─ sendMessage({ login: { email, password, deviceInfo } })
    │
    │                                   Serveur
    │                                   ───────
    │   ┌─────────────────────────────── login_success
    │   │                               login_failure
    │   │                               login_pending
    │   │
    ├── login_success → setSessionId(), startExpiryTimer(), setState({ isAuthenticated: true })
    │   → useEffect() dans LoginForm détecte isAuthenticated → navigate("/home")
    │
    ├── login_failure → clearSessionId(), setState({ loginRejected: pendingLoginRequestId !== null })
    │   → LoginForm affiche "Connexion refusée" si loginRejected
    │
    └── login_pending → setState({ pendingLoginRequestId: requestId })
        → LoginForm affiche "En attente d'approbation..."
```

### Flow 3 — Timer d'expiration

```
startExpiryTimer(expiresAt)
    │
    ├─ setTimeout(WARNING_MS avant expiresAt)
    │   └─ setState({ showExpiryWarning: true })
    │       → AuthToasts affiche un toast "Session bientôt expirée"
    │
    │   ┌───────────────────┐
    │   Prolonger           Ignorer
    │   │                   │
    │   refreshSession()    dismissExpiryWarning()
    │   │                   │
    │   session_refresh     setState({ showExpiryWarning: false })
    │   │                   → timer continue jusqu'à expiresAt
    │   session_refreshed
    │   { expiresAt }
    │   │
    │   setState({ expiresAt, showExpiryWarning: false })
    │   startExpiryTimer(newExpiresAt)
    │
    └─ setTimeout(expiresAt - Date.now())
        └─ clearSessionId(), setState({ isAuthenticated: false })
           → redirection vers /login via UserAuth
```

### Flow 4 — Reconnexion Socket.io

```
Socket.io se reconnecte automatiquement
    │
    socket.io.on("reconnect")
    │
    └─ reconnect()
        ├─ getSessionId() depuis sessionStorage
        │
        ┌───┴───┐
        Existe  N'existe pas
        │       │
        │       (rien)
        │
        sendMessage({ authenticate: { sessionId } })
        → Flow auth_success ou auth_failure
```

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
    sessionId: string | null
    pendingLoginRequestId: string | null
    pendingSessionRequests: PendingSessionRequest[]
    showExpiryWarning: boolean
    loginRejected: boolean
}

type AuthActions = {
    login: (email: string, password: string) => void
    register: (data: { password: string, firstname: string, lastname: string, email: string, phone: string }) => void
    logout: () => void
    refreshSession: () => void
    respondToPendingSession: (requestId: string, accepted: boolean) => void
    dismissExpiryWarning: () => void
}

type AuthContextType = AuthState & AuthActions
```

---

## 9. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `ControllerService` | AuthService extends ControllerService | Hérite du pattern pub/sub (inscription, sendMessage, destroy) |
| `SocketIO` | AuthService utilise SocketIO.onReady() et SocketIO.canal | Attend la connexion Socket.io pour envoyer `authenticate` |
| `AuthContext` | AuthContext crée et détruit AuthService | Le provider React gère le lifecycle du service |
| `Controller` | AuthService ← Controller (messages) | Reçoit et émet les messages via le controleur |

---

## 10. Exemples

### Création dans le AuthContext

```typescript
const controleur = new Controleur()
SocketIO.init(controleur)
const authService = new AuthService(controleur, setState)
```

### Login depuis un composant

```typescript
const { login, isLoading } = useAuth()
login("dev@visioconf.com", "d3vV1s10C0nf")
// → AuthService.login() → sendMessage({ login: { email, password, deviceInfo } })
// → serveur répond login_success → setState({ isAuthenticated: true, ... })
```

### Réponse à une demande multi-session

```typescript
const { respondToPendingSession, pendingSessionRequests } = useAuth()
respondToPendingSession(pendingSessionRequests[0].requestId, true)
// → sendMessage({ session_pending_choice: { requestId, accepted: true } })
```
