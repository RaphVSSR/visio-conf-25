# Référence de la classe MessageClientAdapter — VisioConf (Frontend)

**Fichier source** : `FRONTENDV2/src/services/MessageClientAdapter.ts`

> **Note :** L'ancien pattern `ControllerService` + `Controleur` + `CanalSocketio` côté frontend a été remplacé par `MessageClientAdapter`, un wrapper direct autour de `socket.io-client`.

---

## 1. Description

`MessageClientAdapter` est le wrapper Socket.io côté frontend. Il gère la connexion, l'envoi et la réception des messages avec le backend. Les messages sont échangés en JSON stringifié via l'événement Socket.io `"message"`.

Le handshake initial se fait via `demande_liste` / `donne_liste` pour signaler que le serveur est prêt.

---

## 2. Propriétés

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `socket` | `Socket` | `private` | Instance socket.io-client |
| `handlers` | `Map<string, Set<MessageHandler>>` | `private` | Handlers enregistrés par nom de message |
| `readyCallbacks` | `(() => void)[]` | `private` | Callbacks en attente du handshake serveur |
| `ready` | `boolean` | `private` | `true` après réception de `donne_liste` |

---

## 3. Méthodes

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `constructor` | `url: string` | `MessageClientAdapter` | Connecte au serveur, écoute les messages entrants, envoie `demande_liste` |
| `on` | `messageName: string, handler: MessageHandler` | `void` | Enregistre un handler pour un nom de message |
| `off` | `messageName: string, handler: MessageHandler` | `void` | Supprime un handler |
| `send` | `messageName: string, payload?: unknown` | `void` | Envoie un message au serveur via `socket.emit("message", JSON.stringify({ [messageName]: payload }))` |
| `onReady` | `callback: () => void` | `void` | Exécute le callback quand le serveur est prêt (ou immédiatement si déjà prêt) |
| `onReconnect` | `callback: () => void` | `void` | Enregistre un callback sur la reconnexion Socket.io |
| `disconnect` | — | `void` | Ferme la connexion Socket.io |

---

## 4. Pattern de communication

```
Serveur (Backend)
    ↕ Socket.io (événement "message", JSON stringifié)
MessageClientAdapter
    ↕ on() / send()
AuthSync, composants React (via socket ref)
    ↕ setState() / useAuth()
React Context (AuthContext)
    ↕ useAuth()
Composants React
```

---

## 5. Protocole de messages

### Réception (serveur → client)

Le serveur envoie un événement `"message"` contenant un JSON stringifié. La première clé du JSON est le nom du message, sa valeur est le payload :

```json
{ "login_response": { "status": "success", "user": {...}, "expiresAt": 1234567890 } }
```

`MessageClientAdapter` parse le JSON, extrait la première clé, et appelle tous les handlers enregistrés pour ce nom de message.

### Envoi (client → serveur)

```typescript
socket.send("team_action", { type: "create", name: "Dev", members: ["u1"] })
// → socket.emit("message", '{"team_action":{"type":"create","name":"Dev","members":["u1"]}}')
```

---

## 6. Utilisation

```typescript
const socket = new MessageClientAdapter("http://localhost:3220")

socket.onReady(() => {
    socket.send("authenticate", {})
})

socket.on("authenticate_response", (data) => {
    if (data.status === "success") {
        console.log("Authenticated:", data.user)
    }
})
```
