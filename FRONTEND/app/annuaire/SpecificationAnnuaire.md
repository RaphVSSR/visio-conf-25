# SPECIFICATIONS FRONTEND - Annuaire VisioConf

## Vue d'ensemble

La fonctionnalité "Annuaire" permet aux utilisateurs de consulter la liste de tous les utilisateurs de la plateforme VisioConf. Elle offre une interface intuitive pour visualiser les informations des utilisateurs, effectuer des recherches, et initier des conversations avec eux.

## Composants

### 1. AnnuairePage

**Description**: Page principale de l'annuaire qui affiche la liste des utilisateurs et gère la communication avec le backend.

| Variable/Fonction              | Type/Variables | Description                                                              |
| ------------------------------ | :------------: | ------------------------------------------------------------------------ |
| nomDInstance                   |     string     | Identifiant du composant ("AnnuairePage")                                |
| verbose                        |    boolean     | Contrôle l'affichage des logs du composant                               |
| listeMessageEmis               |    string[]    | Messages émis par le composant: ["users_list_request"]                   |
| listeMessageRecus              |    string[]    | Messages reçus par le composant: ["users_list_response"]                 |
| [users, setUsers]              |     User[]     | Liste des utilisateurs récupérée du backend                              |
| [isLoading, setIsLoading]      |    boolean     | État de chargement des données                                           |
| handler                        |     object     | Gestionnaire de messages pour la communication avec le contrôleur        |
| handler.traitementMessage(msg) |    Function    | Traite les messages reçus du contrôleur, notamment "users_list_response" |
| fetchUsersList()               |    Function    | Déclenche la requête pour obtenir la liste des utilisateurs              |

**Dépendances**:

-   UsersList (composant)
-   AppContext (contexte)
-   framer-motion (bibliothèque d'animation)
-   lucide-react (icônes)

**Cycle de vie**:

1. À l'initialisation, s'inscrit auprès du contrôleur pour les messages spécifiés
2. Déclenche fetchUsersList() pour récupérer la liste des utilisateurs
3. Se désinscrit du contrôleur lors du démontage du composant

### 2. UsersList

**Description**: Composant qui affiche la liste des utilisateurs avec options de recherche.

| Variable/Fonction                 | Type/Variables | Description                                                    |
| --------------------------------- | :------------: | -------------------------------------------------------------- |
| users                             |     User[]     | Liste des utilisateurs à afficher                              |
| currentUserEmail                  |     string     | Email de l'utilisateur connecté pour le filtrage               |
| isLoading                         |    boolean     | État de chargement pour afficher un indicateur                 |
| [searchTerm, setSearchTerm]       |     string     | Terme de recherche pour filtrer les utilisateurs               |
| [filteredUsers, setFilteredUsers] |     User[]     | Liste des utilisateurs filtrée selon les critères de recherche |

**Fonctionnalités**:

-   Affiche un champ de recherche pour filtrer les utilisateurs
-   Filtre automatiquement les utilisateurs en fonction du terme de recherche
-   Exclut l'utilisateur courant de la liste filtrée
-   Affiche un squelette de chargement pendant le chargement des données
-   Affiche le nombre d'utilisateurs trouvés
-   Affiche un message lorsqu'aucun utilisateur n'est trouvé
-   Affiche la liste des utilisateurs de visio-conf

**Dépendances**:

-   UserInfo (composant)
-   UserSkeleton (composant)
-   framer-motion (bibliothèque d'animation)
-   lucide-react (icônes)

### 3. UserInfo

**Description**: Composant qui affiche les informations d'un utilisateur individuel dans l'annuaire.

| Variable/Fonction         | Type/Variables | Description                                                           |
| ------------------------- | :------------: | --------------------------------------------------------------------- |
| user                      |      User      | Données de l'utilisateur à afficher                                   |
| currentUserEmail          |     string     | Email de l'utilisateur connecté pour identifier l'utilisateur courant |
| [isHovered, setIsHovered] |    boolean     | État de survol pour les effets visuels                                |
| fullName                  |     string     | Nom complet de l'utilisateur (prénom + nom)                           |
| initials                  |     string     | Initiales du nom complet (2 caractères maximum)                       |
| avatarColor               |     string     | Couleur de l'avatar générée à partir du nom complet                   |

**Fonctionnalités**:

-   Affiche un avatar avec les initiales de l'utilisateur
-   Génère une couleur d'avatar unique basée sur le nom de l'utilisateur
-   Met en évidence l'utilisateur courant
-   Affiche le nom complet, l'email et le numéro de téléphone (si disponible)
-   Affiche un bouton d'action pour envoyer un message (visible au survol)
-   Utilise des animations pour améliorer l'expérience utilisateur

**Dépendances**:

-   framer-motion (bibliothèque d'animation)
-   lucide-react (icônes)

## Messages échangés

### Messages émis

| Message            | Format | Exemple de contenu | Émetteur     | Récepteur              |
| ------------------ | ------ | ------------------ | ------------ | ---------------------- |
| users_list_request | { }    | { }                | AnnuairePage | UsersService (backend) |

### Messages reçus

| Message             | Format                                            | Exemple de contenu                                                                                                                                                                                                                                                                                      | Émetteur               | Récepteur    |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------ |
| users_list_response | { etat: boolean, users?: User[], error?: string } | { etat: true, users: [{ id: "665f2e7b8e2e4a0012c1a123", firstname: "John", lastname: "Doe", email: "john@example.com", picture: "default_profile_picture.png", status: "active", roles: ["Administrateur", "Utilisateur"], online: true, phone: "0612345678", job: "Développeur", desc: "Lead dev" }] } | UsersService (backend) | AnnuairePage |
