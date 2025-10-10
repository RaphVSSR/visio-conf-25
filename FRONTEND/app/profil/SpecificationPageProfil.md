# SPECIFICATIONS FRONTEND - Page de Profil VisioConf

## Vue d'ensemble

La page de profil de VisioConf permet à l'utilisateur de visualiser et modifier ses informations personnelles. Elle offre la possibilité de changer sa photo de profil via un système d'upload sécurisé avec AWS S3, et affiche toutes les informations du compte utilisateur de manière claire et organisée.

## Composants

### 1. ProfilPage

**Description**: Page principale de profil permettant la visualisation et la modification des informations utilisateur avec upload de photo de profil.

| Variable/Fonction               | Type/Variables | Description                                                       |
| ------------------------------- | :------------: | ----------------------------------------------------------------- |
| nomDInstance                    |     string     | Identifiant du composant ("ProfilPage")                           |
| verbose                         |    boolean     | Contrôle l'affichage des logs du composant                        |
| listeMessageEmis                |    string[]    | Messages émis: ["upload_request", "update_user_request"]          |
| listeMessageRecus               |    string[]    | Messages reçus: ["upload_response", "update_user_response"]       |
| fileInputRef                    |   RefObject    | Référence vers l'input file caché pour l'upload de photo          |
| [selectedFile, setSelectedFile] |   File\|null   | Fichier sélectionné pour l'upload                                 |
| pendingFileRef                  |   RefObject    | Référence vers le fichier en cours d'upload                       |
| [isUploading, setIsUploading]   |    boolean     | État de chargement pendant l'upload                               |
| [uploadError, setUploadError]   |  string\|null  | Message d'erreur d'upload à afficher                              |
| pathname                        |     string     | Chemin actuel de la page (pour la gestion des effets)             |
| MAX_FILE_SIZE                   |     number     | Taille maximale autorisée pour l'upload (10MB)                    |
| handler                         |     object     | Gestionnaire de messages pour la communication avec le contrôleur |
| handler.traitementMessage(msg)  |    Function    | Traite tous les messages reçus du contrôleur                      |
| formatDate(dateValue)           |    Function    | Formate les dates avec gestion d'erreur et format français        |
| handleEditPhotoClick()          |    Function    | Déclenche l'ouverture du sélecteur de fichier                     |
| handleFileChange(e)             |    Function    | Gère la sélection d'un nouveau fichier                            |
| uploadFile(file)                |    Function    | Lance le processus d'upload d'une photo de profil                 |
| filteredRoles                   |    string[]    | Liste des rôles utilisateur filtrés (supprime les valeurs vides)  |

**Dépendances**:

- AppContext (contexte de l'application)
- lucide-react (icônes ImageDown, Loader2)
- next/navigation (usePathname)
- Types: User

**Cycle de vie**:

1. S'inscrit auprès du contrôleur pour les messages d'upload et de mise à jour utilisateur
2. Réinitialise l'état lors des changements d'utilisateur
3. Gère la désinscription/réinscription lors des changements de contexte
4. Se désinscrit du contrôleur lors du démontage

## Sections de la page

### 1. En-tête de profil

**Fonctionnalités**:

- Titre "MON PROFIL"
- Gestion de l'état de chargement si l'utilisateur n'est pas disponible

### 2. Carte de profil

**Fonctionnalités**:

- Photo de profil avec fallback vers image par défaut
- Bouton d'édition de photo avec animation de chargement
- Nom et prénom de l'utilisateur
- Description personnelle
- Gestion des erreurs d'upload avec messages explicites

**Photo de profil**:

- Source: AWS S3 (https://visioconfbucket.s3.eu-north-1.amazonaws.com/)
- Fallback: /images/default_profile_picture.png
- Gestion d'erreur de chargement d'image
- Bouton d'édition avec icône ImageDown ou spinner Loader2

### 3. Informations détaillées

**Grille d'informations**:

| Champ              | Source                      | Format/Affichage                    |
| ------------------ | --------------------------- | ----------------------------------- |
| Nom                | currentUser.lastname        | Texte brut ou "Non renseigné"       |
| Prénom             | currentUser.firstname       | Texte brut ou "Non renseigné"       |
| Compte créé        | currentUser.date_create     | Format français avec formatDate()   |
| Dernière connexion | currentUser.last_connection | Format français avec formatDate()   |
| Email              | currentUser.email           | Texte brut ou "Email non renseigné" |
| Rôles              | currentUser.roles           | Liste filtrée jointe par virgules   |

## Gestion des uploads

### 1. Processus d'upload

**Étapes**:

1. Sélection du fichier via input file caché
2. Validation de la taille (max 10MB)
3. Sauvegarde du fichier dans pendingFileRef
4. Envoi de la demande d'URL signée au backend
5. Réception de l'URL signée
6. Upload direct vers AWS S3
7. Mise à jour du profil utilisateur avec le nouveau nom de fichier

**Gestion d'erreurs**:

- Fichier trop volumineux (> 10MB)
- Échec de génération d'URL signée
- Échec d'upload vers S3
- Échec de mise à jour du profil
- Utilisateur non connecté

### 2. Format des requêtes

**Upload request**:

```typescript
{
  upload_request: {
    media: {
      name: string,     // Nom du fichier
      fileType: string  // Type MIME du fichier
    }
  }
}
```

**Update user request**:

```typescript
{
  update_user_request: {
    id: string,      // ID de l'utilisateur
    picture: string  // Nom du fichier uploadé
  }
}
```

## Messages échangés

### Messages émis

| Message             | Format                          | Exemple de contenu                                        | Émetteur   | Récepteur              |
| ------------------- | ------------------------------- | --------------------------------------------------------- | ---------- | ---------------------- |
| update_user_request | { id: string, picture: string } | { id: "user123", picture: "uploads/photo-timestamp.jpg" } | ProfilPage | UsersService (backend) |

### Messages reçus

| Message              | Format                                                     | Exemple de contenu                                                                | Émetteur               | Récepteur  |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------- | ---------- |
| update_user_response | { etat: boolean, newUserInfo: User\|null, error?: string } | { etat: true, newUserInfo: { id: "123", picture: "uploads/photo-123.jpg", ... } } | UsersService (backend) | ProfilPage |
