# SPECIFICATIONS FRONTEND - Gestionnaire de Fichiers (Drive)

## Vue d'ensemble

La fonctionnalité "Gestionnaire de Fichiers" permet aux utilisateurs de gérer leurs fichiers personnels et d'accéder aux fichiers partagés par leurs équipes. Elle offre une interface intuitive de type explorateur de fichiers avec des onglets pour séparer les fichiers personnels et les fichiers d'équipe, ainsi que des fonctionnalités d'upload, téléchargement, partage et organisation.

## Composants

### 1. FilesPage

**Description**: Page principale du gestionnaire de fichiers qui contient l'interface à onglets.

| Variable/Fonction | Type/Variables | Description                            |
| ----------------- | :------------: | -------------------------------------- |
| nomDInstance      |     string     | Identifiant du composant ("FilesPage") |

**Dépendances**:

-   TabbedFileExplorer (composant)

**Fonctionnalités**:

-   Affiche le titre et la description de la page
-   Contient l'explorateur de fichiers à onglets

### 2. TabbedFileExplorer

**Description**: Composant principal qui gère l'interface à onglets entre fichiers personnels et fichiers partagés.

| Variable/Fonction                     |         Type/Variables          | Description                                            |
| ------------------------------------- | :-----------------------------: | ------------------------------------------------------ |
| [activeTab, setActiveTab]             |     "personal" \| "shared"      | Onglet actif                                           |
| [selectedTeamId, setSelectedTeamId]   |             string              | ID de l'équipe sélectionnée pour les fichiers partagés |
| [files, setFiles]                     |           FileItem[]            | Liste des fichiers personnels                          |
| [sharedFiles, setSharedFiles]         |           FileItem[]            | Liste des fichiers partagés                            |
| [isLoading, setIsLoading]             |             boolean             | État de chargement des fichiers personnels             |
| [isSharedLoading, setIsSharedLoading] |             boolean             | État de chargement des fichiers partagés               |
| [error, setError]                     |         string \| null          | Message d'erreur                                       |
| [currentPath, setCurrentPath]         | { id?: string; name: string }[] | Chemin de navigation actuel                            |
| [userTeams, setUserTeams]             |             Team[]              | Liste des équipes de l'utilisateur                     |
| [isTeamsLoading, setIsTeamsLoading]   |             boolean             | État de chargement des équipes                         |
| listeMessageEmis                      |            string[]             | Messages émis vers le backend                          |
| listeMessageRecus                     |            string[]             | Messages reçus du backend                              |

**Fonctionnalités**:

-   Affiche deux onglets : "Mes Fichiers" et "Fichiers Partagés"
-   Gère le changement d'onglet et le rechargement des données
-   Sélection d'équipe pour les fichiers partagés via TeamSelector
-   Communication avec DriveService pour toutes les opérations

**Dépendances**:

-   FileExplorer (composant)
-   TeamSelector (composant)
-   AppContext (contexte)
-   FileItem, Team (types)

### 3. FileExplorer

**Description**: Composant d'exploration de fichiers avec fonctionnalités CRUD et interface complète.

| Variable/Fonction |         Type/Variables          | Description                                     |
| ----------------- | :-----------------------------: | ----------------------------------------------- |
| files             |           FileItem[]            | Liste des fichiers à afficher                   |
| currentPath       | { id?: string; name: string }[] | Chemin de navigation actuel                     |
| isLoading         |             boolean             | État de chargement                              |
| onFetchFiles      |            Function             | Callback pour récupérer les fichiers            |
| onCreateFolder    |            Function             | Callback pour créer un dossier                  |
| onUploadFile      |            Function             | Callback pour uploader un fichier               |
| onDeleteFile      |            Function             | Callback pour supprimer un fichier              |
| onRenameFile      |            Function             | Callback pour renommer un fichier               |
| onMoveFile        |            Function             | Callback pour déplacer un fichier               |
| onNavigate        |            Function             | Callback pour naviguer                          |
| onNavigateToPath  |            Function             | Callback pour navigation directe dans le chemin |
| userTeams         |             Team[]              | Équipes de l'utilisateur pour partage           |
| onShareToTeam     |            Function             | Callback pour partager avec une équipe          |
| showUploadActions |             boolean             | Affichage des actions d'upload                  |
| isSharedView      |             boolean             | Indique si c'est la vue fichiers partagés       |

**Fonctionnalités**:

-   Interface complète avec recherche, tri et filtres
-   Navigation en fil d'Ariane (breadcrumb)
-   Modes d'affichage grille et liste
-   Modals pour toutes les opérations CRUD
-   Gestion des sélections multiples
-   Tri par nom, date, taille

**Dépendances**:

-   FileList (composant)
-   CreateFolderModal, RenameModal, DeleteModal, MoveFileModal, TeamShareModal (modals)
-   AppContext (contexte)
-   FileItem, Team (types)

### 4. FileItem

**Description**: Composant représentant un fichier ou dossier individuel.

| Variable/Fonction         | Type/Variables | Description                |
| ------------------------- | :------------: | -------------------------- |
| file                      |      File      | Données du fichier/dossier |
| [isHovered, setIsHovered] |    boolean     | État de survol             |

**Fonctionnalités**:

-   Affiche l'icône appropriée selon le type de fichier
-   Affiche les métadonnées (nom, taille, date de modification)
-   Gestion de la sélection et du survol
-   Menu contextuel avec actions disponibles
-   Prévisualisation disponible pour les images

