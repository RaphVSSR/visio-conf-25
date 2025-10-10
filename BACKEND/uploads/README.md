# Uploads Directory Structure

Ce répertoire contient tous les fichiers uploadés par les utilisateurs de l'application.

## Structure

```
uploads/
├── README.md                        # Documentation (commitée)
├── files/
│   ├── .gitkeep                     # Préserve la structure (commitée)
│   └── [userId]/
│       └── [fileId]/
│           └── [filename]           # Fichiers utilisateurs (ignorés par git)
└── profile-pictures/
    ├── .gitkeep                     # Préserve la structure (commitée)
    ├── default_profile_picture.png  # Image par défaut (commitée)
    └── [user_uploaded_files]        # Images uploadées (ignorées par git)
```

## Configuration Git

Les fichiers sont automatiquement ignorés par git grâce aux règles dans `.gitignore` :

```gitignore
# uploaded files and profile pictures
uploads/files/*
!uploads/files/.gitkeep
uploads/profile-pictures/*
!uploads/profile-pictures/default_profile_picture.png
!uploads/profile-pictures/.gitkeep
```

### Fichiers commitées

-   `README.md` : Documentation de la structure
-   `files/.gitkeep` : Préserve la structure du dossier files
-   `profile-pictures/.gitkeep` : Préserve la structure du dossier profile-pictures
-   `profile-pictures/default_profile_picture.png` : Image de profil par défaut

### Fichiers ignorés

-   Tous les fichiers uploadés par les utilisateurs
-   Toutes les photos de profil custom

## Sécurité

-   Les fichiers uploadés ne sont jamais commitées dans le dépôt git
-   Chaque utilisateur a son propre dossier isolé
-   Les permissions d'accès sont gérées par l'API

## Backup

⚠️ **Important** : Assurez-vous de sauvegarder régulièrement le contenu de ce dossier car il n'est pas versionné dans git.

## URLs d'accès

-   **Téléchargement** : `/api/files/download/:fileId`
-   **Visualisation** : `/api/files/view/:fileId`
-   **Photos de profil** : `/api/files/profile/:filename`
