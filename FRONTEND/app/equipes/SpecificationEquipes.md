# SPECIFICATIONS FRONTEND - Équipes

## Vue d'ensemble

La fonctionnalité "Équipes" permet aux utilisateurs de créer, rejoindre et gérer des équipes collaboratives. Elle offre une interface complète pour la gestion des équipes et de leurs canaux de communication, avec des fonctionnalités d'administration, de gestion des membres et de communication via des canaux dédiés.

## Composants

### 1. EquipesPage

**Description**: Page principale de gestion des équipes qui orchestre l'affichage des équipes et de leurs canaux.

| Variable/Fonction                         | Type/Variables | Description                                                       |
| ----------------------------------------- | :------------: | ----------------------------------------------------------------- |
| nomDInstance                              |     string     | Identifiant du composant ("EquipesPage")                          |
| verbose                                   |    boolean     | Contrôle l'affichage des logs du composant                        |
| listeMessageEmis                          |    string[]    | Messages émis: ["teams_list_request", "channels_list_request"]    |
| listeMessageRecus                         |    string[]    | Messages reçus: ["teams_list_response", "channels_list_response"] |
| [isLoadingTeams, setIsLoadingTeams]       |    boolean     | État de chargement des équipes                                    |
| [isLoadingChannels, setIsLoadingChannels] |    boolean     | État de chargement des canaux                                     |
| teamManager                               |     object     | Gestionnaire des équipes (hook)                                   |
| channelManager                            |     object     | Gestionnaire des canaux (hook)                                    |
| handler                                   |     object     | Gestionnaire de messages                                          |

**Fonctionnalités**:

-   Gestion de l'état global de la page équipes
-   Coordination entre la gestion des équipes et des canaux
-   Communication avec le backend via WebSocket
-   Gestion des états de chargement

**Dépendances**:

-   TeamsList (composant)
-   ChannelView (composant)
-   ChannelForm (composant)
-   TeamForm (composant)
-   ChannelTabs (composant)
-   useTeamManager (hook)
-   useChannelManager (hook)
-   AppContext (contexte)

### 2. TeamsList

**Description**: Composant qui affiche la liste des équipes de l'utilisateur avec options de gestion.

| Variable/Fonction           | Type/Variables | Description                                 |
| --------------------------- | :------------: | ------------------------------------------- |
| teams                       |     Team[]     | Liste des équipes à afficher                |
| selectedTeam                |  Team \| null  | Équipe actuellement sélectionnée            |
| onSelectTeam                |    Function    | Callback de sélection d'équipe              |
| onCreateTeam                |    Function    | Callback de création d'équipe               |
| onEditTeam                  |    Function    | Callback d'édition d'équipe                 |
| onManageMembers             |    Function    | Callback de gestion des membres             |
| isLoading                   |    boolean     | État de chargement                          |
| [searchTerm, setSearchTerm] |     string     | Terme de recherche pour filtrer les équipes |

**Fonctionnalités**:

-   Affichage de la liste des équipes avec avatars
-   Recherche et filtrage des équipes par nom
-   Sélection d'équipe pour afficher ses canaux
-   Actions rapides (créer, éditer, gérer les membres)
-   Indicateurs visuels pour l'équipe sélectionnée
-   Affichage du rôle de l'utilisateur dans chaque équipe

**Dépendances**:

-   Team (type)
-   AppContext (contexte)
-   getTeamPictureUrl (utilitaire)

### 4. TeamForm

**Description**: Formulaire de création et d'édition d'équipes.

| Variable/Fonction               | Type/Variables | Description                          |
| ------------------------------- | :------------: | ------------------------------------ |
| team                            |      Team      | Équipe à éditer (null pour création) |
| isOpen                          |    boolean     | État d'ouverture du modal            |
| onClose                         |    Function    | Callback de fermeture                |
| onSubmit                        |    Function    | Callback de soumission               |
| [formData, setFormData]         |     object     | Données du formulaire                |
| [isSubmitting, setIsSubmitting] |    boolean     | État de soumission                   |
| [errors, setErrors]             |     object     | Erreurs de validation                |

**Champs du formulaire**:

-   name (requis) : Nom de l'équipe
-   description : Description de l'équipe
-   picture : Photo de l'équipe
-   isPublic : Équipe publique ou privée

**Fonctionnalités**:

-   Validation en temps réel des champs
-   Upload d'image pour la photo d'équipe
-   Mode création ou édition selon le contexte
-   Gestion des erreurs et feedback utilisateur
-   Sauvegarde automatique des brouillons

## Messages échangés

### Messages émis

