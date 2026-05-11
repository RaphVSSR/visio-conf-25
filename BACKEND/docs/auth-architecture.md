# Architecture d'Authentification — VisioConf

## Vue d'ensemble

L'auth s'appuie sur **deux canaux qui partagent le même cookie** :

- **Socket.io + Controleur** (pub/sub) → `login`, `register`, `authenticate`,
- **REST Express** → `POST /auth/refresh`, `POST /auth/logout`.

Le pivot, c'est la session cookie `visioconf_session`, persistée par `connect-mongodb-session` dans la collection Mongo `sessions`. Le même middleware est monté sur Express **et** sur l'engine Socket.io, donc une requête HTTP et un handshake WebSocket lisent **la même** session.

```
Frontend                                          Backend
========                                          =======

LoginForm / SignupForm ─┐                    ┌── AuthService (sockets)
                        │                    ├── AuthRoutes  (HTTP)
                        v                    │   POST /refresh
                  AuthContext ────────┐      │   POST /logout
                  (socket + fetch)    │      │
                        │             │      v
                        │       cookie visioconf_session
                        │       (connect-mongodb-session)
                        │             ^
                        +═════════════┘
                        Socket.io  +  HTTP Express
```

---

## Modèle de confiance

```
1. Le navigateur ouvre une socket  →  cookie envoyé
2. AuthService.login (ou register) vérifie credentials
3. SessionManager.bind(socketId, userId)
       ├─ socket.data.userId      ← mémoire
       ├─ socket.request.session.userId ← cookie persisté en Mongo
       └─ socket.join(userId)     ← room Socket.io
4. À partir de là :
   - chaque message lit userId via SessionManager.getUserId(socketId)
   - le cookie suffit aussi côté HTTP (req.session.userId)
5. À la déconnexion socket :
   - SessionManager.unbind(socketId)
   - is_online repasse à false uniquement si plus aucun socket actif
```

Un message n'est jamais re-vérifié ligne par ligne : la connexion + le cookie **sont** l'ancrage.

---

## Cycle de vie d'une session

```
        login / register                  reconnexion              logout
        ────────────────                  ────────────             ──────
            │                                  │                     │
            v                                  v                     v
    SessionManager.bind         socket reconnect → cookie     POST /auth/logout
            │                          │                            │
            v                          v                            v
    socket.join(userId)        AuthService.authenticate     session.destroy()
    cookie.userId = userId            │                     clearCookie
            │                          v                            │
            v                  SessionManager.bind                 v
        SOCKET ACTIF                   │                     SOCKET DÉLIÉ
            │                          v                     COOKIE EFFACÉ
            v                     SOCKET ACTIF
       déconnexion socket               │
            │                           v
            v                      reconnexion
   SessionManager.unbind           (boucle)
   (cookie reste tant que
    le navigateur ne le supprime
    pas et que maxAge n'est pas
    écoulé)
```

Pas d'état "WARNING" / modale d'expiration : la durée vient de `cookie.maxAge` (`SESSION_DURATION`, défaut 24h). Pour prolonger une session, le client appelle `POST /auth/refresh`.

---

## Flux par scénario

### Login

```
Client                              Serveur
{ login: { email, password } }
    │═════════════════════════════>  AuthService.login()
                                     ├─ User.getUser(email)
                                     ├─ verifyPassword (sha256)
                                     └─ SessionManager.bind(socketId, userId)
    <═════════════════════════════
    { login_response: { status: "success", user, expiresAt } }
                              OU
    { login_response: { status: "failure", reason: "user_not_found" | "wrong_password" } }
```

### Register

Même flux que login, mais avec création préalable du `User` (rôle `user`, mdp SHA256). Échec si `email_already_exists`.

### Reconnexion silencieuse

```
Page rechargée → cookie toujours là
{ authenticate: {} }
    │═════════════════════════════>  AuthService.authenticate()
                                     ├─ SessionManager.getUserId(socketId)  ← cookie
                                     ├─ User.findById()
                                     └─ SessionManager.bind() (re-tag du nouveau socket)
    <═════════════════════════════
    { authenticate_response: { status: "success", user, expiresAt } }
                                  OU
    { authenticate_response: { status: "failure", reason: "session_expired" | "user_not_found" } }
```

### Refresh (HTTP)

