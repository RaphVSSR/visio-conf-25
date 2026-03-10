# Référence du hook useChannelManager — VisioConf

**Fichier source** : `FRONTENDV2/src/hooks/useChannelManager.ts`
**Type** : Custom React Hook

---

## 1. Description

`useChannelManager` gère l'état des canaux au sein d'une équipe : sélection, création, édition, suppression. Symétrique à `useTeamManager` mais pour les canaux.

---

## 2. Paramètres

```typescript
interface UseChannelManagerProps {
    initialChannels: Channel[]
    onChannelsChange?: (channels: Channel[]) => void
    onChannelSelected?: (channel: Channel | null) => void
    onChannelDeleted?: () => void
}
```

---

## 3. Valeurs retournées

### State

| Propriété | Type | Description |
|-----------|------|-------------|
| `channels` | `Channel[]` | Liste des canaux |
| `selectedChannel` | `Channel \| null` | Canal sélectionné |
| `channelFormMode` | `"create" \| "edit" \| null` | Mode du formulaire |

### Actions

| Action | Paramètres | Description |
|--------|------------|-------------|
| `handleChannelSelect` | `channel: Channel` | Sélectionne un canal, ferme le formulaire |
| `handleCreateChannel` | — | Ouvre le formulaire en mode création |
| `handleEditChannel` | `channel: Channel` | Ouvre le formulaire en mode édition |
| `handleChannelCreated` | `channel: Channel` | Ajoute le canal, le sélectionne, ferme le formulaire |
| `handleChannelUpdated` | `channel: Channel` | Met à jour le canal dans la liste |
| `handleChannelDeleted` | `channelId: string` | Retire le canal de la liste |
| `handleCancelChannelForm` | — | Ferme le formulaire |
| `updateChannelsFromResponse` | `channels: Channel[]` | Met à jour en bulk depuis la réponse API |
| `selectFirstAvailableChannel` | — | Sélectionne le premier canal disponible |
| `clearChannels` | — | Vide la liste et la sélection |

---

## 4. Composants qui utilisent useChannelManager

| Composant | Propriétés utilisées |
|-----------|----------------------|
| `TeamsPage` | Toutes les propriétés et actions |
