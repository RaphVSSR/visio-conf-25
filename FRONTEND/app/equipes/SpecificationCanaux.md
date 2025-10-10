# SPECIFICATIONS FRONTEND - Canaux de Communication

## Vue d'ensemble

Les "Canaux de Communication" constituent le cœur de la collaboration au sein des équipes VisioConf. Ils permettent aux membres d'une équipe de communiquer de manière organisée via des canaux thématiques, avec un système de posts et de réponses en mode thread. Cette fonctionnalité offre une alternative structurée à la messagerie instantanée classique.

## Composants

### 1. ChannelView

**Description**: Vue principale d'un canal affichant les posts et permettant l'interaction.

| Variable/Fonction                   |     Type/Variables      | Description                              |
| ----------------------------------- | :---------------------: | ---------------------------------------- |
| channel                             |         Channel         | Canal affiché                            |
| userId                              |         string          | ID de l'utilisateur connecté             |
| onEditChannel                       |        Function         | Callback pour éditer le canal            |
| onChannelDeleted                    |        Function         | Callback pour suppression du canal       |
| [posts, setPosts]                   |          any[]          | Liste des posts du canal                 |
| [members, setMembers]               |          any[]          | Liste des membres du canal               |
| [newPostContent, setNewPostContent] |         string          | Contenu du nouveau post                  |
| [isLoading, setIsLoading]           |         boolean         | État de chargement des posts             |
| [showMembers, setShowMembers]       |         boolean         | Affichage de la liste des membres        |
| [expandedPosts, setExpandedPosts]   | Record<string, boolean> | État d'expansion des posts               |
| nomDInstance                        |         string          | Identifiant du composant ("ChannelView") |
| verbose                             |         boolean         | Contrôle l'affichage des logs            |
| listeMessageEmis                    |        string[]         | Messages émis vers le backend            |

**Fonctionnalités**:

-   Affichage de l'en-tête du canal avec nom et icône
-   Liste des posts avec gestion des réponses
-   Interface de création de nouveaux posts
-   Gestion des membres du canal
-   Actions d'administration (édition, suppression)
-   Communication avec ChannelsService via WebSocket

### 2. ChannelTabs

**Description**: Composant d'onglets pour afficher et naviguer entre les canaux d'une équipe.

| Variable/Fonction                   | Type/Variables | Description                           |
| ----------------------------------- | :------------: | ------------------------------------- |
| channels                            |   Channel[]    | Liste des canaux de l'équipe          |
| selectedChannel                     |    Channel     | Canal actuellement sélectionné        |
| onSelectChannel                     |    Function    | Callback de sélection de canal        |
| onCreateChannel                     |    Function    | Callback de création de canal         |
| onChannelDeleted                    |    Function    | Callback de suppression de canal      |
| [canScrollLeft, setCanScrollLeft]   |    boolean     | Possibilité de défiler vers la gauche |
| [canScrollRight, setCanScrollRight] |    boolean     | Possibilité de défiler vers la droite |

**Fonctionnalités**:

-   Affichage des canaux sous forme d'onglets défilables
-   Tri automatique des canaux par nom
-   Navigation par défilement horizontal avec boutons
-   Indicateur visuel pour le canal actif
-   Bouton de création de nouveau canal
-   Icônes différenciées (Hash pour public, Lock pour privé)

**Dépendances**:

-   Channel (type)
-   AppContext (contexte)

### 3. PostItem

**Description**: Composant individuel représentant un post avec ses réponses et interactions.

| Variable/Fonction                 | Type/Variables | Description                                 |
| --------------------------------- | :------------: | ------------------------------------------- |
| post                              |      any       | Données du post avec auteur et réponses     |
| currentUserId                     |     string     | ID de l'utilisateur connecté                |
| onToggleResponses                 |    Function    | Callback pour afficher/masquer les réponses |
| isExpanded                        |    boolean     | État d'expansion des réponses               |
| onAddResponse                     |    Function    | Callback pour ajouter une réponse           |
| isAdmin                           |    boolean     | Indique si l'utilisateur est admin          |
| [showReplyForm, setShowReplyForm] |    boolean     | Affichage du formulaire de réponse          |
| [replyContent, setReplyContent]   |     string     | Contenu de la réponse en cours              |
| [responses, setResponses]         |     any[]      | Réponses locales synchronisées              |
| [responseCount, setResponseCount] |     number     | Nombre de réponses                          |

**Fonctionnalités**:

-   Affichage du contenu du post avec formatage de base
-   Informations sur l'auteur avec avatar et nom
-   Gestion des réponses en mode thread
-   Formulaire de réponse intégré avec textarea
-   Identification visuelle de l'auteur du post

**Dépendances**:

