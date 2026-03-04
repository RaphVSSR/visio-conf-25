# Référence de la classe SocketIO — VisioConf

**Fichier source** : `BACKEND/src/models/services/SocketIO.ts`
**Classe parente** : Aucune (classe statique autonome)

---

## 1. Description

`SocketIO` initialise le serveur Socket.io et expose son instance pour être utilisée par le `CanalSocketio`. Le serveur est attaché au serveur HTTP existant.

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `server` | `Server` (socket.io) | `static` | Instance du serveur Socket.io |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description | Exemple |
|-----|------|--------|-------------|---------|
| CORS origin | `string` | `"*"` | Toutes les origines autorisées | `"*"` |
| CORS methods | `string[]` | `["GET", "POST"]` | Méthodes HTTP autorisées | `["GET", "POST"]` |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `init` | — | `void` | static | Crée le serveur Socket.io attaché à `HTTPServer.server` avec la config CORS |

---

## 5. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `HTTPServer` | SocketIO.init() utilise HTTPServer.server | Le serveur Socket.io s'attache au serveur HTTP |
| `CanalSocketio` | CanalSocketio reçoit SocketIO.server | Le canal Socket.io utilise l'instance pour gérer les connexions |

---

## 6. Types TypeScript

```typescript
class SocketIO {
    static server: Server;
    static init(): void;
}
```

---

## 7. Exemples

### Initialisation (index.ts)

```typescript
SocketIO.init();
// SocketIO.server est maintenant disponible pour CanalSocketio
new CanalSocketio(SocketIO.server, controleur, "canalsocketio");
```
