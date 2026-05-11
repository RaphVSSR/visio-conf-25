# AuthSync — VisioConf (Frontend)

**Fichier source** : `FRONTENDV2/src/services/auth/AuthSync.ts`
**Types** : `FRONTENDV2/src/services/auth/AuthSync.types.ts`
**Pendant backend** : `BACKEND/docs/specs/authentication/AuthService.md`

---

## 1. À quoi ça sert

`AuthSync` est le pendant frontend d'`AuthService`. Instancié une fois dans `AuthContext`, il :

- envoie les 3 messages d'auth (`login`, `register`, `authenticate`) via `MessageClientAdapter`,
- écoute les 3 réponses (`*_response`) et met à jour le `AuthState` React,
- déclenche `authenticate {}` automatiquement à l'init et à chaque reconnexion socket (le cookie suffit, donc payload vide),
- gère le timer local d'expiration (modale d'avertissement + auto-logout),
- appelle les routes HTTP `/auth/refresh` et `/auth/logout` (qui touchent au cookie, pas au bus).

`AuthContext` ne fait que créer le socket + l'instance `AuthSync`, exposer le state, et router les actions vers ses méthodes.

---

## 2. Propriétés

| Nom | Type | Visibilité | Description |
|-----|------|------------|-------------|
| `socket` | `MessageClientAdapter` | `private` | Adapter Socket.io côté client |
| `onStateChange` | `(updater) => void` | `private` | Setter React (`setState`) injecté par `AuthContext` |
| `warningTimer` | `Timeout \| null` | `private` | Timer qui déclenche `showExpiryWarning = true` |
| `logoutTimer` | `Timeout \| null` | `private` | Timer qui déclenche le logout local à `expiresAt` |
| `refreshing` | `boolean` | `private` | Garde anti-double-click sur `refreshSession()` |

---

## 3. Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `REACT_APP_BACKEND_API_URL` | `http://localhost:3220` | URL du backend (Socket.io + HTTP) |
| `REACT_APP_BACKEND_API_PREFIX` | `""` | Préfixe optionnel pour les routes HTTP |
| `REACT_APP_SESSION_EXPIRY_WARNING_MS` | `60000` | Délai avant `expiresAt` pour afficher la modale (60s par défaut) |

---

## 4. Méthodes

| Nom | Paramètres | Retour | Description |
|-----|------------|--------|-------------|
| `constructor` | `socket, onStateChange` | — | Branche les 3 handlers `*_response` ; envoie `authenticate {}` à l'init et à chaque reconnect |
| `login` | `email : string, password : string` | `void` | `isLoading=true`, `loginRejected=false`, envoie `login` |
| `register` | `{ password, firstname, lastname, email, phone }` | `void` | `isLoading=true`, envoie `register` |
| `logout` | — | `Promise<void>` | `POST /auth/logout` (credentials: include), reset state, clear timers |
| `refreshSession` | — | `Promise<void>` | `POST /auth/refresh` ; sur `"refreshed"` → relance le timer ; sinon → `expireSession()` |
| `destroy` | — | `void` | Détache les handlers + clear timers (appelé par cleanup `useEffect`) |
| `handleLoginResponse` | `data : { status, user?, expiresAt?, … }` | `void` | `private`. Sur `success` → state authentifié + timer ; sur `failure` → `loginRejected=true` |
| `handleAuthenticateResponse` | `data : { status, user?, expiresAt? }` | `void` | `private`. Sur `success` → state authentifié + timer ; sur `failure` → state purgé |
| `handleRegisterResponse` | `data : { status, user?, expiresAt? }` | `void` | `private`. Sur `success` → state authentifié + timer ; sur `failure` → `isLoading=false` |
| `startExpiryTimer` | `expiresAt : number` | `void` | `private`. Pose `warningTimer` (à `expiresAt - WARNING_MS`) et `logoutTimer` (à `expiresAt`) |
| `clearExpiryTimer` | — | `void` | `private`. Annule les deux timers |
| `expireSession` | — | `void` | `private`. Clear timers + reset state vers non-authentifié |

---

## 5. Catalogue des messages

### Client → Serveur (Socket.io, 3)

| Message | Payload | Émis par | Description |
|---------|---------|----------|-------------|
| `login` | `{ email : string, password : string }` | `login()` | Connexion par identifiants |
| `register` | `{ firstname, lastname, email, phone, password }` | `register()` | Création de compte |
| `authenticate` | `{}` | constructor (init + reconnect) | Reconnexion silencieuse via cookie |

### Serveur → Client (Socket.io, 3)

| Message | Payload (succès) | Payload (échec) | Handler |
|---------|------------------|-----------------|---------|
| `login_response` | `{ status: "success", user, expiresAt }` | `{ status: "failure", reason }` | `handleLoginResponse` |
| `register_response` | `{ status: "success", user, expiresAt }` | `{ status: "failure", reason }` | `handleRegisterResponse` |
| `authenticate_response` | `{ status: "success", user, expiresAt }` | `{ status: "failure", reason }` | `handleAuthenticateResponse` |

### HTTP (hors bus)

| Route | Méthode | Réponse OK | Réponse KO | Appelée par |
|-------|---------|------------|------------|-------------|
| `/auth/refresh` | `POST` | `{ status: "refreshed", expiresAt }` | `{ status: "failure", reason }` | `refreshSession()` |
| `/auth/logout` | `POST` | `{ status: "disconnected" }` | `{ status: "failure", reason }` | `logout()` |