-   PostResponseItem (composant)
-   getProfilePictureUrl (utilitaire)

### 4. PostResponseItem

**Description**: Composant représentant une réponse individuelle à un post.

| Variable/Fonction | Type/Variables | Description                        |
| ----------------- | :------------: | ---------------------------------- |
| response          |      any       | Données de la réponse              |
| currentUserId     |     string     | ID de l'utilisateur connecté       |
| isAdmin           |    boolean     | Indique si l'utilisateur est admin |

**Fonctionnalités**:

-   Affichage du contenu de la réponse
-   Informations sur l'auteur de la réponse
-   Timestamp de création
-   Design indenté pour différencier des posts principaux

**Dépendances**:

-   getProfilePictureUrl (utilitaire)

### 5. ChannelForm

**Description**: Formulaire de création et d'édition de canaux.

| Variable/Fonction | Type/Variables | Description                         |
| ----------------- | :------------: | ----------------------------------- |
| isOpen            |    boolean     | État d'ouverture du modal           |
| onClose           |    Function    | Callback de fermeture               |
| teamId            |     string     | ID de l'équipe parente              |
| channelToEdit     |    Channel     | Canal à éditer (null pour création) |
| onChannelCreated  |    Function    | Callback après création/édition     |

**Fonctionnalités**:

-   Mode création ou édition selon le contexte
-   Validation du nom de canal
-   Interface modal avec formulaire
-   Gestion des erreurs et feedback utilisateur

**Dépendances**:

-   Modal (composant)
-   Channel (type)

### 5. ChannelForm

**Description**: Formulaire de création et d'édition de canaux.

| Variable/Fonction | Type/Variables | Description                         |
| ----------------- | :------------: | ----------------------------------- |
| isOpen            |    boolean     | État d'ouverture du modal           |
| onClose           |    Function    | Callback de fermeture               |
| teamId            |     string     | ID de l'équipe parente              |
| channelToEdit     |    Channel     | Canal à éditer (null pour création) |
| onChannelCreated  |    Function    | Callback après création/édition     |

**Fonctionnalités**:

-   Mode création ou édition selon le contexte
-   Validation du nom de canal
-   Interface modal avec formulaire
-   Gestion des erreurs et feedback utilisateur

**Dépendances**:

-   Modal (composant)
-   Channel (type)

## Messages échangés

### Messages émis

| Message                              | Format                                 | Exemple de contenu                               | Émetteur    | Récepteur       |
| ------------------------------------ | -------------------------------------- | ------------------------------------------------ | ----------- | --------------- |
| channel_posts_request                | { channelId: string }                  | { channelId: "c1" }                              | ChannelView | ChannelsService |
| channel_post_create_request          | { channelId: string, content: string } | { channelId: "c1", content: "Bonjour équipe !" } | ChannelView | ChannelsService |
| channel_post_response_create_request | { postId: string, content: string }    | { postId: "p1", content: "Je suis d'accord" }    | ChannelView | ChannelsService |
| channel_members_request              | { channelId: string }                  | { channelId: "c1" }                              | ChannelView | ChannelsService |
| channel_delete_request               | { channelId: string }                  | { channelId: "c1" }                              | ChannelView | ChannelsService |

## Hooks personnalisé

### useTeamManager

### useChannelManager

**Description**: Hook pour gérer l'état et les opérations des canaux.

| Variable/Fonction      | Description                  |
| ---------------------- | ---------------------------- |
| channels               | Liste des canaux             |
| selectedChannel        | Canal sélectionné            |
| posts                  | Posts du canal actuel        |
| isLoading              | État de chargement           |
| selectChannel(channel) | Sélectionner un canal        |
| createChannel(data)    | Créer un nouveau canal       |
| loadPosts(channelId)   | Charger les posts d'un canal |
| createPost(content)    | Créer un nouveau post        |

## Fonctionnalités principales

### Communication en temps réel

-   **Posts et réponses** : Système de communication par threads
-   **Interface simple** : Champ de saisie avec bouton d'envoi
-   **Réponses intégrées** : Système de réponses directement dans le post
-   **Gestion des membres** : Affichage et gestion des membres du canal

### Interface utilisateur

-   **Navigation par onglets** : Défilement horizontal entre canaux
-   **Posts chronologiques** : Affichage des posts par ordre de création
-   **Responsive** : Adaptation mobile et desktop
-   **États de chargement** : Feedback visuel pendant les opérations

### Gestion des canaux

-   **Création/Édition** : Formulaires modaux pour gérer les canaux
-   **Permissions** : Contrôle d'accès selon les rôles
-   **Suppression** : Suppression avec confirmation
-   **Administration** : Actions réservées aux administrateurs
