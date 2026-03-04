# Documentation de la classe ChannelsService

## Vue d'ensemble

La classe `ChannelsService` est responsable de la gestion des canaux de communication dans l'application Visioconf. Elle permet aux utilisateurs de créer, gérer des canaux au sein des équipes, ainsi que de publier et répondre aux messages dans ces canaux. Elle utilise un modèle de communication basé sur des messages pour interagir avec d'autres composants du système.

## Architecture

`ChannelsService` s'inscrit dans une architecture orientée messages où il communique via un contrôleur central. Il gère les canaux qui appartiennent aux équipes.

## Propriétés

| Propriété               | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `controleur`            | Référence au contrôleur central qui gère les messages    |
| `nomDInstance`          | Identifiant unique de l'instance du service              |
| `verbose`               | Flag pour l'affichage des logs de débogage               |
| `listeDesMessagesEmis`  | Liste des types de messages que le service peut émettre  |
| `listeDesMessagesRecus` | Liste des types de messages que le service peut recevoir |

## Messages gérés

### Messages reçus

| Message                                | Format                                                       | Exemple de contenu                                                                    | Émetteur                |
| -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ----------------------- |
| `channels_list_request`                | `{ teamId: string }`                                         | `{ teamId: "t1" }`                                                                    | ChannelTabs (frontend)  |
| `channel_create_request`               | `{ teamId: string, name: string, description?: string }`     | `{ teamId: "t1", name: "développement", description: "Canal pour les développeurs" }` | ChannelForm (frontend)  |
| `channel_update_request`               | `{ channelId: string, name?: string, description?: string }` | `{ channelId: "c1", name: "dev-frontend" }`                                           | ChannelForm (frontend)  |
| `channel_delete_request`               | `{ channelId: string }`                                      | `{ channelId: "c1" }`                                                                 | ChannelView (frontend)  |
| `channel_leave_request`                | `{ channelId: string }`                                      | `{ channelId: "c1" }`                                                                 | ChannelView (frontend)  |
| `channel_members_request`              | `{ channelId: string }`                                      | `{ channelId: "c1" }`                                                                 | ChannelView (frontend)  |
| `channel_add_member_request`           | `{ channelId: string, userId: string }`                      | `{ channelId: "c1", userId: "u2" }`                                                   | MembersList (frontend)  |
| `channel_remove_member_request`        | `{ channelId: string, userId: string }`                      | `{ channelId: "c1", userId: "u2" }`                                                   | MembersList (frontend)  |
| `channel_posts_request`                | `{ channelId: string, limit?: number, offset?: number }`     | `{ channelId: "c1", limit: 20, offset: 0 }`                                           | ChannelView (frontend)  |
| `channel_post_create_request`          | `{ channelId: string, content: string }`                     | `{ channelId: "c1", content: "Bonjour tout le monde !" }`                             | PostForm (frontend)     |
| `channel_post_response_create_request` | `{ postId: string, content: string }`                        | `{ postId: "p1", content: "Je suis d'accord avec toi" }`                              | ResponseForm (frontend) |

### Messages émis

| Message                                 | Format                                                                   | Exemple de contenu                                                                                                | Récepteur               |
| --------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `channels_list_response`                | `{ etat: boolean, channels?: Channel[], error?: string }`                | `{ etat: true, channels: [{ id: "c1", name: "général", description: "Canal principal", memberCount: 10 }] }`      | ChannelTabs (frontend)  |
| `channel_create_response`               | `{ etat: boolean, channel?: Channel, error?: string }`                   | `{ etat: true, channel: { id: "c1", name: "développement", description: "..." } }`                                | ChannelForm (frontend)  |
| `channel_update_response`               | `{ etat: boolean, channel?: Channel, error?: string }`                   | `{ etat: true, channel: { id: "c1", name: "dev-frontend" } }`                                                     | ChannelForm (frontend)  |
| `channel_delete_response`               | `{ etat: boolean, channelId?: string, error?: string }`                  | `{ etat: true, channelId: "c1" }`                                                                                 | ChannelView (frontend)  |
| `channel_leave_response`                | `{ etat: boolean, channelId?: string, error?: string }`                  | `{ etat: true, channelId: "c1" }`                                                                                 | ChannelView (frontend)  |
| `channel_members_response`              | `{ etat: boolean, members?: ChannelMember[], error?: string }`           | `{ etat: true, members: [{ userId: "u1", firstname: "John", role: "admin" }] }`                                   | ChannelView (frontend)  |
| `channel_add_member_response`           | `{ etat: boolean, member?: ChannelMember, error?: string }`              | `{ etat: true, member: { userId: "u2", firstname: "Jane", role: "member" } }`                                     | MembersList (frontend)  |
| `channel_remove_member_response`        | `{ etat: boolean, userId?: string, channelId?: string, error?: string }` | `{ etat: true, userId: "u2", channelId: "c1" }`                                                                   | MembersList (frontend)  |
| `channel_posts_response`                | `{ etat: boolean, posts?: ChannelPost[], error?: string }`               | `{ etat: true, posts: [{ id: "p1", content: "Hello", author: "John", createdAt: "2023-01-01", responses: [] }] }` | ChannelView (frontend)  |
| `channel_post_create_response`          | `{ etat: boolean, post?: ChannelPost, error?: string }`                  | `{ etat: true, post: { id: "p1", content: "Hello", author: "John", createdAt: "2023-01-01" } }`                   | PostForm (frontend)     |
| `channel_post_response_create_response` | `{ etat: boolean, response?: ChannelPostResponse, error?: string }`      | `{ etat: true, response: { id: "r1", content: "D'accord", author: "Jane", createdAt: "2023-01-01" } }`            | ResponseForm (frontend) |

