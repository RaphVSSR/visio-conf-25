# Documentation de la classe DriveService

## Vue d'ensemble

La classe `DriveService` est responsable de la gestion des fichiers et dossiers dans l'application Visioconf avec un système de stockage local sur le serveur. Elle gère les requêtes de type CRUD pour les fichiers et dossiers, ainsi que les opérations comme le partage, le déplacement, le renommage ou le téléchargement. Contrairement à l'ancienne version qui utilisait AWS S3, cette implémentation stocke tous les fichiers localement dans le répertoire `uploads/` du serveur.

## Architecture

`DriveService` suit le modèle orienté messages où il s'enregistre auprès d'un contrôleur central pour recevoir et émettre des messages liés aux fichiers. Il s'appuie sur des identifiants de socket pour récupérer l'utilisateur associé aux requêtes. Le service gère également l'infrastructure de fichiers locale en créant automatiquement les répertoires nécessaires.

## Propriétés

| Propriété               | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `controleur`            | Référence au contrôleur central                          |
| `nomDInstance`          | Identifiant unique de l'instance du service              |
| `verbose`               | Flag pour l'affichage des logs de débogage               |
| `uploadsDir`            | Chemin vers le répertoire principal des uploads          |
| `filesDir`              | Chemin vers le répertoire des fichiers utilisateurs      |
| `listeDesMessagesEmis`  | Liste des types de messages que le service peut émettre  |
| `listeDesMessagesRecus` | Liste des types de messages que le service peut recevoir |

## Stockage local

### Structure des répertoires

```
uploads/
├── files/
│   └── [userId]/
│       └── [fileId]/
│           └── [filename]
└── profile-pictures/
    └── [filename]
```

