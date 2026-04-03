# TeamsSidebar

**Source**: `FRONTENDV2/src/components/TeamsSidebar/TeamsSidebar.tsx`

Composant de barre latérale listant les équipes de l'utilisateur avec filtrage par recherche. Affiche les noms des équipes, les badges de rôle et fournit des actions de création/édition. Affiche un bouton paramètres pour les utilisateurs administrateurs.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| teams | `Team[]` | `[{ id: "t1", name: "Dev", role: "admin" }]` | Liste des équipes à afficher |
| selectedTeam | `Team \| null` | `null` | Équipe actuellement sélectionnée, mise en surbrillance dans la liste |
| onSelectTeam | `(team: Team) => void` | — | Appelé quand un élément d'équipe est cliqué |
| onCreateTeam | `() => void` | — | Appelé quand le bouton de création est cliqué |
| onEditTeam | `(team: Team) => void` | — | Appelé quand le bouton paramètres est cliqué sur une équipe admin |
| isLoading | `boolean` | `false` | Affiche un spinner au lieu de la liste des équipes |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| searchQuery | `string` | `""` | Valeur courante du champ de recherche |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| isMember | team (`Team`) | boolean | Retourne vrai si `team.role` est "admin" ou "member" |
| isAdmin | team (`Team`) | boolean | Retourne vrai si `team.role` est "admin" |

## Détails

- `filteredTeams` calculé via `useMemo`, filtre par nom d'équipe sans sensibilité à la casse.
- Les non-membres voient une icône `Lock` et un badge "Non-membre" au lieu de l'icône `Users`.
- Les équipes admin affichent un badge "Admin" et un bouton paramètres (appelle `onEditTeam` avec `stopPropagation`).
- Utilise `framer-motion` `AnimatePresence` pour les animations d'entrée/sortie des éléments de liste.
- L'équipe sélectionnée reçoit la classe CSS `teams-sidebar__item--selected`.
- Le type `Team` est importé depuis `pages/Teams/Teams.types`.
- Export nommé.

## Flux

Voir [team-flows.md](../../flows/team-flows.md)
