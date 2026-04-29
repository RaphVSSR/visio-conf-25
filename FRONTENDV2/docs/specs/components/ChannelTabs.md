# ChannelTabs

**Source**: `FRONTENDV2/src/components/ChannelTabs/ChannelTabs.tsx`

Barre d'onglets horizontale avec défilement affichant les canaux d'une équipe triés alphabétiquement. Affiche des flèches de défilement quand le contenu déborde et un bouton "+" pour créer un nouveau canal.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| channels | `Channel[]` | `[{ id, name, isPublic }]` | Liste des canaux à afficher en onglets |
| selectedChannel | `Channel \| null` | `{ id: "abc" }` | Canal actuellement actif (onglet mis en surbrillance) |
| onSelectChannel | `(channel: Channel) => void` | -- | Callback quand un onglet est cliqué |
| onCreateChannel | `() => void` | -- | Callback quand le bouton "+" est cliqué |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| canScrollLeft | `boolean` | `false` | Indique si la flèche de défilement gauche doit être visible |
| canScrollRight | `boolean` | `false` | Indique si la flèche de défilement droite doit être visible |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| updateScrollIndicators | -- | void | Lit la position de défilement du conteneur et met à jour canScrollLeft/canScrollRight |
| handleScroll | direction: `"left" \| "right"` | void | Fait défiler le conteneur de 200px dans la direction donnée avec un défilement fluide |

## Détails

- Les canaux sont triés alphabétiquement via `useMemo` avec `localeCompare`
- Utilise un `ResizeObserver` sur le conteneur de défilement pour afficher/masquer les flèches de manière réactive
- Écoute également l'événement `scroll` du conteneur pour la mise à jour de la visibilité des flèches
- `scrollContainerRef` est un `useRef<HTMLDivElement>` pour le conteneur défilable
- Les canaux publics affichent l'icône Hash, les canaux privés affichent l'icône Lock

## Flux

Voir [channel-flows.md](../../flows/channel-flows.md)
