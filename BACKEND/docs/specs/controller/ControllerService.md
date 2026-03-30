# Référence de la couche Controller — VisioConf

**Fichiers source** : `BACKEND/src/controller/Controller.types.ts` + `Controller.service.ts`

---

## 1. Description

La couche Controller définit les types et la classe abstraite pour le pattern pub/sub (controleur/canal). `controleur.js` et `canalsocketio.js` sont des fichiers JS intouchables, mais les types TypeScript et la classe de base `ControllerService` sont définis ici.

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
- Les autres clés sont des noms d'actions avec leur payload

---

## 3. Classe abstraite ControllerService

| Propriété | Type | Visibilité | Description | Exemple |
|-----------|------|------------|-------------|---------|
| `nomDInstance` | `string` | `readonly` | Nom d'inscription dans le controleur | `"UserService"` |
| `controleur` | `Controller` | `protected readonly` | Référence au controleur | `new Controller()` |
| `messagesEmitted` | `string[]` | `readonly` | Messages que ce service peut émettre | `["user_response", "user_list_response"]` |
| `messagesReceived` | `string[]` | `readonly` | Messages que ce service écoute | `["user", "user_list"]` |

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `controleur, nom, messagesEmitted, messagesReceived` | `ControllerService` | instance | S'inscrit automatiquement auprès du controleur via `controleur.inscription()` |
| `traitementMessage` | `mesg: ControllerMessage` | `void` | instance (abstraite) | Dispatcher de messages. Doit être implémenté par chaque service |

**Note :** AuthService n'étend pas ControllerService -- il utilise un pattern autonome similaire (même interface `nomDInstance` + `traitementMessage`) mais gère sa propre inscription et son cycle de vie de manière indépendante. Tous les autres services (UserService, TeamService, ChannelService) étendent ControllerService.

---

## 4. Initialisation (index.ts)

```typescript
const controleur = new Controleur()
new CanalSocketio(server, controleur, "canalsocketio")
const authService = new AuthService(controleur, "AuthService")
authService.register()
new UserService(controleur, "UserService", [...emitted], [...received])
new TeamService(controleur, "TeamService", [...emitted], [...received])
new ChannelService(controleur, "ChannelService", [...emitted], [...received])
```

Séquence :
1. Crée l'instance du controleur (JS)
2. Crée le CanalSocketio lié au serveur Socket.io
3. Crée AuthService avec `new` + appelle `register()` (pattern autonome)
4. Crée et inscrit les autres services via le constructeur de ControllerService

---

## 5. Services inscrits

| Service | nomDInstance | Émis | Reçus |
|---------|-------------|------|-------|
| `CanalSocketio` | `"canalsocketio"` | (tous les messages Socket.io) | (tous les messages Socket.io) |
| `AuthService` | `"AuthService"` | 4 messages auth | 5 messages auth |
| `UserService` | `"UserService"` | 2 messages user | 2 messages user |
| `TeamService` | `"TeamService"` | 3 messages team | 3 messages team |
| `ChannelService` | `"ChannelService"` | 4 messages channel | 4 messages channel |

---

## 6. Pattern de communication

```
Client (Navigateur)
    | Socket.io
CanalSocketio
    | controleur.envoie() / traitementMessage()
AuthService / UserService / TeamService / ChannelService
    | MongoDB
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
        this.controleur.envoie(this, { id: socketId, my_action_response: { success: true } });
    }
}

new MyService(controleur, "MyService", ["my_action_response"], ["my_action"]);
```

### Message transitant par le controleur

```typescript
controleur.envoie(canalsocketio, { id: "xK9...", login: { email: "john@example.com", password: "sha256...", deviceInfo: "web" } });

controleur.envoie(this, { id: "xK9...", login_response: { status: "success", user: {...}, expiresAt: 1709312400000 } });
```
