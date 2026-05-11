# SessionManager — VisioConf

**Fichier source** : `BACKEND/src/models/services/authentication/SessionManager.ts`

---

## 1. À quoi ça sert

Une session VisioConf, ce n'est pas un document Mongo qu'on lit/écrit à la main : c'est un **cookie signé** géré par `connect-mongodb-session`, partagé entre Express et Socket.io. `SessionManager` est le pont fin entre un `socket.io` connecté et cette session cookie. Il :

- pose `userId` sur le socket (en mémoire) et sur la session cookie (persistée),
- fait rejoindre au socket une **room nommée d'après l'userId** → tous les onglets/appareils d'un même user partagent la même room,
- maintient un `Set` des sockets admin pour des `isAdmin()` en O(1),
- expose la durée de session (lue depuis `SESSION_DURATION`).

Pas de modèle Mongoose, pas de TTL custom : la durée vient du `cookie.maxAge`.

---

## 2. Propriétés

| Nom | Type | Visibilité | Description |
|-----|------|------------|-------------|
| `socketServer` | `Server` (socket.io) | `private static` | Référence injectée une fois au boot via `bindToServer()` |
| `adminSocketIds` | `Set<string>` | `private static` | Sockets dont l'utilisateur a le rôle `admin` |

---

## 3. Variables d'environnement

| Nom | Défaut | Description |
|-----|--------|-------------|
| `SESSION_DURATION` | `"24h"` | Durée du cookie/session — format `{nombre}{s\|m\|h\|d}` |
| `SESSION_SECRET` | `"visioconf-session-secret"` | Secret HMAC du cookie (côté `RestService`) |
| `MONGO_URI` | `mongodb://localhost:27017/visioconf` | URI utilisée par le cookie store |

---

## 4. Méthodes

| Nom | Paramètres | Retour | Description |
|-----|------------|--------|-------------|
| `bindToServer` | `socketServer : Server` | `void` | Pose la référence Socket.io. Appelé depuis `index.ts` |
| `bind` | `socketId : string, userId : string, roles? : string[]` | `void` | Tag socket + cookie, rejoint la room `userId`, gère `adminSocketIds` |
| `unbind` | `socketId : string` | `void` | Quitte la room, retire des admins. **Ne supprime pas** la session cookie |
| `getUserId` | `socketId : string` | `string \| null` | Lit `socket.data.userId`, fallback sur `socket.request.session.userId` |
| `getUserSocketIds` | `userId : string` | `string[]` | Liste les sockets dans la room `userId` (= tous les onglets de ce user) |
| `isAdmin` | `socketId : string` | `boolean` | Présence dans `adminSocketIds` |
| `refreshUserRoles` | `userId : string, roles : string[]` | `void` | Resync `adminSocketIds` après changement de rôle |
| `refreshSession` | `socketId : string` | `void` | Reset `cookie.maxAge` et sauve la session |
| `hasActiveSessions` | `userId : string` | `boolean` | `true` ssi au moins un socket dans la room — pilote le flip `is_online` |
| `getSessionDurationMs` | — | `number` | Parse `SESSION_DURATION` → ms (défaut 24h) |
| `parseExpiryToMs` | `expiry : string` | `number` | `private`. `30m` → `1_800_000` |

---

## 5. Messages

`SessionManager` **ne s'inscrit pas au controleur** et n'émet/reçoit aucun message du bus pub/sub. C'est un utilitaire statique appelé par d'autres composants. Les messages liés à la session sont documentés là où ils sont effectivement traités :

| Composant | Lien | Messages concernés |
|-----------|------|-------------------|
| `AuthService` | `authentication/AuthService.md` | `login` / `register` / `authenticate` (+ `_response`), `socket_disconnect` (interne) |
| `AuthRoutes` | (HTTP, pas un message bus) | `POST /auth/refresh`, `POST /auth/logout` |

---

## 6. Cookie store (configuré dans `RestService`)

| Réglage | Valeur | Pourquoi |
|---------|--------|----------|
| `name` | `"visioconf_session"` | Nom du cookie |
| `store` | `MongoDBStore({ collection: "sessions" })` | Persistance des sessions, survit aux restarts |
| `cookie.maxAge` | `SessionManager.getSessionDurationMs()` | Durée alignée sur `SESSION_DURATION` |
| `cookie.httpOnly` | `true` | Inaccessible au JS (anti-XSS) |
| `cookie.sameSite` | `"lax"` | Anti-CSRF |
| `cookie.secure` | `NODE_ENV === "prod"` | HTTPS only en prod |

Middleware monté **deux fois** : `server.use(...)` (HTTP) et `socketServer.engine.use(...)` (handshake WS) → routes Express et sockets partagent le même cookie.

---

## 7. Idée clé : la room = l'userId

Socket.io permet de "joindre" un socket à une room par son nom. On choisit `userId` comme nom → un message envoyé à `io.to(userId)` atteint **tous les onglets/appareils** de ce user, sans avoir à maintenir un mapping `userId → socketIds[]`. C'est `getUserSocketIds()` qui lit cette room.

---

## 8. Relations

| Classe | Relation |
|--------|----------|
| `RestService` | configure le cookie store, monte le middleware sur Express + Socket.io engine |
| `AuthService` | appelle `bind` / `unbind` / `getUserId` / `hasActiveSessions` |
| `index.ts` | appelle `bindToServer(io)` au boot |

---

## 9. Exemples

```typescript
SessionManager.bindToServer(io);

SessionManager.bind(socketId, user._id.toString(), user.roles);

const userId = SessionManager.getUserId(socketId);

if (!SessionManager.hasActiveSessions(userId)) {
    await User.model.updateOne({ _id: userId }, { is_online: false });
}
```