`credentials: "include"` obligatoire pour transporter le cookie `visioconf_session`.

### Table d'assignation

| Message | Émetteur | Récepteur |
|---------|----------|-----------|
| `login` | `AuthSync` | `AuthService` (back) |
| `register` | `AuthSync` | `AuthService` (back) |
| `authenticate` | `AuthSync` | `AuthService` (back) |
| `login_response` | `AuthService` | `AuthSync` |
| `register_response` | `AuthService` | `AuthSync` |
| `authenticate_response` | `AuthService` | `AuthSync` |

---

## 6. Cycle de vie & flux

### 6.1 Init (mount du `AuthProvider`)

```
AuthProvider mount
   │
   ├─ new MessageClientAdapter()
   ├─ new AuthSync(socket, setState)
   │     │
   │     ├─ socket.on("login_response", ...)
   │     ├─ socket.on("register_response", ...)
   │     ├─ socket.on("authenticate_response", ...)
   │     └─ socket.onReady(() => {
   │            socket.onReconnect(() => socket.send("authenticate", {}))
   │            socket.send("authenticate", {})
   │        })
   │
   v
isLoading: true
   │
   v
authenticate_response reçu
   ├─ success → state authentifié + startExpiryTimer
   └─ failure → state non-authentifié (le user verra la page de login)
```

### 6.2 Login

```
LoginForm ─ login(email, password) ─> AuthSync.login()
                                         ├─ setState(isLoading=true, loginRejected=false)
                                         └─ socket.send("login", { email, password })

                                       ... bus → backend ...

                                       login_response ←
                                         ├─ success → state authentifié + timer
                                         └─ failure → loginRejected=true
```

### 6.3 Register

Identique à login mais avec `register` / `register_response`.

### 6.4 Reconnexion socket

Sur `socket.onReconnect`, `AuthSync` renvoie `authenticate {}`. Le cookie est toujours là côté navigateur → le serveur peut re-bind sans demander le mot de passe.

### 6.5 Refresh (HTTP)

```
SessionExpiryModal [Prolonger] ─> AuthSync.refreshSession()
   │
   ├─ refreshing guard (anti double-click)
   ├─ setState(isRefreshing=true)
   ├─ POST /auth/refresh (credentials: include)
   │
   └─ data.status === "refreshed" ?
          ├─ oui → startExpiryTimer(data.expiresAt) + state mis à jour
          └─ non → expireSession()
```

### 6.6 Logout (HTTP)

```
button [Logout] ─> AuthSync.logout()
   │
   ├─ POST /auth/logout (credentials: include)
   ├─ clearExpiryTimer()
   └─ setState(user=null, isAuthenticated=false, …)
```

### 6.7 Timer d'expiration

```
startExpiryTimer(expiresAt)
   │
   ├─ warningTimer  → setState(showExpiryWarning=true)   à (expiresAt - WARNING_MS)
   └─ logoutTimer   → expireSession()                    à expiresAt
                              │
                              └─ state purgé → user redirigé vers login
```

`expireSession()` n'appelle **pas** `/auth/logout`. Le serveur découvrira la fin de session via expiration cookie au prochain handshake.

---

## 7. État (`AuthState`)

| Champ | Type | Description |
|-------|------|-------------|
| `user` | `AuthUser \| null` | User courant (sans password) |
| `isAuthenticated` | `boolean` | `true` après login/register/authenticate réussi |
| `isLoading` | `boolean` | `true` pendant un round-trip auth |
| `isRefreshing` | `boolean` | `true` pendant `POST /auth/refresh` |
| `expiresAt` | `number \| null` | Timestamp ms d'expiration cookie/session |
| `showExpiryWarning` | `boolean` | Pilote l'affichage de la `SessionExpiryModal` |
| `loginRejected` | `boolean` | `true` après un `login_response` failure (réinitialisé au login suivant) |

`AuthContextType` = `AuthState & AuthActions & { socket }`. Les composants consomment via `useAuth()`.

---

## 8. Relations

| Composant | Relation |
|-----------|----------|
| `AuthContext` (`AuthProvider`) | Crée et détruit `AuthSync`, expose le state |
| `MessageClientAdapter` | Transport Socket.io (`on` / `off` / `send` / `onReady` / `onReconnect`) |
| `AuthService` (back) | Pair pub/sub : reçoit les 3 messages, renvoie les 3 `*_response` |
| `AuthRoutes` (back) | Endpoints HTTP `/auth/refresh` et `/auth/logout` |
| `SessionExpiryModal` | Lit `showExpiryWarning`, déclenche `refreshSession` ou `dismissExpiryWarning` |
| `LoginForm` / `SignupForm` | Appellent `login()` / `register()` |
| `AuthToasts` | Lit `loginRejected` pour afficher un toast d'échec |

---

## 9. À retenir

- **3 messages auth** uniquement (`login` / `register` / `authenticate`), chacun avec son `_response`. Pas de `session_*`, pas de multi-session.
- **`authenticate {}`** est envoyé automatiquement à l'init et à chaque reconnect — le cookie porte tout.
- **Refresh et logout passent par HTTP** parce qu'ils manipulent le cookie côté Express.
- **Le timer local n'est qu'un confort UX** : la vérité reste le cookie, le serveur ré-évalue à chaque message.
