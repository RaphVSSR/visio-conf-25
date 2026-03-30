# Référence de la classe SessionManager — VisioConf

**Fichier source** : `BACKEND/src/models/services/authentication/SessionManager.ts`
**Classe** : Statique (pas d'instanciation)
**Dépendances** : `socket.io` (Server), `express-session` (via socket.request.session)

---

## 1. Description

`SessionManager` gère le mapping socket ↔ utilisateur via **Socket.io rooms** et **express-session**. Pas de collection MongoDB dédiée — les sessions sont stockées dans le store `connect-mongodb-session` (collection `sessions`), et le mapping socket-user est géré via `socket.request.session.userId` + Socket.io rooms.

---

## 2. Propriétés

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `io` | `Server` (socket.io) | `private static` | Référence au serveur Socket.io |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description | Exemple |
|-----|------|--------|-------------|---------|
| `SESSION_DURATION` | `env` | `process.env.SESSION_DURATION \|\| "24h"` | Durée d'une session. Format: `{number}{s\|m\|h\|d}` | `"24h"`, `"30m"`, `"7d"` |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `bindToServer` | `io: Server` | `void` | Stocke la référence au serveur Socket.io |
| `bind` | `socketId: string, userId: string` | `void` | Écrit `userId` dans `socket.request.session`, `session.save()`, `socket.join(userId)` |
| `unbind` | `socketId: string` | `void` | Lit `session.userId`, `socket.leave(userId)`, supprime `session.userId`, `session.save()` |
| `getUserId` | `socketId: string` | `string \| null` | Lit `socket.request.session.userId` |
| `getUserSocketIds` | `userId: string` | `string[]` | Lit le room Socket.io nommé `userId`, retourne les socketIds |
| `hasActiveSessions` | `userId: string` | `boolean` | Vérifie si le room existe et `size > 0` |
| `refreshSession` | `socketId: string` | `void` | Met à jour `session.cookie.maxAge` avec la durée configurée, `session.save()` |
| `getSessionDurationMs` | — | `number` | Parse `SESSION_DURATION` et retourne en millisecondes |
| `parseExpiryToMs` | `expiry: string` | `number` | `private static` — Convertit `{number}{s\|m\|h\|d}` en ms. Défaut: 24h |

---

## 5. Architecture de session

```
express-session (cookie)
    ↕ connect-mongodb-session (store MongoDB, collection "sessions")
socket.request.session
    ├─ .userId    → écrit par bind(), lu par getUserId(), supprimé par unbind()
    ├─ .cookie    → .maxAge mis à jour par refreshSession()
    └─ .save()    → persiste dans le store MongoDB

Socket.io rooms
    ├─ socket.join(userId)    → bind()
    ├─ socket.leave(userId)   → unbind()
    └─ io.sockets.adapter.rooms.get(userId)  → getUserSocketIds(), hasActiveSessions()
```

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `AuthService` | Utilise SessionManager | bind, unbind, getUserId, getUserSocketIds, hasActiveSessions, refreshSession |
| `ChannelService` | Utilise SessionManager | getUserId (resolveUserId), getUserSocketIds (broadcast) |
| `TeamService` | Utilise SessionManager | getUserId (resolveUserId) |
| `UserService` | Utilise SessionManager | getUserId (resolveUserId) |
| `AccessRoleGuard` | Utilise SessionManager | getUserId (resolveUser) |
| `RestService` | Configure express-session | sessionMiddleware partagé avec Socket.io handshake |

---

## 7. Exemples

```typescript
SessionManager.bindToServer(io)

SessionManager.bind("socketId123", "userId456")
// → socket.request.session.userId = "userId456"
// → socket.join("userId456")

SessionManager.getUserId("socketId123")           // → "userId456"
SessionManager.getUserSocketIds("userId456")       // → ["socketId123", "socketIdABC"]
SessionManager.hasActiveSessions("userId456")      // → true

SessionManager.refreshSession("socketId123")       // → session.cookie.maxAge = 86400000
SessionManager.getSessionDurationMs()              // → 86400000 (24h)

SessionManager.unbind("socketId123")
// → socket.leave("userId456")
// → delete session.userId
```
