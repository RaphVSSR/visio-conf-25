# PostItem

**Source**: `FRONTENDV2/src/components/PostItem/PostItem.tsx`

Affiche une publication unique avec les informations de l'auteur, le contenu, un formulaire de réponse en ligne et les réponses imbriquées. Le bouton de réponse est masqué pour les utilisateurs administrateurs.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| post | `any` | `{ authorId: "x", authorFirstname: "John", content: "Hello", responses: [] }` | Objet de données de la publication |
| currentUserId | `string` | `"abc123"` | ID de l'utilisateur connecté, utilisé pour le badge "Vous" |
| onAddResponse | `(content: string) => void` | — | Appelé avec le texte de réponse lors de la soumission d'une réponse |
| isAdmin | `boolean` | `false` | Quand vrai, masque le bouton de réponse |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| showReplyForm | `boolean` | `false` | Bascule la visibilité de la zone de texte de réponse |
| replyContent | `string` | `""` | Texte courant du champ de réponse |
| responses | `any[]` | `[]` | Copie locale de `post.responses`, synchronisée via useEffect |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| handleSubmitReply | — | void | Valide que le contenu est non vide, appelle `onAddResponse`, réinitialise le formulaire |
| handleReplyClick | — | void | Bascule `showReplyForm` |

## Détails

- `replyInputRef` (useRef) donne automatiquement le focus à la zone de texte quand le formulaire de réponse s'ouvre.
- Les réponses sont synchronisées depuis la prop `post.responses` via useEffect.
- La touche Entrée (sans Shift) soumet la réponse.
- Le bouton de soumission est désactivé quand `replyContent` est vide ou ne contient que des espaces.
- L'avatar de l'auteur affiche l'image si `post.authorPicture` existe, sinon les initiales.
- Les horodatages sont formatés via l'utilitaire `formatRelativeDate`.
- Chaque réponse affiche un composant enfant `PostResponseItem`.
- Export par défaut.

## Flux

Voir [channel-flows.md](../../flows/channel-flows.md)
