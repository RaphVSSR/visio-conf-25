# Référence du Modèle File / Folder / FileSystem — VisioConf

**Fichier source** : `BACKEND/src/models/services/FileSystem.ts`
**Classes parentes** : `Collection` (abstract) — Folder et File
**Collections MongoDB** : `File` (partagée entre Folder et File)

---

## 1. Schema complet

### Folder

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('f1...')` |
| `name` | `String` | oui | — | — | Nom du dossier | `"Documents RH"` |
| `type` | `String` | oui | `"folder"` | — | Type de l'entrée | `"folder"` |
| `createdAt` | `Date` | oui | `Date.now` | — | Date de création | `2026-03-01T10:00:00Z` |
| `updatedAt` | `Date` | oui | `Date.now` | — | Date de dernière modification | `2026-03-01T10:00:00Z` |
| `parentId` | `String` | non | `null` | — | ID of the parent folder, null if in root | `null` |
| `ownerId` | `String` | oui | — | — | UUID of the user who owns this file/folder | `"user123"` |
| `shared` | `Boolean` | oui | `false` | — | Whether this file/folder is shared publicly | `false` |
| `sharedWith` | `String[]` | non | `[]` | — | UUIDs of users this file/folder is shared with | `[]` |
| `sharedWithTeams` | `String[]` | non | `[]` | — | IDs of teams this file/folder is shared with | `[]` |
| `deleted` | `Boolean` | oui | `false` | — | Soft delete flag | `false` |
| `deletedAt` | `Date` | non | `null` | — | Date de suppression | `null` |

### File

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('f2...')` |
| `name` | `String` | oui | — | — | Nom du fichier | `"contrat.pdf"` |
| `type` | `String` | oui | `"file"` | — | Type de l'entrée | `"file"` |
| `size` | `Number` | oui | `0` | — | Taille du fichier en bytes | `102400` |
| `mimeType` | `String` | oui | `null` | — | Type MIME du fichier | `"application/pdf"` |
| `extension` | `String` | oui | `null` | — | Extension du fichier | `"pdf"` |
| `createdAt` | `Date` | oui | `Date.now` | — | Date de création | `2026-03-01T10:00:00Z` |
| `updatedAt` | `Date` | oui | `Date.now` | — | Date de dernière modification | `2026-03-01T10:00:00Z` |
| `parentId` | `String` | non | `null` | — | ID of the parent folder, null if in root | `"f1..."` |
| `ownerId` | `String` | oui | — | — | UUID of the user who owns this file/folder | `"user123"` |
| `shared` | `Boolean` | oui | `false` | — | Whether this file/folder is shared publicly | `false` |
| `sharedWith` | `String[]` | non | `[]` | — | UUIDs of users this file/folder is shared with | `["user456"]` |
| `sharedWithTeams` | `String[]` | non | `[]` | — | IDs of teams this file/folder is shared with | `[]` |
| `path` | `String` | oui | — | — | Path to the file in storage | `"/uploads/files/user123/f2/"` |
| `deleted` | `Boolean` | oui | `false` | — | Soft delete flag | `false` |
| `deletedAt` | `Date` | non | `null` | — | Date de suppression | `null` |

---

## 2. Propriétés de la classe

### Folder

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema` | `protected static` | Schéma Mongoose |
| `model` | `Model<FolderType>` | `static` | Modèle Mongoose (note: enregistré sous le nom `"File"`) |
| `modelInstance` | `Document<FolderType>` | `public` | Instance du document |
| `files` | `File[]` | `public` | Fichiers contenus dans le dossier (optionnel) |

### File

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<FileType>` | `protected static` | Schéma Mongoose |
| `model` | `Model<FileType>` | `static` | Modèle Mongoose (enregistré sous le nom `"File"`) |
| `modelInstance` | `Document<FileType>` | `public` | Instance du document |
| `areVirtualsInitialized` | `boolean` | `private static` | IIFE qui initialise les virtuals au chargement |