## Méthodes

### `constructor(controleur, nom)`

Initialise le service et l'inscrit auprès du contrôleur.

**Paramètres:**

-   `controleur`: Le contrôleur central
-   `nom`: Le nom d'instance du service

### `traitementMessage(mesg)`

Point d'entrée principal pour le traitement des messages reçus. Cette méthode agit comme un routeur qui délègue le traitement aux méthodes spécialisées.

**Paramètres:**

-   `mesg`: Le message à traiter

**Fonctionnement:**

1. Identifie le type de message en vérifiant la présence de propriétés spécifiques
2. Délègue le traitement à la méthode spécialisée correspondante

### `handleChannelsList(mesg)`

Récupère la liste des canaux d'une équipe auxquels l'utilisateur a accès.

**Paramètres:**

-   `mesg`: Le message contenant l'ID de l'équipe

**Fonctionnement:**

1. Vérifie que l'utilisateur est membre de l'équipe
2. Récupère tous les canaux de l'équipe où l'utilisateur est membre
3. Inclut les informations de base et le nombre de membres
4. Répond avec `channels_list_response`

### `handleChannelCreate(mesg)`

Crée un nouveau canal dans une équipe.

**Paramètres:**

-   `mesg`: Le message contenant les données de création du canal

**Fonctionnement:**

1. Vérifie que l'utilisateur est membre de l'équipe
2. Valide que le nom du canal est unique dans l'équipe
3. Crée le canal en base de données
4. Ajoute automatiquement l'utilisateur créateur comme membre administrateur
5. Répond avec `channel_create_response`

### `handleChannelUpdate(mesg)`

Met à jour les informations d'un canal existant.

**Paramètres:**

-   `mesg`: Le message contenant les données de mise à jour

**Fonctionnement:**

1. Vérifie que l'utilisateur est administrateur du canal
2. Met à jour les champs autorisés (nom, description)
3. Répond avec `channel_update_response`

### `handleChannelDelete(mesg)`

Supprime un canal et tous ses posts associés.

**Paramètres:**

-   `mesg`: Le message contenant l'ID du canal à supprimer

**Fonctionnement:**

1. Vérifie que l'utilisateur est administrateur du canal
2. Empêche la suppression du canal "général"
3. Supprime tous les posts et réponses du canal
4. Supprime tous les membres du canal
5. Supprime le canal lui-même
6. Répond avec `channel_delete_response`

### `handleChannelLeave(mesg)`

Permet à un utilisateur de quitter un canal.

**Paramètres:**

-   `mesg`: Le message contenant l'ID du canal à quitter

**Fonctionnement:**

1. Vérifie que l'utilisateur est membre du canal
2. Empêche de quitter le canal "général"
3. Supprime l'adhésion de l'utilisateur
4. Répond avec `channel_leave_response`

### `handleChannelMembers(mesg)`

Récupère la liste des membres d'un canal.

**Paramètres:**

-   `mesg`: Le message contenant l'ID du canal

**Fonctionnement:**

1. Vérifie que l'utilisateur est membre du canal
2. Récupère tous les membres avec leurs informations de profil
3. Inclut les rôles et dates d'adhésion
4. Répond avec `channel_members_response`

### `handleChannelAddMember(mesg)`

Ajoute un membre de l'équipe à un canal.

**Paramètres:**

-   `mesg`: Le message contenant l'ID du canal et l'ID de l'utilisateur

**Fonctionnement:**

