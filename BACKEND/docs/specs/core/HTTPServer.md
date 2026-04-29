# Référence de la classe HTTPServer — VisioConf

**Fichier source** : `BACKEND/src/models/Core/HTTPServer.ts`
**Classe parente** : Aucune (classe statique autonome)

---

## 1. Description

`HTTPServer` encapsule le serveur HTTP Node.js. Il crée un `http.Server` basé sur l'application Express fournie par `RestService`, puis le démarre sur le port configuré.

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `server` | `http.Server` | `static` | Instance du serveur HTTP Node.js |
| `port` | `number` | `private static` | Port d'écoute. Défaut: `3220` (via `process.env.PORT`) |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description | Exemple |
|-----|------|--------|-------------|---------|
| `PORT` | `env` | `process.env.PORT \|\| 3220` | Port d'écoute du serveur | `3220` |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `init` | — | `Promise<void>` | static | Crée le serveur HTTP avec `createServer()` en passant l'application Express de `RestService.implement()` |
| `start` | — | `void` | static | Démarre le serveur sur `this.port` avec un log de confirmation |

---

## 5. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `RestService` | HTTPServer.init() → RestService.implement() | Le serveur HTTP utilise l'application Express comme handler |
| `SocketIO` | SocketIO.init() utilise HTTPServer.server | Le serveur Socket.io s'attache au serveur HTTP |

---

## 6. Types TypeScript

```typescript
class HTTPServer {
    static server: Server;
    private static port: number;
    static async init(): Promise<void>;
    static start(): void;
}
```

---

## 7. Exemples

### Séquence de démarrage (index.ts)

```typescript
await HTTPServer.init();   // Crée le serveur HTTP avec l'app Express
HTTPServer.start();        // Écoute sur le port 3220
// → "Server is running on port 3220"
```
