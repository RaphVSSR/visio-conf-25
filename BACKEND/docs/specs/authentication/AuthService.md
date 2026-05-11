# AuthService — VisioConf

**Fichier source** : `BACKEND/src/models/services/authentication/AuthService.ts`

---

## 1. À quoi ça sert

Service inscrit auprès du `Controleur` qui répond aux 3 messages d'auth émis par le client :

- `login` — vérifier email/mot de passe et ouvrir une session,
- `register` — créer un compte et ouvrir une session,
- `authenticate` — reconnexion silencieuse via le cookie déjà posé.

Il écoute aussi un message **interne** `socket_disconnect` (émis par `CanalSocketIO` quand un socket tombe) pour mettre à jour `is_online`/`disturb_status`.

Pattern de réponse uniforme : à chaque `<action>` côté client correspond un `<action>_response` côté serveur, avec `{ status: "success" | "failure", reason?, ...données }`.

La persistance de la session est déléguée à **`SessionManager`** + cookie store `connect-mongodb-session` (voir `Session.md`).

---

## 2. Propriétés

| Nom | Type | Description |
|-----|------|-------------|
| `controleur` | `Controleur` | Référence au bus pub/sub |
| `nomDInstance` | `string` | `"AuthService"` — clé d'inscription au controleur |
| `msgEmitted` | `string[]` | `["login_response", "authenticate_response", "register_response"]` |
| `msgReceived` | `string[]` | `["login", "authenticate", "register", "socket_disconnect"]` |

---

## 3. Méthodes

| Nom | Paramètres | Retour | Description |
|-----|------------|--------|-------------|
| `register` | — | `void` | S'inscrit au controleur avec `msgEmitted` / `msgReceived` |
| `traitementMessage` | `message : Message` | `void` | Dispatcher : route l'action vers la méthode privée correspondante |
| `send` | `socketIds, messageName, payload` | `void` | `private`. Émet via `controleur.envoie` (id forcé en tableau) |
| `login` | `socketId, { email, password }` | `Promise<void>` | Vérifie user + mot de passe, lie la session, renvoie `login_response` |
| `authenticate` | `socketId` | `Promise<void>` | Reconnexion : lit `userId` depuis le cookie via `SessionManager.getUserId`, recharge le user, relie la session |
| `handleRegister` | `socketId, { firstname, lastname, email, phone, password }` | `Promise<void>` | Crée un user (rôle `user`), hash SHA256, lie la session |
| `socketDisconnect` | `socketId` | `Promise<void>` | Sur déconnexion socket : si plus aucune session active → `is_online = false` ; sinon flip `disturb_status` `"offline"` → `"available"` |
| `bindSession` | `socketId, userId, roles?` | `number` | `static`. Délègue à `SessionManager.bind`, met à jour `is_online`, renvoie l'`expiresAt` |
| `sanitizeUser` | `user` | `object` | `static`. Retire `password` avant envoi |
| `hashPassword` | `password : string` | `string` | `static`. SHA256 |
| `verifyPassword` | `password, hash` | `boolean` | `static`. Comparaison SHA256 |

---

## 4. Catalogue des messages

### Client → Serveur (3)

| Message | Payload | Exemple |
|---------|---------|---------|
| `login` | `{ email : string, password : string }` | `{ login: { email: "user@example.com", password: "<sha256>" } }` |
| `register` | `{ firstname, lastname, email, phone, password }` | `{ register: { firstname: "Jean", lastname: "Dupont", email: "j@x.fr", phone: "06...", password: "<sha256>" } }` |
| `authenticate` | `{}` | `{ authenticate: {} }` (cookie suffisant) |

### Serveur → Client (3)

| Message | Payload (succès) | Payload (échec) |
|---------|------------------|-----------------|
| `login_response` | `{ status: "success", user, expiresAt }` | `{ status: "failure", reason: "user_not_found" \| "wrong_password" }` |
| `register_response` | `{ status: "success", user, expiresAt }` | `{ status: "failure", reason: "email_already_exists" \| <error.message> }` |
| `authenticate_response` | `{ status: "success", user, expiresAt }` | `{ status: "failure", reason: "session_expired" \| "user_not_found" }` |

### Interne (1)

| Message | Payload | Émetteur | Description |
|---------|---------|----------|-------------|
| `socket_disconnect` | `socketId : string` | `CanalSocketIO` | Déclenché à chaque déconnexion socket |

### Dispatch dans `traitementMessage`

| Action | Méthode appelée |
|--------|-----------------|
| `login` | `this.login()` |
| `register` | `this.handleRegister()` |
| `authenticate` | `this.authenticate()` |
| `socket_disconnect` | `this.socketDisconnect()` |

---

## 5. Flux par scénario

### 5.1 Login

```
Client                                          Serveur
------                                          -------
{ login: { email, password } }
    │═══════════════════════════════════>     AuthService.login()
                                                ├─ User.getUser(email)
                                                ├─ verifyPassword()
                                                ├─ bindSession() → SessionManager.bind() + is_online=true
    <══════════════════════════════════
    { login_response: { status: "success", user, expiresAt } }
                                       OU
    { login_response: { status: "failure", reason: "user_not_found" | "wrong_password" } }
```

### 5.2 Register

```
{ register: { ... } }
    │═══════════════════════════════════>     AuthService.handleRegister()
                                                ├─ User.getUser(email) → doit être null
                                                ├─ hashPassword()
                                                ├─ new User().save()
                                                ├─ bindSession()
    <══════════════════════════════════
    { register_response: { status: "success", user, expiresAt } }
                                       OU
    { register_response: { status: "failure", reason } }
```

### 5.3 Authenticate (reconnexion via cookie)

```
{ authenticate: {} }
    │═══════════════════════════════════>     AuthService.authenticate()
                                                ├─ SessionManager.getUserId(socketId)  ← lit le cookie
                                                ├─ User.findById()
                                                ├─ bindSession() (re-bind du nouveau socket)
    <══════════════════════════════════
    { authenticate_response: { status: "success", user, expiresAt } }
                                       OU
    { authenticate_response: { status: "failure", reason: "session_expired" | "user_not_found" } }
```

### 5.4 Déconnexion socket (interne)

```
socket close ── CanalSocketIO ──> { socket_disconnect: socketId }
                                    │
                                    v
                          AuthService.socketDisconnect()
                          ├─ SessionManager.unbind(socketId)
                          ├─ hasActiveSessions(userId) ?
                          │     ├─ non → is_online=false
                          │     └─ oui → disturb_status: offline → available
```

---

## 6. Types

```typescript
type LoginPayload    = { email: string; password: string };
type RegisterPayload = { firstname: string; lastname: string; email: string; phone: string; password: string };
type AuthResponse    =
    | { status: "success"; user: User; expiresAt: number }
    | { status: "failure"; reason: string };
```

---

## 7. Relations

| Classe | Relation |
|--------|----------|
| `Controleur` | inscription pub/sub |
| `User` | `getUser`, `findById`, création + update `is_online` / `disturb_status` |
| `SessionManager` | `bind`, `unbind`, `getUserId`, `hasActiveSessions`, `getSessionDurationMs` |
| `CanalSocketIO` | émet `socket_disconnect` côté serveur |

---

## 8. Référence rapide

| « Je veux… » | Message à envoyer |
|--------------|-------------------|
| Me connecter | `login { email, password }` |
| Créer un compte | `register { firstname, lastname, email, phone, password }` |
| Reprendre ma session après refresh | `authenticate {}` |
