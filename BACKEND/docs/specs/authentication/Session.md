# Référence du Modèle Session — VisioConf

**Fichier source** : `BACKEND/src/models/services/authentication/Session.ts`
**Classe parente** : Aucune (classe statique autonome, n'étend pas Collection)
**Collection MongoDB** : `Session`

---

## 1. Schema complet

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB (sert de sessionId) | `ObjectId('s1...')` |
| `userId` | `ObjectId` | oui | — | `User` | Utilisateur propriétaire de la session | `ObjectId('u1...')` |
| `socketId` | `String` | non | — | — | ID du socket actuellement lié à cette session | `"xK9_2mZqR..."` |
| `deviceInfo` | `String` | oui | — | — | Information sur l'appareil (ex: "web") | `"web"` |
| `createdAt` | `Date` | oui | `Date.now` | — | Date de création de la session | `2026-03-01T10:00:00Z` |
| `expiresAt` | `Date` | oui | — | — | Date d'expiration de la session. Index TTL: auto-suppression à l'expiration | `2026-03-02T10:00:00Z` |

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<SessionType>` | `private static` | Schéma Mongoose de la collection |
| `model` | `Model<SessionType>` | `static` | Modèle Mongoose (singleton via `mongoose.models`) |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description | Exemple |
|-----|------|--------|-------------|---------|
| `SESSION_DURATION` | `env` | `process.env.SESSION_DURATION \|\| "24h"` | Durée d'une session. Format: `{number}{s\|m\|h\|d}` | `"24h"`, `"30m"`, `"7d"` |
| `models` | `object` | `mongoose.models` | Cache des modèles Mongoose enregistrés | — |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `getSession` | `sessionId: string` | `Promise<SessionType \| null>` | static | Trouve une session par son _id |
| `getSessionBySocket` | `socketId: string` | `Promise<SessionType \| null>` | static | Trouve une session par son socketId |
| `getSessions` | `userId: string` | `Promise<SessionType[]>` | static | Trouve toutes les sessions actives (non expirées) d'un utilisateur |
| `createSession` | `userId: string, socketId: string, deviceInfo: string, expiresAt: Date` | `Promise<SessionType>` | static | Crée une nouvelle session |
| `deleteSession` | `sessionId: string` | `Promise<void>` | static | Supprime une session par son _id |
| `clearSocket` | `socketId: string` | `Promise<void>` | static | Dissocie un socket de sa session (unset socketId) |
| `bindSocket` | `sessionId: string, socketId: string` | `Promise<void>` | static | Associe un socket à une session |
| `refreshSession` | `sessionId: string, newExpiresAt: Date` | `Promise<SessionType \| null>` | static | Prolonge une session en mettant à jour expiresAt |
| `getUserSocketIds` | `userId: string` | `Promise<string[]>` | static | Retourne tous les socketId actifs d'un utilisateur |
| `flushAll` | — | `Promise<void>` | static | **[DEV]** Supprime toutes les sessions |
| `getSessionDurationMs` | — | `number` | static | Retourne la durée de session en millisecondes (parse `SESSION_DURATION`) |
| `parseExpiryToMs` | `expiry: string` | `number` | `private static` | Convertit un format `{number}{s\|m\|h\|d}` en millisecondes. Défaut: 24h |

---

## 5. Catalogue des messages associés

La Session n'a pas de messages propres. Elle est utilisée indirectement par `AuthService` pour les messages d'authentification (voir `BACKEND/docs/specs/authentication/AuthService.md`).

---

## 6. Types TypeScript

```typescript
type SessionType = {
    _id?: Types.ObjectId,
    userId: Types.ObjectId,
    socketId?: string,
    deviceInfo: string,
    createdAt: Date,
    expiresAt: Date,
}
```

---

## 7. Relations avec autres modèles

| Modèle | Relation | Description |
|--------|----------|-------------|
| `User` | Session.userId → User | Chaque session appartient à un utilisateur |
| `AuthService` | AuthService utilise Session | Le service d'auth crée, lit, rafraîchit et supprime des sessions |
| `Database` | Database.flushDb() → Session.flushAll() | Le flush DB inclut les sessions |

---

## 8. Index et contraintes

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |
| `expiresAt` | `expiresAt` | TTL (`expireAfterSeconds: 0`) | Auto-suppression quand `expiresAt` est dépassé |
| `socketId` | `socketId` | simple | Optimise `getSessionBySocket()` |
| `userId` | `userId` | simple | Optimise `getSessions()` et `getUserSocketIds()` |

Principe : une session existe = elle est active. Supprimée = terminée. Pas de champ `isActive` ni `token`.

---

## 9. Exemples

### Créer et manipuler une session

```typescript
const expiresAt = new Date(Date.now() + Session.getSessionDurationMs());
const session = await Session.createSession(userId, socketId, "web", expiresAt);
// → { _id: ObjectId("s1..."), userId: ObjectId("u1..."), socketId: "xK9...", deviceInfo: "web", expiresAt: ... }

await Session.bindSocket(session._id.toString(), "newSocketId");
await Session.refreshSession(session._id.toString(), new Date(Date.now() + Session.getSessionDurationMs()));
await Session.deleteSession(session._id.toString());
```

### Durée de session (parseExpiryToMs)

```typescript
Session.getSessionDurationMs(); // SESSION_DURATION="24h" → 86400000
Session.getSessionDurationMs(); // SESSION_DURATION="30m" → 1800000
Session.getSessionDurationMs(); // SESSION_DURATION="7d"  → 604800000
```
