# Référence de la classe Database — VisioConf

**Fichier source** : `BACKEND/src/models/services/Database.ts`
**Classe parente** : Aucune (classe statique autonome)

---

## 1. Description

`Database` est le service d'initialisation MongoDB. Il gère la connexion, le flush optionnel, l'injection des données de base (utilisateurs, permissions, rôles, admin), et la préparation de l'environnement de fichiers.

---

## 2. Propriétés de la classe

Aucune propriété persistante. Toutes les opérations sont statiques et sans état.

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description | Exemple |
|-----|------|--------|-------------|---------|
| `MONGO_URI` | `env` | `process.env.MONGO_URI` | URI de connexion MongoDB (requis) | `"mongodb://localhost:27017/visioconf"` |
| `MONGO_USER` | `env` | `process.env.MONGO_USER` | Utilisateur MongoDB (optionnel) | `"admin"` |
| `MONGO_PASSWORD` | `env` | `process.env.MONGO_PASSWORD` | Mot de passe MongoDB (optionnel) | `"s3cret"` |
| `FLUSH_DB_ON_START` | `env` | `process.env.FLUSH_DB_ON_START` | **[DEV]** Si `"true"`, vide la DB au démarrage. Doit être `false` ou absent en production | `"true"` |
| `VERBOSE` | `env` | `process.env.VERBOSE` | Active les logs | `"true"` |
| `__filename` / `__dirname` | `string` | ESM paths | Chemins du fichier courant | — |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `init` | — | `Promise<void>` | static | Point d'entrée. Enchaîne : connect → flushDb (conditionnel) → User.inject → Permission.inject → Role.inject → injectAdminUser → prepareProjectEnv. **En production** : `FLUSH_DB_ON_START` doit être `false`, seuls Permission.inject, Role.inject et injectAdminUser sont utiles au premier démarrage (seeding) |
| `connect` | — | `Promise<void>` | `private static` | Connexion à MongoDB via `mongoose.connect()`. Utilise `MONGO_USER`/`MONGO_PASSWORD` si présents |
| `flushDb` | — | `Promise<void>` | `private static` | **[DEV]** Vide toutes les collections et le répertoire d'upload. Ordre: Session → Folder → Role → Permission → Discussion → TeamMember → Team → ChannelPost → ChannelPostResponse → ChannelMember → Channel → User |
| `injectAdminUser` | — | `Promise<void>` | `private static` | **[DEV+PROD]** Crée l'admin par défaut (`dev@visioconf.com` / `d3vV1s10C0nf`) avec le rôle admin, s'il n'existe pas déjà. En production, les credentials admin doivent être configurés dans `.env` |
| `prepareProjectEnv` | — | `Promise<void>` | `private static` | Vérifie l'intégrité de l'environnement |
| `verifyUploadsEnvIntegrity` | — | `void` | `private static` | Crée les répertoires `uploads/` et `uploads/files/` s'ils n'existent pas |
| `disconnect` | — | `Promise<void>` | `private static` | Ferme la connexion MongoDB |

---

## 5. Séquence d'initialisation (init)

```
Database.init()
    ├─ connect()                    → MongoDB
    ├─ flushDb()                    → [DEV] (si FLUSH_DB_ON_START=true)
    ├─ User.inject()                → [DEV] 5 utilisateurs de test
    ├─ Permission.inject()          → [DEV+PROD] 45 permissions (seeding)
    ├─ Role.inject()                → [DEV+PROD] 2 rôles (seeding)
    ├─ injectAdminUser()            → [DEV+PROD] admin account
    └─ prepareProjectEnv()          → [DEV+PROD] uploads dirs
```

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `User` | Database → User.inject(), User.getUser() | Injection des utilisateurs de test et de l'admin |
| `Permission` | Database → Permission.inject() | Injection des permissions |
| `Role` | Database → Role.inject() | Injection des rôles |
| `Session` | Database → Session.flushAll() | Flush des sessions |
| `FileSystem` | Database → FileSystem.flushUploadLocalDir() | Flush du répertoire d'upload |
| `Folder` | Database → Folder.flushAll() | Flush des dossiers |
| `Discussion` | Database → Discussion.flushAll() | Flush des discussions |
| `Team/TeamMember` | Database → Team/TeamMember.flushAll() | Flush des équipes |
| `Channel/*` | Database → Channel/ChannelMember/ChannelPost/ChannelPostResponse.flushAll() | Flush des canaux |

---

## 7. Types TypeScript

```typescript
class Database {
    static async init(): Promise<void>;
    private static async connect(): Promise<void>;
    private static async flushDb(): Promise<void>;
    private static async injectAdminUser(): Promise<void>;
    private static async prepareProjectEnv(): Promise<void>;
    private static verifyUploadsEnvIntegrity(): void;
    private static async disconnect(): Promise<void>;
}
```

---

## 8. Exemples

### .env minimal

```env
MONGO_URI=mongodb://localhost:27017/visioconf
FLUSH_DB_ON_START=true
VERBOSE=true
```

### Appel depuis index.ts

```typescript
await Database.init();
// → connect → flush (si FLUSH_DB_ON_START) → inject users → inject perms → inject roles → inject admin → prepare env
```