### 5. ShareToTeamModal

**Description**: Modal pour partager des fichiers avec une équipe.

| Variable/Fonction                   | Type/Variables | Description                      |
| ----------------------------------- | :------------: | -------------------------------- |
| isOpen                              |    boolean     | État d'ouverture du modal        |
| onCloseModal                        |    Function    | Callback de fermeture            |
| fileId                              |     string     | ID du fichier à partager         |
| onShareToTeam                       |    Function    | Callback de fin de partage       |
| [availableTeams, setAvailableTeams] |     Team[]     | Équipes disponibles pour partage |
| [selectedTeam, setSelectedTeam]     |     string     | Équipe sélectionnée              |

**Fonctionnalités**:

-   Liste des équipes dont l'utilisateur est membre
-   Sélection de l'équipe de destination
-   Confirmation de partage
-   Notification de succès/échec

**Dépendances**:

-   TeamSelector (composant)
-   Share, X (icônes lucide-react)

## Messages échangés

### Messages émis

| Message                    | Format                                  | Exemple de contenu                                 | Émetteur           | Récepteur    |
| -------------------------- | --------------------------------------- | -------------------------------------------------- | ------------------ | ------------ |
| files_list_request         | { folderId?: string }                   | { folderId: "f1" }                                 | TabbedFileExplorer | DriveService |
| folders_list_request       | { excludeFolderId?: string }            | { excludeFolderId: "f2" }                          | FileMoveModal      | DriveService |
| file_delete_request        | { fileId: string }                      | { fileId: "file123" }                              | FileExplorer       | DriveService |
| file_rename_request        | { fileId: string, newName: string }     | { fileId: "file123", newName: "nouveau_nom.pdf" }  | FileItem           | DriveService |
| file_move_request          | { fileId: string, newParentId: string } | { fileId: "file123", newParentId: "folder456" }    | FileMoveModal      | DriveService |
| file_share_to_team_request | { fileId: string, teamId: string }      | { fileId: "file123", teamId: "team789" }           | ShareToTeamModal   | DriveService |
| folder_create_request      | { name: string, parentId?: string }     | { name: "Nouveau Dossier", parentId: "folder456" } | FileExplorer       | DriveService |
| file_download_request      | { fileId: string }                      | { fileId: "file123" }                              | FileItem           | DriveService |

### Messages reçus

| Message                     | Format                                                                                        | Exemple de contenu                                                                                                | Émetteur     | Récepteur          |
| --------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------ | ------------------ |
| files_list_response         | { etat: boolean, files?: File[], error?: string }                                             | { etat: true, files: [{ id: "f1", name: "document.pdf", size: 1024, type: "pdf" }] }                              | DriveService | TabbedFileExplorer |
| folders_list_response       | { etat: boolean, folders?: Folder[], error?: string }                                         | { etat: true, folders: [{ id: "folder1", name: "Documents", parentId: null }] }                                   | DriveService | FileMoveModal      |
| file_delete_response        | { etat: boolean, fileId?: string, error?: string }                                            | { etat: true, fileId: "file123" }                                                                                 | DriveService | FileExplorer       |
| file_rename_response        | { etat: boolean, error?: string }                                                             | { etat: true }                                                                                                    | DriveService | FileItem           |
| file_move_response          | { etat: boolean, fileId?: string, newParentId?: string, error?: string }                      | { etat: true, fileId: "file123", newParentId: "folder456" }                                                       | DriveService | FileMoveModal      |
| file_share_to_team_response | { etat: boolean, fileId?: string, teamId?: string, error?: string }                           | { etat: true, fileId: "file123", teamId: "team789" }                                                              | DriveService | ShareToTeamModal   |
| folder_create_response      | { etat: boolean, error?: string }                                                             | { etat: true }                                                                                                    | DriveService | FileExplorer       |
| file_download_response      | { etat: boolean, downloadUrl?: string, fileName?: string, mimeType?: string, error?: string } | { etat: true, downloadUrl: "/api/files/download/file123", fileName: "document.pdf", mimeType: "application/pdf" } | DriveService | FileItem           |

## Fonctionnalités principales

### Gestion des fichiers

-   **Upload**: Drag & drop ou sélection manuelle, avec barre de progression
-   **Téléchargement**: Direct via URL générée par le backend
-   **Suppression**: Soft delete avec confirmation
-   **Renommage**: Edition en place du nom de fichier
-   **Déplacement**: Via modal avec arborescence de destination
-   **Partage**: Partage avec les équipes dont l'utilisateur est membre

### Organisation

-   **Dossiers**: Création, navigation hiérarchique, fil d'Ariane
-   **Vue**: Grille ou liste avec tri par nom, date, taille
-   **Recherche**: Filtrage en temps réel par nom de fichier

## Sécurité et permissions

### Fichiers personnels

-   Accès exclusif au propriétaire
-   Upload dans répertoire utilisateur isolé
-   Partage contrôlé vers les équipes

### Fichiers d'équipe

-   Accès selon l'appartenance aux équipes

### Validation

-   Vérification des types de fichiers
-   Limite de taille par fichier
-   Quota d'espace par utilisateur (configurable)

## Intégration avec d'autres services

### DriveService

-   Communication via WebSocket pour toutes les opérations CRUD
-   Gestion du stockage physique sur le serveur

### TeamsService

-   Récupération des équipes pour le partage
-   Vérification des permissions d'équipe
