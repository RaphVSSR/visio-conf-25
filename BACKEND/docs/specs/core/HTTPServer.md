# HTTPServer

**Source**: `BACKEND/src/models/core/HTTPServer.ts`

Classe statique encapsulant le serveur HTTP Node.js. Crée un `http.Server` à partir d'une application Express et commence à écouter sur le port configuré. Utilisée comme fondation pour les transports REST et Socket.io.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| server | `Server` (node:http) | — | L'instance du serveur HTTP |
| port | `number` | `3220` | Port d'écoute, lu depuis `process.env.PORT` ou défaut à 3220 |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| createFromExpress | `app: Express` | `void` | Crée le serveur HTTP en utilisant `createServer(app)` |
| listen | — | `void` | Commence à écouter sur `this.port` lié à `0.0.0.0` et affiche un message de confirmation |
