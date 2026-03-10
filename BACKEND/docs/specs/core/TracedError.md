# Référence de la classe TracedError — VisioConf

**Fichier source** : `BACKEND/src/models/Core/TracedError.ts`
**Classe parente** : `Error` (native)

---

## 1. Description

`TracedError` est la classe d'erreur personnalisée du projet. Elle étend `Error` pour fournir des messages d'erreur typés et tracés, avec un identifiant d'erreur et un mécanisme de stack trace amélioré.

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `id` | `ErrorsType[keyof ErrorsType]["id"]` | `public` | Identifiant unique du type d'erreur |
| `reason` | `string` | `public` (optionnel) | Message d'erreur complémentaire passé par la fonction en erreur |

---

## 3. Variables et constantes

### ErrorsType — Catalogue des erreurs

| Clé | ID | Message | Exemple d'usage |
|-----|----|---------|-----------------|
| `dbConnect` | `"dbConnect"` | Error during the MongoDB connection process | `throw new TracedError("dbConnect", err.message)` |
| `dbClose` | `"dbClose"` | Error during the MongoDB closing process | `throw new TracedError("dbClose")` |
| `dbFlushing` | `"dbFlushing"` | Error during the MongoDB flush | `throw new TracedError("dbFlushing", "Session flush failed")` |
| `uploadsIntegrity` | `"uploadsIntegrity"` | Uploads's environnement integrity compromised | `throw new TracedError("uploadsIntegrity")` |
| `collectionIntegrity` | `"collectionIntegrity"` | Collection's environnement integrity compromised | `throw new TracedError("collectionIntegrity")` |
| `collectionSaving` | `"collectionSaving"` | Collection saving didn't succeed | `throw new TracedError("collectionSaving", err.message)` |
| `testFilesCopying` | `"testFilesCopying"` | Error during the copying of a test file | `throw new TracedError("testFilesCopying", err.message)` |
| `getFileSize` | `"getFileSize"` | Error during getting the file size | `throw new TracedError("getFileSize", err.message)` |
| `restCorsDef` | `"restCorsDef"` | Error during the REST CORS definition | `throw new TracedError("restCorsDef", err.message)` |
| `restRoutesDef` | `"restRoutesDef"` | Error during the REST routes definition | `throw new TracedError("restRoutesDef", err.message)` |
| `injectingCollection` | `"injectingCollection"` | Error during a collection injection | `throw new TracedError("injectingCollection", "Permission inject failed")` |
| `roleNotFound` | `"roleNotFound"` | Error a role didn't exists | `throw new TracedError("roleNotFound", "admin")` |
| `adminCredentialsNotReferenced` | `"adminCredentialsNotReferenced"` | Error admins credentials aren't referenced in a .env file | `throw new TracedError("adminCredentialsNotReferenced")` |
| `noTeamsFound` | `"noTeamsFound"` | Error teams collection is empty | `throw new TracedError("noTeamsFound")` |
| `noChannelsFound` | `"noChannelsFound"` | Error channels collection is empty | `throw new TracedError("noChannelsFound")` |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `type: keyof ErrorsType, reason?: string` | `TracedError` | instance | Crée une erreur typée avec message prédéfini. Corrige le prototype et améliore la stack trace via `Error.captureStackTrace` |
| `errorHandler` | `err: any` | `void` | static | Gestionnaire d'erreurs centralisé. Affiche le message et la raison pour les `TracedError`, ou un `console.trace` pour les erreurs inconnues |

---

## 5. Types TypeScript

```typescript
const ErrorsType = { ... } as const;
type ErrorsType = typeof ErrorsType;

class TracedError extends Error {
    id: ErrorsType[keyof ErrorsType]["id"];
    reason?: string;

    constructor(type: keyof ErrorsType, reason?: string);
    static errorHandler(err: any): void;
}
```

---

## 6. Utilisée par

Toutes les classes du projet utilisent `TracedError` pour la gestion d'erreurs :
- Toutes les sous-classes de `Collection` (dans `save()`)
- `Database` (connect, flush, inject)
- `FileSystem` (copyTestFiles, getFileSize)
- `RestService` (CORS, routes)
- `Channel.injectTest()`, `Team.injectTest()`

---

## 7. Exemples

### Lancer une erreur typée

```typescript
throw new TracedError("collectionSaving", "Duplicate key error on email field");
// → TracedError { id: "collectionSaving", message: "Collection saving didn't succeed", reason: "Duplicate key error on email field" }
```

### Attraper avec errorHandler

```typescript
try {
    await mongoose.connect(MONGO_URI);
} catch (err) {
    TracedError.errorHandler(new TracedError("dbConnect", err.message));
    // Console: "Error during the MongoDB connection process"
    //          "Reason: connection refused"
}
```