### FileSystem

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `uploadsDir` | `string` | `static` | Chemin absolu vers le répertoire uploads |
| `filesDir` | `string` | `static` | Chemin absolu vers le répertoire uploads/files |
| `upload` | `multer.Multer` | `static` | Instance multer configurée |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description |
|-----|------|--------|-------------|
| `__filename` | `string` | `fileURLToPath(import.meta.url)` | Chemin absolu du fichier courant |
| `__dirname` | `string` | `path.dirname(__filename)` | Répertoire du fichier courant |
| File size limit | `number` | `50 * 1024 * 1024` (50MB) | Taille maximale d'upload |
| Allowed MIME types | `string[]` | voir ci-dessous | Types MIME autorisés pour l'upload |

### Types MIME autorisés

```
image/jpeg, image/png, image/gif, image/webp,
application/pdf, application/msword,
application/vnd.openxmlformats-officedocument.wordprocessingml.document,
text/plain, text/csv,
application/zip, application/x-rar-compressed,
video/mp4, video/quicktime, video/x-msvideo,
audio/mpeg, audio/wav
```

---

## 4. Méthodes

### Folder

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: FolderType` | `Folder` | instance | Crée un dossier. Si `dataToConstruct.files` est fourni, crée aussi les instances File |
| `save` | — | `Promise<void>` | instance | Sauvegarde le dossier et tous ses fichiers associés |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime tous les dossiers et fichiers (`File.flushAll()` + `Folder.deleteMany`) |

### File

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: FileType` | `File` | instance | Crée un fichier |
| `save` | — | `Promise<void>` | instance | Sauvegarde le fichier en base de données |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime tous les fichiers |

### File — Virtuals

| Virtual | Retour | Description |
|---------|--------|-------------|
| `url` | `string` | Retourne `"/file/" + this.id` |
| `info` | `FileType` | Retourne un objet avec toutes les infos du fichier |

### FileSystem

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `copyTestFiles` | `testFileName: string, targetPath: string` | `Promise<void>` | static | **[DEV]** Copie un fichier de test vers un chemin cible |
| `getFileSize` | `filePath: string` | `number` | static | Retourne la taille d'un fichier en bytes |
| `flushUploadLocalDir` | — | `void` | static | **[DEV]** Supprime et recrée le répertoire d'upload local |
| `defStorage` | — | `multer.StorageEngine` | `private static` | Configure le stockage multer (destination: `uploads/files/{userId}/{fileId}/`) |
| `defFilter` | — | `multer.FileFilterCallback` | `private static` | Configure le filtre de types MIME autorisés |

---

## 5. Catalogue des messages associés

### Client → Serveur (8 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `files_list_request` | `{ folderId?: string }` | Demande la liste des fichiers (d'un dossier ou racine) |
| `file_delete_request` | `{ fileId: string }` | Suppression d'un fichier (soft delete) |
| `file_rename_request` | `{ fileId: string, name: string }` | Renommage d'un fichier |
| `file_move_request` | `{ fileId: string, parentId: string }` | Déplacement d'un fichier |
| `file_share_to_team_request` | `{ fileId: string, teamId: string }` | Partage d'un fichier avec une équipe |
| `shared_files_list_request` | `{}` | Demande la liste des fichiers partagés |
| `folders_list_request` | `{ parentId?: string }` | Demande la liste des dossiers |
| `folder_create_request` | `{ name: string, parentId?: string }` | Création d'un nouveau dossier |

### Serveur → Client (8 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `files_list_response` | `{ files: File[] }` | Réponse avec la liste des fichiers |
| `file_delete_response` | `{ success: boolean }` | Confirmation de suppression |
| `file_rename_response` | `{ success: boolean }` | Confirmation de renommage |
| `file_move_response` | `{ success: boolean }` | Confirmation de déplacement |
| `file_share_to_team_response` | `{ success: boolean }` | Confirmation de partage |
| `shared_files_list_response` | `{ files: File[] }` | Réponse avec les fichiers partagés |
| `folders_list_response` | `{ folders: Folder[] }` | Réponse avec la liste des dossiers |
| `folder_create_response` | `{ folder: Folder }` | Confirmation de création de dossier |