-   **uploads/files/** : Répertoire principal pour les fichiers utilisateurs
-   **uploads/profile-pictures/** : Répertoire dédié aux photos de profil
-   Organisation par `userId` puis `fileId` pour éviter les conflits de noms

### Gestion des fichiers physiques

Le service crée automatiquement les répertoires nécessaires et gère :

-   La création des dossiers utilisateurs
-   Le stockage physique des fichiers
-   La suppression physique lors des soft deletes
-   Le renommage des fichiers physiques

## Messages gérés

### Messages reçus

| Message                      | Format                                    | Émetteur                |
| ---------------------------- | ----------------------------------------- | ----------------------- |
| `files_list_request`         | `{ folderId?: string }`                   | FileExplorer (frontend) |
| `folders_list_request`       | `{ excludeFolderId?: string }`            | FileExplorer (frontend) |
| `file_delete_request`        | `{ fileId: string }`                      | FileExplorer (frontend) |
| `file_rename_request`        | `{ fileId: string, newName: string }`     | FileExplorer (frontend) |
| `file_move_request`          | `{ fileId: string, newParentId: string }` | FileExplorer (frontend) |
| `file_share_to_team_request` | `{ fileId: string, teamId: string }`      | FileExplorer (frontend) |
| `folder_create_request`      | `{ name: string, parentId?: string }`     | FileExplorer (frontend) |
| `file_download_request`      | `{ fileId: string }`                      | FileExplorer (frontend) |

### Messages émis

| Message                       | Format                                                                                          | Récepteur    |
| ----------------------------- | ----------------------------------------------------------------------------------------------- | ------------ |
| `files_list_response`         | `{ etat: boolean, files?: File[], error?: string }`                                             | FileExplorer |
| `folders_list_response`       | `{ etat: boolean, folders?: Folder[], error?: string }`                                         | FileExplorer |
| `file_delete_response`        | `{ etat: boolean, fileId?: string, error?: string }`                                            | FileExplorer |
| `file_rename_response`        | `{ etat: boolean, error?: string }`                                                             | FileExplorer |
| `file_move_response`          | `{ etat: boolean, fileId?: string, newParentId?: string, error?: string }`                      | FileExplorer |
| `file_share_to_team_response` | `{ etat: boolean, fileId?: string, teamId?: string, error?: string }`                           | FileExplorer |
| `folder_create_response`      | `{ etat: boolean, error?: string }`                                                             | FileExplorer |
| `file_download_response`      | `{ etat: boolean, downloadUrl?: string, fileName?: string, mimeType?: string, error?: string }` | FileExplorer |

## Méthodes

### `constructor(controleur, nom)`

Initialise le service, configure les répertoires de stockage, les types de messages pris en charge et s'enregistre auprès du contrôleur.

**Actions effectuées :**

-   Création des répertoires `uploads/` et `uploads/files/`
-   Configuration des listes de messages
-   Enregistrement auprès du contrôleur

### `traitementMessage(mesg)`

Méthode principale pour traiter les messages. Redirige vers la méthode appropriée selon le type de requête :

-   `files_list_request` → liste les fichiers dans un dossier donné
-   `folders_list_request` → liste des dossiers pour déplacement (excluant les références circulaires)
-   `file_delete_request` → suppression logique et physique d'un fichier ou dossier
-   `file_rename_request` → renomme un fichier ou dossier (base de données et fichier physique)
-   `file_move_request` → déplace un fichier ou dossier dans l'arborescence
-   `file_share_to_team_request` → partage un fichier ou dossier avec une équipe
-   `folder_create_request` → crée un nouveau dossier
-   `file_download_request` → génère une URL de téléchargement locale

### Méthodes utilitaires

| Méthode                                      | Description                                                          |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `ensureDirectoryExists(dirPath)`             | Crée un répertoire s'il n'existe pas (récursif)                      |
| `getAllDescendantFolders(folderId, ownerId)` | Récupère récursivement tous les dossiers enfants d'un dossier donné  |
| `recursiveDelete(folderId, ownerId)`         | Supprime logiquement et physiquement tous les éléments d'un dossier  |
| `isCircularReference(sourceId, targetId)`    | Vérifie si le déplacement d'un dossier crée une référence circulaire |
| `getFilePath(fileId, userId, fileName)`      | Génère le chemin physique d'un fichier                               |
| `ensureUserDirectory(userId, fileId)`        | Crée les répertoires utilisateur et fichier si nécessaires           |

## Routes Express associées

Le service travaille en collaboration avec les routes Express définies dans `/routes/files.js` :

### Routes de fichiers

-   **POST** `/api/files/upload` - Upload général de fichiers
-   **POST** `/api/files/upload/profile` - Upload spécifique pour photos de profil
-   **GET** `/api/files/download/:fileId` - Téléchargement de fichier
-   **GET** `/api/files/view/:fileId` - Visualisation de fichier
-   **GET** `/api/files/profile/:filename` - Accès aux photos de profil

### Authentification

Les routes utilisent le middleware `authenticateToken` qui supporte :

-   Headers `Authorization: Bearer <token>`
-   Cookies `accessToken`

## Sécurité

-   **Contrôle d'accès** : L'accès aux fichiers se fait via le `socketId` et le `ownerId`, empêchant toute action non autorisée
-   **Soft delete** : Les fichiers ne sont jamais supprimés immédiatement de la base de données (champ `deleted`)
-   **Hard delete** : Les fichiers physiques sont supprimés du système de fichiers lors du soft delete
-   **Isolation utilisateurs** : Chaque utilisateur a son propre répertoire
-   **Partage contrôlé** : Les fichiers peuvent être partagés publiquement ou à des utilisateurs spécifiques

## Flux typiques

### Upload d'un fichier

1. **Frontend** : Upload via `/api/files/upload` avec `multer`
2. **Backend** : Création de l'entrée en base de données avec path local
3. **Storage** : Fichier stocké dans `uploads/files/[userId]/[fileId]/[filename]`
4. **Response** : Confirmation avec métadonnées du fichier

### Téléchargement d'un fichier

1. **Frontend** : Demande `file_download_request` via WebSocket
2. **DriveService** : Vérification des permissions
3. **Response** : URL locale `/api/files/download/[fileId]`
4. **Frontend** : Accès direct via l'URL fournie

### Suppression d'un fichier

1. **Frontend** : Envoi de `file_delete_request`
2. **DriveService** : Soft delete en base + suppression physique
3. **Système** : Fichier marqué comme `deleted` et retiré du stockage
4. **Response** : Confirmation de suppression

### Upload de photo de profil

1. **Frontend** : Upload via `/api/files/upload/profile`
2. **Backend** : Stockage dans `uploads/profile-pictures/`
3. **Database** : Mise à jour du profil utilisateur
4. **Access** : Disponible via `/api/files/profile/[filename]`

## Migration depuis AWS S3

Cette implémentation remplace complètement le système AWS S3 :

-   **Stockage** : S3 bucket → Répertoire local `uploads/`
-   **URLs** : S3 signed URLs → URLs locales `/api/files/`
-   **Upload** : Signed URL upload → Direct HTTP POST
-   **Authentication** : AWS credentials → JWT tokens locaux
-   **Scalabilité** : Cloud storage → Stockage serveur local

## Configuration requise

-   **Espace disque** : Suffisant pour stocker tous les fichiers utilisateurs
-   **Permissions** : Droits d'écriture sur le répertoire `uploads/`
-   **Backup** : Système de sauvegarde pour le répertoire `uploads/`
-   **Monitoring** : Surveillance de l'espace disque disponible
