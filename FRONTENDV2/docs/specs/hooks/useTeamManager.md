# useTeamManager

**Source**: `FRONTENDV2/src/hooks/useTeamManager.ts`

Hook de gestion d'état pour les équipes. Gère la sélection, la création, l'édition, la suppression et l'état de l'interface de gestion des membres. Découple la logique d'état des équipes des composants de page. Ne prend aucun paramètre.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `teams` | `Team[]` | `[{ id: "1", name: "Dev" }]` | Liste courante des équipes |
| `selectedTeam` | `Team \| null` | `{ id: "1", name: "Dev" }` | Équipe actuellement sélectionnée |
| `teamFormMode` | `"create" \| "edit" \| null` | `"edit"` | Mode de formulaire actif |
| `managingMembersTeamId` | `string \| null` | `"abc123"` | ID de l'équipe actuellement en vue de gestion des membres |

## Méthodes / Actions / Valeurs retournées

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `handleTeamSelect` | `team: Team` | `void` | Sélectionne l'équipe, ferme le formulaire et la gestion des membres |
| `handleCreateTeam` | — | `void` | Ouvre le formulaire en mode création, ferme la gestion des membres |
| `handleEditTeam` | `team: Team` | `void` | Sélectionne l'équipe, ouvre le formulaire en mode édition, ferme la gestion des membres |
| `handleManageMembers` | `teamId: string` | `void` | Ouvre la gestion des membres pour l'équipe donnée, ferme le formulaire |
| `handleTeamCreated` | `team: Team` | `void` | Ajoute l'équipe à la liste, la sélectionne, ferme le formulaire |
| `handleTeamUpdated` | `team: Team` | `void` | Met à jour l'équipe dans la liste par `id`, met à jour la sélection si même équipe, ferme le formulaire |
| `handleTeamDeleted` | `teamId: string` | `void` | Supprime l'équipe de la liste, efface la sélection si l'équipe supprimée était sélectionnée, ferme le formulaire et la gestion des membres |
| `handleCancelTeamForm` | — | `void` | Ferme le formulaire |
| `handleCancelManageMembers` | — | `void` | Ferme la gestion des membres |
| `updateTeamsFromResponse` | `teams: Team[]` | `void` | Remplace la liste complète des équipes, préserve la sélection si l'équipe existe toujours |
| `selectFirstAvailableTeam` | — | `void` | Sélectionne `teams[0]` ou `null` si vide |

## Flux

Voir [team-flows.md](../../flows/team-flows.md)
