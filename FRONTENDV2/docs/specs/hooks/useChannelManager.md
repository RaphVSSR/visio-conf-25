# useChannelManager

**Source**: `FRONTENDV2/src/hooks/useChannelManager.ts`

Hook de gestion d'état pour les canaux au sein d'une équipe. Gère la sélection, la création, l'édition, la suppression et la réinitialisation complète. Symétrique à `useTeamManager` mais sans gestion des membres. Ne prend aucun paramètre.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `channels` | `Channel[]` | `[{ id: "1", name: "general" }]` | Liste courante des canaux |
| `selectedChannel` | `Channel \| null` | `{ id: "1", name: "general" }` | Canal actuellement sélectionné |
| `channelFormMode` | `"create" \| "edit" \| null` | `"create"` | Mode de formulaire actif |

## Méthodes / Actions / Valeurs retournées

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `handleChannelSelect` | `channel: Channel` | `void` | Sélectionne le canal, ferme le formulaire |
| `handleCreateChannel` | — | `void` | Ouvre le formulaire en mode création |
| `handleEditChannel` | `channel: Channel` | `void` | Sélectionne le canal, ouvre le formulaire en mode édition |
| `handleChannelCreated` | `channel: Channel` | `void` | Ajoute le canal à la liste, le sélectionne, ferme le formulaire |
| `handleChannelUpdated` | `channel: Channel` | `void` | Met à jour le canal dans la liste par `id`, met à jour la sélection si même canal, ferme le formulaire |
| `handleChannelDeleted` | `channelId: string` | `void` | Supprime le canal de la liste, efface la sélection si le canal supprimé était sélectionné, ferme le formulaire |
| `handleCancelChannelForm` | — | `void` | Ferme le formulaire |
| `updateChannelsFromResponse` | `channels: Channel[]` | `void` | Remplace la liste complète des canaux, préserve la sélection si le canal existe toujours |
| `selectFirstAvailableChannel` | — | `void` | Sélectionne `channels[0]` ou `null` si vide |
| `clearChannels` | — | `void` | Vide la liste des canaux, efface la sélection, ferme le formulaire |

## Flux

Voir [channel-flows.md](../../flows/channel-flows.md)
