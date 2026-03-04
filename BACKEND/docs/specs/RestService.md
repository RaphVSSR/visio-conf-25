# Référence de la classe RestService — VisioConf

**Fichier source** : `BACKEND/src/models/services/RestService.ts`
**Classe parente** : Aucune (classe statique autonome)

---

## 1. Description

`RestService` configure et expose l'application Express. Il gère le CORS, les routes REST, et le middleware JSON. L'application est passée à `HTTPServer` pour servir les requêtes HTTP.

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `server` | `Express` | `private static` | Instance de l'application Express |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description | Exemple |
|-----|------|--------|-------------|---------|
| `FRONTEND_URL` | `env` | `process.env.FRONTEND_URL \|\| "http://localhost:3000"` | URL du frontend pour le CORS | `"http://localhost:3000"` |
| `API_BASE_PREFIX` | `env` | `process.env.API_BASE_PREFIX \|\| "/"` | Préfixe de base pour les routes API | `"/api/v1"` |
| `VERBOSE` | `env` | `process.env.VERBOSE` | Active les logs | `"true"` |
| `VERBOSE_LVL` | `env` | `process.env.VERBOSE_LVL` | Niveau de verbosité (2+ = détaillé) | `"2"` |
| `__filename` / `__dirname` | `string` | ESM paths | Chemins du fichier courant | — |

### Origines CORS autorisées

- `process.env.FRONTEND_URL` (défaut: `http://localhost:3000`)
- `http://127.0.0.1:3000`
- Toute IP locale (192.168.x.x, 10.x.x.x, 172.16-31.x.x) sur le port 3000
- Requêtes sans origin (applications mobiles, Postman)

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `implement` | — | `Promise<Express>` | static | Point d'entrée. Configure JSON, CORS, static files, routes, et retourne l'application Express |
| `corsDef` | — | `void` | `private static` | Configure le middleware CORS avec validation des origines et pattern IP |
| `routesDef` | — | `Promise<void>` | `private static` | Crée un router Express, monte `/files` → FileRoutes, et l'attache au préfixe API |

---

## 5. Routes REST

| Route | Handler | Description |
|-------|---------|-------------|
| `{API_BASE_PREFIX}/files/*` | `FileRoutes` | Routes de gestion des fichiers (upload, download) |
| Static | `express.static("public/")` | Fichiers statiques (images de profil, etc.) |

---

## 6. Configuration

| Middleware | Description |
|------------|-------------|
| `express.json()` | Parse le body JSON des requêtes |
| `cors()` | CORS avec whitelist d'origines |
| `express.static()` | Fichiers statiques depuis `public/` |
| CORS methods | `GET`, `POST` uniquement |
| CORS headers | `Content-Type`, `Authorization` |
| CORS credentials | `true` |

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `HTTPServer` | HTTPServer.init() → RestService.implement() | Le serveur HTTP utilise l'app Express |
| `FileRoutes` | RestService → FileRoutes | Les routes de fichiers sont montées sur `/files` |

---

## 8. Types TypeScript

```typescript
class RestService {
    private static server: Express;
    static async implement(): Promise<Express>;
    private static corsDef(): void;
    private static async routesDef(): Promise<void>;
}
```

---

## 9. Exemples

### Appel depuis HTTPServer

```typescript
const app = await RestService.implement();
// → Express app avec JSON, CORS, static files, et /files routes configurés
http.createServer(app);
```

### Route REST résultante

```
POST {API_BASE_PREFIX}/files/upload   → FileRoutes (multer)
GET  {API_BASE_PREFIX}/files/:id      → FileRoutes (download)
GET  /public/default_profile_picture.png  → static file
```
