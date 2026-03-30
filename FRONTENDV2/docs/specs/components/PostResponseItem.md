# PostResponseItem

**Source**: `FRONTENDV2/src/components/PostResponseItem/PostResponseItem.tsx`

Affiche une réponse unique au sein d'un fil de publication. Affiche l'avatar de l'auteur, le nom, l'horodatage et le contenu. Met en surbrillance visuellement la réponse si l'utilisateur courant en est l'auteur.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| response | `any` | `{ authorId: "x", authorFirstname: "Jane", content: "Reply text", createdAt: "..." }` | Objet de données de la réponse |
| currentUserId | `string` | `"abc123"` | Utilisé pour déterminer l'auteur et afficher le badge "Vous" |
| id | `string \| undefined` | `"response-abc"` | Attribut HTML id optionnel pour le div conteneur |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| *(aucun)* | — | — | Aucun état local |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| *(aucune)* | — | — | Aucune fonction handler |

## Détails

- Ajoute la classe CSS `post-response-item--author` quand `response.authorId === currentUserId`.
- L'avatar affiche l'image si `response.authorPicture` existe, sinon les initiales depuis firstname/lastname.
- L'horodatage est formaté via l'utilitaire `formatRelativeDate`.
- Export par défaut.

## Flux

Voir [channel-flows.md](../../flows/channel-flows.md)
