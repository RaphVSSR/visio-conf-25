# Référence de la classe SocketIO — VisioConf (Frontend)

**Fichier source** : `FRONTENDV2/src/services/SocketIO.ts`
**Classe parente** : Aucune (classe statique singleton)

---

## 1. Description

`SocketIO` est le singleton qui gère le lifecycle de la connexion Socket.io côté client. Il crée l'instance `CanalSocketio`, poll sa readiness, et expose un système de callbacks `onReady` pour que les services puissent attendre la connexion avant d'envoyer des messages.

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `instance` | `CanalSocketio \| null` | `private static` | Instance du CanalSocketio (pont Socket.io ↔ controleur) |
| `readyCallbacks` | `ReadyCallback[]` | `private static` | File d'attente de callbacks à appeler quand Socket.io est prêt |
| `readyPoll` | `ReturnType<typeof setInterval> \| null` | `private static` | Intervalle de poll pour détecter la readiness (50ms) |
| `isReady` | `boolean` | `private static` | Flag de readiness |

---

## 3. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `init` | `controleur: Controller` | `void` | static | Crée le CanalSocketio et démarre le poll de readiness (50ms). Idempotent (no-op si déjà initialisé) |
| `onReady` | `callback: () => void` | `void` | static | Exécute le callback immédiatement si prêt, sinon l'ajoute à la file d'attente |
| `canal` | — | `CanalSocketio` | static (getter) | Retourne l'instance CanalSocketio. Throw si non initialisé |
| `disconnect` | — | `void` | static | Déconnecte le socket, nettoie l'intervalle, vide les callbacks, reset le flag |

---

## 4. Détection de readiness

```
SocketIO.init(controleur)
    │
    ├─ new CanalSocketio(controleur, "canalsocketio")
    │
    └─ setInterval(50ms) {
           if (instance.listeDesMessagesEmis) {
               clearInterval()
               isReady = true
               readyCallbacks.forEach(cb => cb())
               readyCallbacks = []
           }
       }
```

**Pourquoi un poll :** Le `CanalSocketio` (off-limits, JS) initialise sa connexion Socket.io de manière asynchrone. Il n'expose pas de callback ou Promise — la seule façon de détecter que la connexion est établie est de vérifier l'existence de `listeDesMessagesEmis` (propriété peuplée après la connexion).

---

## 5. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `CanalSocketio` | SocketIO crée une instance de CanalSocketio | Le pont JS entre controleur et Socket.io (OFF-LIMITS) |
| `Controller` | SocketIO.init() reçoit le controleur | Passé au constructeur de CanalSocketio |
| `AuthContext` | AuthContext appelle SocketIO.init() et SocketIO.disconnect() | Le provider gère le lifecycle |
| `AuthService` | AuthService utilise SocketIO.onReady() et SocketIO.canal | Attend la readiness pour envoyer `authenticate` |

---

## 6. Types TypeScript

```typescript
type ReadyCallback = () => void

class SocketIO {
    private static instance: CanalSocketio | null
    private static readyCallbacks: ReadyCallback[]
    private static readyPoll: ReturnType<typeof setInterval> | null
    private static isReady: boolean

    static init(controleur: Controller): void
    static onReady(callback: ReadyCallback): void
    static get canal(): CanalSocketio
    static disconnect(): void
}
```

---

## 7. Exemples

### Initialisation (AuthContext)

```typescript
const controleur = new Controleur()
SocketIO.init(controleur)
// SocketIO poll 50ms jusqu'à ce que CanalSocketio soit prêt
```

### Attendre la readiness (AuthService)

```typescript
SocketIO.onReady(() => {
    SocketIO.canal.socket.io.on("reconnect", () => this.reconnect())
    this.sendMessage({ authenticate: { sessionId } })
})
```

### Déconnexion (AuthContext cleanup)

```typescript
SocketIO.disconnect()
// → socket.disconnect(), instance = null, callbacks = [], isReady = false
```
