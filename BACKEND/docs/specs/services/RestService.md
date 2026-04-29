# RestService

**Source**: `BACKEND/src/models/services/RestService.ts`

Service statique qui configure et retourne l'application Express. Gère le parsing JSON, la politique CORS, le middleware de session basée sur les cookies (connect-mongodb-session), le service de fichiers statiques et le montage des routes REST.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `server` | `Express` (private static) | - | Instance de l'application Express |
| `sessionMiddleware` | `RequestHandler` (static) | - | Middleware express-session configuré avec le store de sessions MongoDB |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `implement` | - | `Promise<Express>` | Configure JSON, CORS, middleware de session, fichiers statiques, routes. Retourne l'application Express |
| `sessionDef` | - (private static) | `void` | Crée un MongoDBStore depuis MONGO_URI, configure express-session avec le nom de cookie "visioconf_session", httpOnly, sameSite lax, secure en prod. Âge max depuis SessionManager.getSessionDurationMs() |
| `corsDef` | - (private static) | `void` | Configure le CORS autorisant FRONTEND_URL, 127.0.0.1:3000, les IPs du réseau local sur le port 3000, et les requêtes sans origine. Méthodes : GET, POST. En-têtes : Content-Type, Authorization. Credentials activé |
| `routesDef` | - (private static) | `Promise<void>` | Crée le routeur principal, monte AuthRoutes sur /auth, attache à API_BASE_PREFIX |

## Détails

- Le pattern regex d'origine CORS correspond à : 192.168.x.x, 10.x.x.x, 172.16-31.x.x, 127.0.0.1 sur le port 3000.
- Les fichiers statiques sont servis depuis le répertoire `public/`.
- Store de sessions : connect-mongodb-session écrivant dans la collection "sessions".
- Le flag secure du cookie de session n'est activé que lorsque NODE_ENV vaut "prod".
- Routes actuellement montées : `/auth` via AuthRoutes.