1. Vérifie que l'utilisateur connecté est administrateur du canal
2. Vérifie que l'utilisateur cible est membre de l'équipe
3. Vérifie que l'utilisateur cible n'est pas déjà membre du canal
4. Ajoute l'utilisateur au canal
5. Répond avec `channel_add_member_response`

### `handleChannelRemoveMember(mesg)`

Retire un membre d'un canal.

**Paramètres:**

-   `mesg`: Le message contenant l'ID du canal et l'ID de l'utilisateur

**Fonctionnement:**

1. Vérifie que l'utilisateur connecté est administrateur du canal
2. Empêche la suppression du canal "général"
3. Supprime l'adhésion de l'utilisateur cible
4. Répond avec `channel_remove_member_response`

### `handleChannelPosts(mesg)`

Récupère les posts d'un canal avec pagination.

**Paramètres:**

-   `mesg`: Le message contenant l'ID du canal et les paramètres de pagination

**Fonctionnement:**

1. Vérifie que l'utilisateur est membre du canal
2. Récupère les posts avec leurs réponses
3. Applique la pagination (limit/offset)
4. Inclut les informations sur les auteurs
5. Répond avec `channel_posts_response`

### `handleChannelPostCreate(mesg)`

Crée un nouveau post dans un canal.

**Paramètres:**

-   `mesg`: Le message contenant l'ID du canal et le contenu du post

**Fonctionnement:**

1. Vérifie que l'utilisateur est membre du canal
2. Valide le contenu du post
3. Crée le post en base de données
4. Répond avec `channel_post_create_response`

### `handleChannelPostResponseCreate(mesg)`

Crée une réponse à un post existant.

**Paramètres:**

-   `mesg`: Le message contenant l'ID du post et le contenu de la réponse

**Fonctionnement:**

1. Vérifie que l'utilisateur est membre du canal du post
2. Valide le contenu de la réponse
3. Crée la réponse en base de données
4. Répond avec `channel_post_response_create_response`

## Modèles de données

### Channel

```javascript
{
  id: string,
  name: string,
  description?: string,
  teamId: string,
  isGeneral: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### ChannelMember

```javascript
{
  channelId: string,
  userId: string,
  role: 'admin' | 'member',
}
```

### ChannelPost

```javascript
{
  id: string,
  channelId: string,
  authorId: string,
  content: string,
  createdAt: Date,
  updatedAt: Date
}
```

### ChannelPostResponse

```javascript
{
  id: string,
  postId: string,
  authorId: string,
  content: string,
  createdAt: Date
}
```

## Sécurité

-   **Contrôle d'accès**: Seuls les membres d'un canal peuvent voir ses posts
-   **Permissions hiérarchiques**: admin > member avec permissions différenciées
-   **Protection du canal général**: Le canal "général" ne peut pas être supprimé ou quitté
-   **Validation des entrées**: Vérification de tous les paramètres reçus
-   **Isolation des équipes**: Les canaux sont isolés par équipe

## Flux de travail typiques

### Création de canal

1. **Frontend**: Envoi de `channel_create_request` avec nom et équipe
2. **ChannelsService**: Vérification des permissions et création du canal
3. **Database**: Ajout du canal et du créateur comme administrateur
4. **Response**: Confirmation avec les données du canal créé

### Publication d'un post

1. **Frontend**: Envoi de `channel_post_create_request` avec contenu
2. **ChannelsService**: Vérification que l'utilisateur est membre du canal
3. **Database**: Création du post avec timestamp et auteur
4. **Response**: Confirmation avec les données du post créé

### Récupération des posts

1. **Frontend**: Envoi de `channel_posts_request` avec pagination
2. **ChannelsService**: Vérification des permissions et récupération des posts
3. **Database**: Requête avec jointures pour récupérer auteurs et réponses
4. **Response**: Liste paginée des posts avec métadonnées

## Intégration avec d'autres services

-   **TeamsService**: Vérification de l'appartenance aux équipes
-   **UsersService**: Récupération des informations des auteurs
-   **SocketIdentificationService**: Identification de l'utilisateur connecté
-   **NotificationService**: Notifications pour nouveaux posts (futur)

## Types de canaux

### Canal Général

-   Créé automatiquement avec chaque équipe
-   Tous les membres de l'équipe en sont automatiquement membres
-   Ne peut pas être supprimé ou quitté
-   Canal principal de communication de l'équipe

### Canaux Spécialisés

-   Créés par les membres de l'équipe
-   Peuvent avoir des sujets spécifiques (développement, design, etc.)
-   Adhésion optionnelle pour les membres de l'équipe
-   Peuvent être supprimés par les administrateurs
