# FileSystem, Folder, File

**Source**: `BACKEND/src/models/services/FileSystem.ts`

Contient trois classes dans un seul fichier. `FileSystem` est un utilitaire statique gérant les uploads de fichiers (config multer), les opérations sur les fichiers et la gestion du répertoire d'uploads. `Folder` et `File` sont des sous-classes Collection soutenues par Mongoose représentant des entrées du système de fichiers stockées dans une collection MongoDB partagée nommée "File".

## Propriétés

### Folder

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `schema` | `Schema` (protected static) | - | Schema Mongoose pour les dossiers |
| `model` | `Model<FolderType>` (static) | - | Modèle Mongoose enregistré comme "File" |
| `modelInstance` | `Document` | - | Instance de document Mongoose hydraté |
| `files` | `File[]` (optional) | - | Instances File enfants si construit avec des fichiers |

### File

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `schema` | `Schema<FileType>` (protected static) | - | Schema Mongoose pour les fichiers |
| `areVirtualsInitialized` | `boolean` (private static) | `true` | IIFE qui enregistre les virtuels (url, info) au chargement |
| `model` | `Model<FileType>` (static) | - | Modèle Mongoose enregistré comme "File" |
| `modelInstance` | `Document` | - | Instance de document Mongoose hydraté |

### FileSystem

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `uploadsDir` | `string` (static) | `"/app/uploads"` | Chemin absolu vers le répertoire racine des uploads |
| `filesDir` | `string` (static) | `"/app/uploads/files"` | Chemin absolu vers le sous-répertoire des fichiers |
| `upload` | `multer.Multer` (static) | - | Instance multer préconfigurée avec stockage et filtre |

## Méthodes

### Folder

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `constructor` | `dataToConstruct: FolderType` | `Folder` | Crée un document dossier. Si un tableau de fichiers est fourni, instancie les objets File enfants |
| `save` | - | `Promise<void>` | Sauvegarde le dossier puis sauvegarde tous les fichiers enfants en parallèle |
| `flushAll` | - (static) | `Promise<DeleteResult>` | Supprime tous les documents File puis tous les documents Folder |

### File

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `constructor` | `dataToConstruct: FileType` | `File` | Crée une instance de document fichier |
| `save` | - | `Promise<void>` | Sauvegarde le document fichier dans MongoDB |
| `flushAll` | - (static) | `Promise<DeleteResult>` | Supprime tous les documents File |

### Virtuels File

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `url` | - (virtual getter) | `string` | Retourne `"/file/" + this.id` |
| `info` | - (virtual getter) | `FileType` | Retourne un objet avec toutes les propriétés du fichier |

### FileSystem

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `copyTestFiles` | `testFileName: string, targetPath: string` | `Promise<void>` | Copie un fichier depuis uploads/usersFilesTest vers le chemin cible, en créant les répertoires si nécessaire |
| `getFileSize` | `filePath: string` | `number` | Retourne la taille du fichier en octets via fs.statSync |
| `flushUploadLocalDir` | - | `void` | Supprime et recrée le répertoire filesDir |
| `defStorage` | - (private static) | `multer.StorageEngine` | Configure le stockage disque multer : destination est `filesDir/{userId}/{fileId}/`, le nom de fichier est le nom original |
| `defFilter` | - (private static) | `FileFilterCallback` | Valide le type MIME du fichier par rapport à la liste autorisée |

## Détails

- Folder et File partagent la même collection MongoDB "File", différenciés par le champ `type` ("folder" ou "file").
- Les deux étendent la classe abstraite `Collection`.
- Limite de taille d'upload : 50 Mo.
- Types MIME autorisés : image/jpeg, image/png, image/gif, image/webp, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain, text/csv, application/zip, application/x-rar-compressed, video/mp4, video/quicktime, video/x-msvideo, audio/mpeg, audio/wav.
- Champs FolderType : name, type, createdAt, updatedAt, parentId, ownerId, shared, sharedWith[], sharedWithTeams[], deleted, deletedAt, files?.
- Champs FileType : name, type, size, mimeType, extension, createdAt, updatedAt, parentId, ownerId, shared, sharedWith, sharedWithTeams, path, deleted, deletedAt.
