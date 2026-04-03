# Socket.io Initialization

**Source**: `BACKEND/src/index.ts`

Il n'y a pas de classe SocketIO autonome. Le serveur Socket.io est instancié directement dans index.ts, attaché au serveur HTTP et passé à CanalSocketIO pour le pont pub/sub. Le middleware de session de RestService est appliqué au moteur socket pour le partage de session basée sur les cookies.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `socketServer` | `Server` (socket.io) | - | Variable locale dans index.ts, instance du serveur Socket.io |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `new Server(httpServer, options)` | `HTTPServer.server, { cors }` | `Server` | Crée le serveur Socket.io attaché au serveur HTTP avec la config CORS |
| `SessionManager.bindToServer` | `socketServer: Server` | `void` | Lie le SessionManager au serveur socket pour le suivi des sessions |
| `socketServer.engine.use` | `RestService.sessionMiddleware` | `void` | Applique le middleware express-session au moteur Socket.io pour le partage des cookies |

## Détails

- Origine CORS : variable d'env `FRONTEND_URL` ou `http://localhost:3000`.
- Méthodes CORS : GET, POST. Credentials activé.
- Le serveur socket est passé à `new CanalSocketIO(socketServer, controleur, "canalsocketio")` qui fait le pont entre les événements socket et le système pub/sub du contrôleur.
- Services enregistrés sur le contrôleur après la configuration socket : AuthService, ChannelService, TeamService, UserService.
