# Database

**Source**: `BACKEND/src/models/services/Database.ts`

Service statique gérant le cycle de vie MongoDB : connexion, flush des collections, injection de l'admin par défaut et vérification du répertoire d'uploads. Toutes les méthodes sont statiques sans état persistant.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| - | - | - | Aucune propriété d'instance ou statique. Entièrement sans état. |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `connectToMongo` | - | `Promise<void>` | Se connecte à MongoDB en utilisant la variable d'env MONGO_URI. Utilise optionnellement MONGO_USER/MONGO_PASSWORD pour l'authentification |
| `flushAllCollections` | - | `Promise<void>` | Flush toutes les données : répertoire local d'uploads, Folder, Role, Permission, Discussion, TeamMember, Team, ChannelPost, ChannelPostResponse, ChannelMember, Channel, User |
| `injectDefaultAdmin` | - | `Promise<void>` | Crée l'utilisateur admin (dev@visioconf.com / d3vV1s10C0nf) avec hash SHA256 s'il n'existe pas déjà |
| `ensureUploadDirectories` | - | `void` | Crée les répertoires uploads/ et uploads/files/ s'ils sont manquants |
| `disconnect` | - | `Promise<void>` | Privé. Ferme la connexion MongoDB |

## Détails

- Lance TracedError avec un tag de contexte à chaque échec (dbConnect, dbFlushing, injectAdmin, uploadsIntegrity, dbClose).
- Toutes les méthodes affichent un log en cas de succès quand la variable d'env VERBOSE vaut "true".
- flushAllCollections est prévu pour les environnements dev/test uniquement.
- injectDefaultAdmin est idempotent : ignore si l'email admin existe déjà.
