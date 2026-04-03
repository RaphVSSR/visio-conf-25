# ChannelForm

**Source**: `FRONTENDV2/src/components/ChannelForm/ChannelForm.tsx`

Composant de formulaire pour la création et l'édition de canaux au sein d'une équipe. Gère le nom du canal, le basculement de visibilité public/privé, et la sélection de membres pour les canaux privés.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| onChannelCreated | `(channel: any) => void` | -- | Callback en cas de création, mise à jour ou suppression réussie |
| onCancel | `() => void` | -- | Callback pour fermer le formulaire |
| channelToEdit | `any` (optional) | `{ id, name, isPublic }` | Si fourni, le formulaire passe en mode édition avec les valeurs pré-remplies |
| team | `Team` | `{ id, name }` | Équipe à laquelle le canal appartient |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| socket | `Socket` (from useAuth) | -- | Instance socket pour la communication serveur |
| user | `UserAuth` (from useAuth) | -- | Utilisateur courant, utilisé pour se filtrer de la liste des membres |
| name | `string` | `"General"` | Valeur du champ de saisie du nom du canal |
| isPublic | `boolean` | `true` | Basculement de visibilité du canal |
| isLoading | `boolean` | `false` | Soumission en cours |
| error | `string` | `""` | Message d'erreur de validation ou serveur |
| members | `Member[]` | `[{ id, firstname, ... }]` | Liste des membres de l'équipe sélectionnables |
| isEditing | `boolean` | `false` | Vrai quand channelToEdit est fourni |
| isLoadingMembers | `boolean` | `false` | Chargement des membres de l'équipe depuis le serveur |
| isDeleting | `boolean` | `false` | Suppression en cours |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| handleChannelActionResponse | data: `any` | void | Gère les réponses de création/mise à jour/suppression du serveur |
| handleTeamMemberResponse | data: `any` | void | Traite la réponse de la liste des membres de l'équipe, filtre l'utilisateur courant |
| handleChannelMemberResponse | data: `any` | void | Marque les membres existants du canal comme pré-sélectionnés |
| handleSubmit | event: `FormEvent` | void | Valide et envoie la création ou la mise à jour via socket |
| handleDeleteChannel | -- | void | Envoie l'action de suppression du canal via socket |
| handleCancel | -- | void | Appelle la prop onCancel |
| handleMemberToggle | member: `Member` | void | Bascule la sélection d'un membre individuel |
| handleSelectAll | -- | void | Sélectionne tous les membres si certains ne le sont pas, sinon désélectionne tout |

## Détails

- S'abonne aux événements socket `channel_action_response`, `team_member_response`, `channel_member_response` au montage ; se désabonne au nettoyage
- Au montage, envoie `team_member { type: "list" }` pour récupérer les membres disponibles
- En mode édition, envoie également `channel_member { type: "list" }` pour les canaux privés afin de pré-sélectionner les membres existants
- Validation : nom requis ; au moins 1 membre requis pour les canaux privés
- Utilise le sous-composant `MemberSelector` pour la sélection des membres des canaux privés

## Flux

Voir [channel-flows.md](../../flows/channel-flows.md)
