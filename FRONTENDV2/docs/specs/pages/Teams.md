# TeamsPage

**Source**: `FRONTENDV2/src/pages/Teams/TeamsPage.tsx`

Page principale pour la gestion des équipes et des canaux. Compose une barre latérale d'équipes, des onglets de canaux, une vue de canal et des formulaires en overlay pour la création/édition d'équipes et de canaux. S'abonne aux événements socket pour les données en temps réel.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| — | — | — | Aucune prop |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| user | `User \| null` | `{ _id: "abc" }` | Depuis `useAuth()`, utilisateur courant |
| socket | `MessageClientAdapter \| null` | — | Depuis `useAuth()`, wrapper socket |
| isLoadingTeams | `boolean` | `true` | Indicateur de chargement pour la récupération de la liste des équipes |
| isLoadingChannels | `boolean` | `false` | Indicateur de chargement pour la récupération de la liste des canaux |
| teamManager | `UseTeamManager` | — | Depuis `useTeamManager()` : teams, selectedTeam, teamFormMode, handlers |
| channelManager | `UseChannelManager` | — | Depuis `useChannelManager()` : channels, selectedChannel, channelFormMode, handlers |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| handleTeamQueryResponse | data (`any`) | `void` | Traite `team_get_response` avec `type: "list"`, met à jour les équipes via le manager |
| handleChannelQueryResponse | data (`any`) | `void` | Traite `channel_get_response` avec `type: "list"`, met à jour les canaux via le manager |
| handleChannelActionResponse | data (`any`) | `void` | Sur réponse de création/mise à jour/suppression de canal, re-récupère la liste des canaux pour l'équipe sélectionnée |
| handleTeamCreatedWrapper | team (`any`) | `void` | Appelle `teamManager.handleTeamCreated` puis re-récupère la liste des équipes après un délai de 100ms |

## Détails

- Abonnements socket : `team_get_response`, `channel_get_response`, `channel_action_response` (enregistrés au montage, nettoyés au démontage).
- Au montage envoie `team_get { type: "list" }` pour charger les équipes.
- Quand `selectedTeam` change, envoie `channel_get { type: "list", teamId }` ou efface les canaux si aucune équipe sélectionnée.
- Priorité d'affichage : overlay TeamForm > overlay ChannelForm > contenu équipe avec ChannelTabs + ChannelView > état vide.
- Route : protégée par la garde `UserAuth`.

## Flux

Voir [team-flows.md](../../flows/team-flows.md)