| Message                     | Format                                                   | Exemple de contenu                                                | Émetteur        | Récepteur       |
| --------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- | --------------- | --------------- |
| teams_list_request          | { }                                                      | { }                                                               | EquipesPage     | TeamsService    |
| team_create_request         | { name: string, description?: string, picture?: string } | { name: "Équipe Dev", description: "Équipe de développement" }    | TeamForm        | TeamsService    |
| team_update_request         | { teamId: string, name?: string, description?: string }  | { teamId: "t1", name: "Équipe Dev Updated" }                      | TeamForm        | TeamsService    |
| team_delete_request         | { teamId: string }                                       | { teamId: "t1" }                                                  | TeamItem        | TeamsService    |
| team_leave_request          | { teamId: string }                                       | { teamId: "t1" }                                                  | TeamItem        | TeamsService    |
| team_members_request        | { teamId: string }                                       | { teamId: "t1" }                                                  | TeamMembersList | TeamsService    |
| team_add_member_request     | { teamId: string, userEmail: string }                    | { teamId: "t1", userEmail: "user@example.com" }                   | AddMemberForm   | TeamsService    |
| team_remove_member_request  | { teamId: string, userId: string }                       | { teamId: "t1", userId: "u2" }                                    | MemberItem      | TeamsService    |
| channels_list_request       | { teamId: string }                                       | { teamId: "t1" }                                                  | ChannelTabs     | ChannelsService |
| channel_create_request      | { teamId: string, name: string, description?: string }   | { teamId: "t1", name: "développement", description: "Canal dev" } | ChannelForm     | ChannelsService |
| channel_posts_request       | { channelId: string, limit?: number, offset?: number }   | { channelId: "c1", limit: 50, offset: 0 }                         | ChannelView     | ChannelsService |
| channel_post_create_request | { channelId: string, content: string }                   | { channelId: "c1", content: "Bonjour équipe !" }                  | PostEditor      | ChannelsService |

### Messages reçus

| Message                      | Format                                                    | Exemple de contenu                                                                               | Émetteur        | Récepteur       |
| ---------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------- | --------------- |
| teams_list_response          | { etat: boolean, teams?: Team[], error?: string }         | { etat: true, teams: [{ id: "t1", name: "Équipe Dev", memberCount: 5 }] }                        | TeamsService    | EquipesPage     |
| team_create_response         | { etat: boolean, team?: Team, error?: string }            | { etat: true, team: { id: "t1", name: "Équipe Dev" } }                                           | TeamsService    | TeamForm        |
| team_update_response         | { etat: boolean, team?: Team, error?: string }            | { etat: true, team: { id: "t1", name: "Équipe Dev Updated" } }                                   | TeamsService    | TeamForm        |
| team_delete_response         | { etat: boolean, teamId?: string, error?: string }        | { etat: true, teamId: "t1" }                                                                     | TeamsService    | TeamItem        |
| team_members_response        | { etat: boolean, members?: TeamMember[], error?: string } | { etat: true, members: [{ userId: "u1", firstname: "John", role: "admin" }] }                    | TeamsService    | TeamMembersList |
| channels_list_response       | { etat: boolean, channels?: Channel[], error?: string }   | { etat: true, channels: [{ id: "c1", name: "général", memberCount: 5 }] }                        | ChannelsService | ChannelTabs     |
| channel_create_response      | { etat: boolean, channel?: Channel, error?: string }      | { etat: true, channel: { id: "c1", name: "développement" } }                                     | ChannelsService | ChannelForm     |
| channel_posts_response       | { etat: boolean, posts?: ChannelPost[], error?: string }  | { etat: true, posts: [{ id: "p1", content: "Hello", author: "John", createdAt: "2023-01-01" }] } | ChannelsService | ChannelView     |
| channel_post_create_response | { etat: boolean, post?: ChannelPost, error?: string }     | { etat: true, post: { id: "p1", content: "Hello", author: "John" } }                             | ChannelsService | PostEditor      |

## Hooks personnalisé

### useTeamManager

**Description**: Hook pour gérer l'état et les opérations des équipes.

| Variable/Fonction    | Description                     |
| -------------------- | ------------------------------- |
| teams                | Liste des équipes               |
| selectedTeam         | Équipe sélectionnée             |
| isLoading            | État de chargement              |
| selectTeam(team)     | Sélectionner une équipe         |
| createTeam(data)     | Créer une nouvelle équipe       |
| updateTeam(id, data) | Mettre à jour une équipe        |
| deleteTeam(id)       | Supprimer une équipe            |
| refreshTeams()       | Actualiser la liste des équipes |

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

### Gestion des équipes

-   **Création**: Formulaire avec nom, description et photo
-   **Édition**: Modification des informations par les administrateurs
-   **Suppression**: Suppression complète avec confirmation
-   **Membres**: Invitation, suppression
-   **Recherche**: Filtrage en temps réel des équipes
