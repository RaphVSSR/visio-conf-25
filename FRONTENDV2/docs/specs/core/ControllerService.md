# Référence de la classe abstraite ControllerService — VisioConf (Frontend)

**Fichiers source** :
- `FRONTENDV2/src/controller/controleur.js` (bus, identique au backend)
- `FRONTENDV2/src/controller/canalsocketio.js` (pont Socket.io frontend)
- `FRONTENDV2/src/services/MessageClientAdapter.ts` (subscriber `ReactBridge`)

---

## 1. Description

`ControllerService` est la classe abstraite de base pour tous les services inscrits au controleur côté frontend. C'est l'équivalent exact de la classe backend — même interface, même pattern pub/sub. Un service hérite de `ControllerService`, implémente `traitementMessage()`, et est automatiquement inscrit au controleur à la construction.

---

## 2. Types TypeScript

### Controller

```typescript
type Controller = {
    listeEmission: Record<string, Record<string, LooseSubscriber>>
    listeAbonnement: Record<string, Record<string, LooseSubscriber>>
    verbose: boolean
    verboseall: boolean
    inscription: (subscriber: ControllerSubscriber, emitted: string[], received: string[]) => void
    desincription: (subscriber: ControllerSubscriber, emitted: string[], received: string[]) => void
    envoie: (subscriber: ControllerSubscriber, message: Record<string, unknown>) => void
}
```

### ControllerSubscriber

```typescript
type ControllerSubscriber = {
    nomDInstance: string
    traitementMessage: (mesg: ControllerMessage) => void
}
```

### ControllerMessage

```typescript
type ControllerMessage = { id: string } & Record<string, unknown>
```

- `id` : socketId de l'émetteur (côté serveur) ou identifiant interne
- Les autres clés sont les noms des actions avec leur payload

---

## 3. Propriétés de la classe

| Propriété | Type | Visibilité | Description | Exemple |
|-----------|------|------------|-------------|---------|
| `nomDInstance` | `string` | `readonly` | Nom d'inscription dans le controleur | `"AuthService"` |
| `controleur` | `Controller` | `protected readonly` | Référence au controleur | — |
| `messagesEmitted` | `string[]` | `readonly` | Messages que ce service peut émettre | `["login", "register"]` |
| `messagesReceived` | `string[]` | `readonly` | Messages que ce service écoute | `["login_success", "login_failure"]` |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `controleur, nom, messagesEmitted, messagesReceived` | `ControllerService` | instance | S'inscrit au controleur via `controleur.inscription()` |
| `traitementMessage` | `mesg: ControllerMessage` | `void` | instance (abstract) | Dispatcher des messages reçus. Doit être implémenté par chaque service |
| `sendMessage` | `message: Record<string, unknown>` | `void` | `protected` | Envoie un message via `controleur.envoie()` |
| `destroy` | — | `void` | instance | Se désinscrit du controleur via `controleur.desincription()` |

---

## 5. Services inscrits

| Service | nomDInstance | Émis | Reçus |
|---------|-------------|------|-------|
| `CanalSocketio` | `"canalsocketio"` | listes reçues du serveur via `donne_liste` | listes reçues du serveur via `donne_liste` |
| `MessageClientAdapter` | `"ReactBridge"` | dynamique (chaque appel `send()` inscrit le message) | dynamique (chaque appel `on()` inscrit le message) |
| `AuthService` | `"AuthService"` | 6 messages auth | 13 messages auth |

---

## 6. Pattern de communication (Frontend)

```
Serveur
    ↕ Socket.io
CanalSocketio (canalsocketio.js — OFF-LIMITS)
    ↕ controleur.envoie() / traitementMessage()
MessageClientAdapter (ReactBridge)
    ↕ on() / send()
AuthSync / call hooks (ou autre ControllerService)
    ↕ setState()
React Context (AuthContext)
    ↕ useAuth()
Composants React
```

---

## 7. Exemples

### Créer un nouveau service frontend

```typescript
class MyService extends ControllerService {
    traitementMessage(mesg: ControllerMessage): void {
        if (mesg.my_action_response) {
            // Mettre à jour le state React
        }
    }

    requestData(): void {
        this.sendMessage({ my_action_request: { param: "value" } })
    }
}

const service = new MyService(controleur, "MyService",
    ["my_action_request"],
    ["my_action_response"]
)
```

### Message transitant par le controleur

```typescript
// AuthService envoie au controleur :
this.sendMessage({ login: { email: "john@example.com", password: "sha256...", deviceInfo: "web" } })

// Le controleur route vers CanalSocketio → Socket.io → Serveur
// Le serveur répond → CanalSocketio → controleur → AuthService.traitementMessage()
```
