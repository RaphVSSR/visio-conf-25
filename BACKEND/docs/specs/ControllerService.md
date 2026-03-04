# Référence du Controller Layer — VisioConf

**Fichiers sources** : `BACKEND/src/Controller/Controller.types.ts` + `Controller.service.ts` + `Controller.abstracts.ts`

---

## 1. Description

Le Controller layer définit les types et la classe abstraite pour le pattern pub/sub (controleur/canal). Le `controleur.js` et `canalsocketio.js` sont des fichiers JS off-limits, mais les types TypeScript et la classe de base `ControllerService` sont définis ici.

---

## 2. Types TypeScript

### Controller

```typescript
type Controller = {
    verboseall: boolean,
    inscription: (subscriber: ControllerSubscriber, emitted: string[], received: string[]) => void,
    desincription: (subscriber: ControllerSubscriber, emitted: string[], received: string[]) => void,
    envoie: (subscriber: ControllerSubscriber, message: Record<string, unknown>) => void,
}
```

### ControllerSubscriber

```typescript
type ControllerSubscriber = {
    nomDInstance: string,
    traitementMessage: (mesg: ControllerMessage) => void,
}
```

### ControllerMessage

```typescript
type ControllerMessage = { id: string } & Record<string, unknown>
```

- `id` : socketId de l'émetteur
- Les autres clés sont les noms des actions avec leur payload

---

## 3. Classe abstraite ControllerService

| Propriété | Type | Visibilité | Description | Exemple |
|-----------|------|------------|-------------|---------|
| `nomDInstance` | `string` | `readonly` | Nom d'inscription dans le controleur | `"AuthService"` |
| `controleur` | `Controller` | `protected readonly` | Référence au controleur | `new Controller()` |
| `messagesEmitted` | `string[]` | `readonly` | Messages que ce service peut émettre | `["auth_success", "auth_failure"]` |
| `messagesReceived` | `string[]` | `readonly` | Messages que ce service écoute | `["login", "register"]` |

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `controleur, nom, messagesEmitted, messagesReceived` | `ControllerService` | instance | S'inscrit automatiquement auprès du controleur via `controleur.inscription()` |
| `traitementMessage` | `mesg: ControllerMessage` | `void` | instance (abstract) | Dispatcher des messages reçus. Doit être implémenté par chaque service |

---

## 4. Initialisation (Controller.abstracts.ts)

```typescript
function init() {
    const controleur = new Controller()
    new CanalSocketio(SocketIO.server, controleur, "canalsocketio")
    new AuthService(controleur, "AuthService", [...emitted], [...received])
}
```

Séquence :
1. Crée l'instance du controleur (JS)
2. Crée le CanalSocketio lié au serveur Socket.io
3. Crée et inscrit le AuthService

---

## 5. Services inscrits

| Service | nomDInstance | Émis | Reçus |
|---------|-------------|------|-------|
| `CanalSocketio` | `"canalsocketio"` | (tous les messages Socket.io) | (tous les messages Socket.io) |
| `AuthService` | `"AuthService"` | 13 messages auth | 7 messages auth |

---

## 6. Pattern de communication

```
Client (Browser)
    ↕ Socket.io
CanalSocketio
    ↕ controleur.envoie() / traitementMessage()
AuthService (ou autre ControllerService)
    ↕ MongoDB
Database
```

---

## 7. Exemples

### Créer un nouveau service

```typescript
class MyService extends ControllerService {
    traitementMessage(mesg: ControllerMessage) {
        const socketId = mesg.id;
        if (mesg.my_action) this.handleMyAction(socketId, mesg.my_action);
    }

    private handleMyAction(socketId: string, payload: any) {
        // ... logique métier ...
        this.controleur.envoie(this, { id: socketId, my_action_response: { success: true } });
    }
}

// Inscription
new MyService(controleur, "MyService", ["my_action_response"], ["my_action"]);
```

### Message transitant par le controleur

```typescript
// CanalSocketio reçoit du client et envoie au controleur :
controleur.envoie(canalsocketio, { id: "xK9...", login: { email: "john@example.com", password: "sha256...", deviceInfo: "web" } });

// Le controleur route vers AuthService.traitementMessage()
// AuthService répond via :
controleur.envoie(this, { id: "xK9...", login_success: { user: {...}, sessionId: "s1...", expiresAt: 1709312400000 } });
```