**Total : 8 client→serveur + 8 serveur→client = 16 messages**

Note : le message `upload_request` / `upload_response` est aussi utilisé mais transite via REST (multer) et non Socket.io.

---

## 6. Types TypeScript

```typescript
type FolderType = {
    _id?: Types.ObjectId,
    name: string,
    type: "folder",
    createdAt: Date,
    updatedAt: Date,
    parentId: Types.ObjectId | null,
    ownerId: Types.ObjectId,
    files?: FileType[],
}

type FileType = {
    _id?: Types.ObjectId,
    name: string,
    type: "file",
    size: number,
    mimeType: string,
    extension: string,
    createdAt: Date,
    updatedAt: Date,
    parentId: Types.ObjectId | null,
    ownerId: Types.ObjectId,
    shared?: boolean,
    sharedWith?: string,
    sharedWithTeams?: string,
    path: string,
    deleted?: boolean,
    deletedAt?: Date,
}
```

---

## 7. Relations avec autres modèles

| Modèle | Relation | Description |
|--------|----------|-------------|
| `User` | Folder.ownerId / File.ownerId → User | Le propriétaire du fichier/dossier (stocké en String, pas ObjectId) |
| `Team` | File.sharedWithTeams[] → Team | Les équipes avec lesquelles le fichier est partagé |
| `Folder` | File.parentId / Folder.parentId → Folder | Hiérarchie de dossiers (arbre) |

---

## 8. Index et contraintes

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |

Aucun index personnalisé défini. Folder et File partagent la même collection MongoDB `"File"`.

---

## 9. Exemples

### Créer un dossier avec des fichiers

```typescript
const folder = new Folder({
    name: "Documents RH",
    type: "folder",
    createdAt: new Date(),
    updatedAt: new Date(),
    parentId: null,
    ownerId: userId,
    files: [
        { name: "contrat.pdf", type: "file", size: 102400, mimeType: "application/pdf", extension: "pdf",
          createdAt: new Date(), updatedAt: new Date(), parentId: null, ownerId: userId, path: "/uploads/files/abc/123/" }
    ],
});
await folder.save(); // Sauvegarde le dossier ET ses fichiers
```

### Utiliser FileSystem (multer)

```typescript
// Upload route (via FileRoutes)
router.post("/upload", FileSystem.upload.single("file"), (req, res) => {
    // req.file contient le fichier uploadé (max 50MB, MIME filtré)
});

// Copier un fichier de test
await FileSystem.copyTestFiles("test.pdf", "/uploads/files/user1/folder1/test.pdf");

// Taille d'un fichier
const size = FileSystem.getFileSize("/uploads/files/user1/folder1/test.pdf");
// → 102400
```

### Documents MongoDB (collection `File`)

```json
// Folder
{
    "_id": "ObjectId('aaa...')",
    "name": "Documents RH",
    "type": "folder",
    "parentId": null,
    "ownerId": "user123",
    "shared": false,
    "deleted": false,
    "createdAt": "2026-03-01T10:00:00.000Z"
}

// File
{
    "_id": "ObjectId('bbb...')",
    "name": "contrat.pdf",
    "type": "file",
    "size": 102400,
    "mimeType": "application/pdf",
    "extension": "pdf",
    "path": "/uploads/files/user123/bbb/",
    "parentId": "ObjectId('aaa...')",
    "ownerId": "user123",
    "shared": false,
    "deleted": false
}
```

### Message Socket.io — lister les fichiers d'un dossier

```typescript
// Client
{ id: socketId, files_list_request: { folderId: "aaa..." } }

// Serveur
{ id: socketId, files_list_response: { files: [
    { name: "contrat.pdf", type: "file", size: 102400, mimeType: "application/pdf", ... }
]}}
```
