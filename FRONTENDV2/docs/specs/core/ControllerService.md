# MessageClientAdapter

**Source**: `FRONTENDV2/src/services/MessageClientAdapter.ts`

Wrapper client Socket.io gérant la connexion, l'envoi de messages et la réception de messages avec le backend. Les messages sont échangés sous forme de chaînes JSON-stringifiées via l'événement Socket.io `"message"`. Le handshake initial utilise `demande_liste` / `donne_liste` pour signaler que le serveur est prêt.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `socket` | `Socket` (private) | — | Instance socket.io-client, configurée avec `autoConnect`, `reconnection`, `withCredentials` |
| `handlers` | `Map<string, Set<MessageHandler>>` (private) | — | Handlers enregistrés indexés par nom de message |
| `readyCallbacks` | `(() => void)[]` (private) | — | Callbacks en file d'attente jusqu'à la fin du handshake serveur |
| `ready` | `boolean` (private) | `false` | Devient `true` après réception de `donne_liste` |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `constructor` | `url: string` | `MessageClientAdapter` | Se connecte au serveur, écoute les messages entrants, émet `demande_liste` |
| `onReady` | `callback: () => void` | `void` | Exécute le callback quand le serveur est prêt, ou immédiatement si déjà prêt |
| `on` | `messageName: string, handler: MessageHandler` | `void` | Enregistre un handler pour un nom de message |
| `off` | `messageName: string, handler: MessageHandler` | `void` | Supprime un handler pour un nom de message |
| `send` | `messageName: string, payload: unknown` | `void` | Envoie un message via `socket.emit("message", JSON.stringify({ [messageName]: payload }))` |
| `onReconnect` | `callback: () => void` | `void` | Enregistre un callback sur l'événement de reconnexion Socket.io |
| `disconnect` | — | `void` | Ferme la connexion Socket.io |

## Détails

Le type `MessageHandler` est `(payload: any) => void`. Les messages entrants sont parsés depuis le JSON, la première clé est utilisée comme nom de message, et sa valeur est distribuée à tous les handlers enregistrés pour ce nom. Le paramètre `payload` dans `send` a pour valeur par défaut `{}`.
