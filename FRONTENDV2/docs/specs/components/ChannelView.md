# ChannelView

**Source**: `FRONTENDV2/src/components/ChannelView/ChannelView.tsx`

Vue principale du canal qui affiche les publications, un panneau de membres et un champ de saisie de message. Seul le créateur du canal peut publier de nouvelles publications ; tous les membres peuvent répondre aux publications existantes.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| channel | `Channel` | `{ id, name, isPublic, createdBy }` | Données du canal à afficher |
| userId | `string` | `"64a..."` | ID de l'utilisateur courant |
| onEditChannel | `() => void` | -- | Callback pour ouvrir le formulaire d'édition du canal (affiché uniquement au créateur du canal) |
| onChannelDeleted | `() => void` (optional) | -- | Callback quand le serveur confirme la suppression du canal |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| socket | `Socket` (from useAuth) | -- | Instance socket pour la communication serveur |
| posts | `any[]` | `[{ id, content, createdAt }]` | Publications du canal triées par createdAt croissant |
| members | `any[]` | `[{ userId, firstname }]` | Liste des membres du canal |
| newPostContent | `string` | `""` | Valeur courante du champ de saisie de message |
| isLoading | `boolean` | `true` | État de chargement pour la récupération initiale des publications/membres |
| showMembers | `boolean` | `false` | Basculement de la visibilité du panneau de membres |
| messagesEndRef | `RefObject<HTMLDivElement>` | -- | Ref pour le défilement automatique vers le dernier message |
| inputRef | `RefObject<HTMLInputElement>` | -- | Ref pour le focus automatique du champ de saisie au montage |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| handleChannelPostResponse | data: `any` | void | Gère les réponses list/publish/answer ; met à jour l'état des publications |
| handleChannelMemberResponse | data: `any` | void | Gère la réponse de la liste des membres ; met à jour l'état des membres |
| handleChannelActionResponse | data: `any` | void | Gère la réponse de suppression ; appelle onChannelDeleted en cas de succès |
| handleSubmitPost | -- | void | Envoie une nouvelle publication via socket (channel_post, type: publish) |
| handleAddResponse | postId: `string`, content: `string` | void | Envoie une réponse à une publication via socket (channel_post, type: answer) |

## Détails

- S'abonne à `channel_post_response`, `channel_member_response`, `channel_action_response` au montage ; se désabonne au nettoyage
- Au montage envoie `channel_member { type: "list" }` et `channel_post { type: "list" }` pour le channelId courant
- `isChannelCreator` dérivé de `channel.createdBy === userId` ; contrôle la visibilité du champ de saisie de publication et du bouton paramètres
- Les publications et réponses sont triées par `createdAt` croissant via le helper `sortByCreatedAtAsc`
- Défilement automatique vers le bas lors du changement des publications ; focus automatique du champ de saisie au montage
- La touche Entrée (sans Shift) soumet une nouvelle publication
- Affiche un `PostItem` pour chaque publication, en passant `onAddResponse` et `isAdmin` (= isChannelCreator)

## Flux

Voir [channel-flows.md](../../flows/channel-flows.md)
