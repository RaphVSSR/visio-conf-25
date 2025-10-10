# Configuration des Variables d'Environnement

## Frontend (Next.js)

### Structure des fichiers

-   **`.env.example`** - Template avec toutes les variables nécessaires (committé dans git)
-   **`.env.local`** - Configuration locale de développement (ignoré par git)
-   **`.env.development`** - Configuration pour l'environnement de développement
-   **`.env.production`** - Configuration pour l'environnement de production

### Variables disponibles

```bash
# URL de l'API backend
NEXT_PUBLIC_API_URL=http://localhost:3220

# URL de base pour le stockage de fichiers
NEXT_PUBLIC_FILE_STORAGE_URL=http://localhost:3220/api/files

# URL de base pour les photos de profil
NEXT_PUBLIC_PROFILE_PICTURES_URL=http://localhost:3220/api/files/profile
```

### Configuration pour le développement

1. Copiez `.env.example` vers `.env.local` :

    ```bash
    cp .env.example .env.local
    ```

2. Modifiez les valeurs dans `.env.local` selon votre configuration locale

### Utilisation dans le code

```typescript
// Utilisation des helpers pour les URLs
import { getProfilePictureUrl, getApiUrl } from "@/utils/fileHelpers"

// URL de l'API
const apiUrl = getApiUrl() // process.env.NEXT_PUBLIC_API_URL

// URL de photo de profil
const profileUrl = getProfilePictureUrl(user.picture)
```

## Backend (Node.js)

### Variables d'environnement

```bash
# Base de données
MONGO_URI=mongodb://127.0.0.1:27017/visio-conf?authSource=admin
MONGO_USER=visio-conf-user
MONGO_PASSWORD=visio-conf-password

# Authentification
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=adminpassword

# Serveur
PORT=3220
VERBOSE=true

# Stockage de fichiers local
FILE_STORAGE_URL=http://localhost:3220/api/files
PROFILE_PICTURES_URL=http://localhost:3220/api/files/profile
```

### Configuration pour le développement

1. Copiez `.env.example` vers `.env` :

    ```bash
    cp .env.example .env
    ```

2. Modifiez les valeurs selon votre configuration

## Avantages de cette approche

### Sécurité

-   Les fichiers `.env.local` et `.env` sont automatiquement ignorés par git
-   Pas de risque d'exposer des secrets dans le dépôt
-   Chaque environnement a sa propre configuration

### Flexibilité

-   Configuration différente par développeur
-   Variables spécifiques par environnement (dev/prod)
-   URLs facilement modifiables sans toucher au code

### Maintenabilité

-   Centralisation de toutes les URLs dans les helpers
-   Pas de URLs hardcodées dans le code
-   Facile à migrer vers d'autres environnements