```
POST /auth/refresh        (cookie envoyé automatiquement)
    │═════════════════════════════>  AuthRoutes
                                     ├─ vérifie req.session.userId
                                     ├─ session.cookie.maxAge = SESSION_DURATION
                                     ├─ session.save()
                                     └─ SessionManager.refreshSession(...) pour chaque socket
    <═════════════════════════════
    { status: "refreshed", expiresAt }
                              OU
    { status: "failure", reason: "not_authenticated" | "session_save_error" }
```

### Logout (HTTP)

```
POST /auth/logout
    │═════════════════════════════>  AuthRoutes
                                     ├─ SessionManager.unbind() pour chaque socket du user
                                     ├─ req.session.destroy()
                                     └─ res.clearCookie("visioconf_session")
    <═════════════════════════════
    { status: "disconnected" }
```

### Déconnexion socket (interne)

```
socket.disconnect → CanalSocketIO émet  { socket_disconnect: socketId }
    │
    v
AuthService.socketDisconnect()
├─ SessionManager.unbind(socketId)
├─ hasActiveSessions(userId) ?
│     ├─ non → User.is_online = false
│     └─ oui → si disturb_status="offline" → "available"
```

La session cookie reste valide → reconnexion possible sans re-login.

---

## Mémoire vs persistance

| Donnée | Où | Durée |
|--------|----|-------|
| `userId` rapide pour un socket | `socket.data.userId` (RAM) | Vie du socket |
| `userId` durable | `req.session.userId` → Mongo `sessions` | `cookie.maxAge` (24h par défaut) |
| Set des sockets admin | `SessionManager.adminSocketIds` (RAM) | Vie du process |
| Mapping user → sockets | rooms Socket.io (room = userId) | Vie des sockets |
| Hash du mot de passe | `User.password` (Mongo) | Permanent |

---

## Variables d'environnement

| Variable | Défaut | Rôle |
|----------|--------|------|
| `SESSION_DURATION` | `"24h"` | Durée du cookie/session, format `{n}{s\|m\|h\|d}` |
| `SESSION_SECRET` | `"visioconf-session-secret"` | Secret HMAC du cookie |
| `MONGO_URI` | `mongodb://localhost:27017/visioconf` | URI utilisée par le store de session |
| `NODE_ENV` | — | `"prod"` active `cookie.secure` (HTTPS only) |

---

## Modèle de sécurité

1. **Mots de passe** hachés en SHA256 (`js-sha256`) — choix de dev, à migrer vers bcrypt/argon2 avant prod.
2. **Cookie** `httpOnly` + `sameSite=lax` + `secure` en prod → pas d'accès JS, atténuation CSRF, HTTPS only.
3. **Pas de re-vérif par message** : socket connecté + cookie valide = appelant identifié.
4. **Expiration** : `cookie.maxAge` côté client, et le store Mongo nettoie ses entrées à expiration.
5. **Multi-onglet** : tous les onglets partagent le cookie → tous se trouvent dans la même room `userId`. Pas d'approbation multi-session.

---

## Fichiers clés

### Backend

| Fichier | Rôle |
|---------|------|
| `src/Controller/controleur.js` | Bus pub/sub (intouchable) |
| `src/Controller/canalsocketio.js` | Pont Socket.io ↔ controleur (intouchable) |
| `src/models/services/authentication/AuthService.ts` | Handlers `login` / `register` / `authenticate` / `socket_disconnect` |
| `src/models/services/authentication/SessionManager.ts` | Bind socket↔userId, rooms, admins, durée |
| `src/models/services/RestService.ts` | Configure `connect-mongodb-session`, monte le middleware sur Express + Socket.io |
| `src/routes/AuthRoutes.ts` | `POST /auth/refresh`, `POST /auth/logout` |
| `src/models/ListeMessages.ts` | Catalogue auth : `login`/`register`/`authenticate` (+ `_response`) |
| `src/index.ts` | Boot : DB, RestService, Socket.io, `SessionManager.bindToServer`, services |

### Frontend

| Fichier | Rôle |
|---------|------|
| `src/contexts/AuthContext.tsx` | Provider + bridge socket, expose le state auth |
| `src/services/MessageClientAdapter.ts` | Wrapper Socket.io côté client |
| `src/components/LoginForm/`, `SignupForm/` | Formulaires |

---

## À retenir

- **Une seule source de vérité côté navigateur : le cookie.** Pas de `sessionStorage`, pas de JWT.
- **Trois messages d'auth** (`login` / `register` / `authenticate`), chacun avec son `_response`.
- **Refresh et logout passent par REST** parce qu'ils manipulent directement la session cookie.
- **`SessionManager` ne stocke rien côté DB lui-même** — il se contente de wrapper Socket.io et la session cookie d'Express.
