# Référence du hook useChannelManager — VisioConf

**Fichier source** : `FRONTENDV2/src/hooks/useChannelManager.ts`
**Type** : Hook React personnalisé

---

## 1. Description

`useChannelManager` gère l'état des canaux au sein d'une équipe : sélection, création, édition, suppression. Symétrique à `useTeamManager` mais pour les canaux. Ne prend aucun paramètre.

---

## 2. Signature

```typescript
export function useChannelManager(): UseChannelManagerReturn
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
| `handleEditChannel` | `channel: Channel` | Sélectionne le canal, ouvre le formulaire en mode édition |
| `handleChannelCreated` | `channel: Channel` | Ajoute le canal à la liste, le sélectionne, ferme le formulaire |
| `handleChannelUpdated` | `channel: Channel` | Met à jour le canal dans la liste (par id), met à jour la sélection si même canal |
| `handleChannelDeleted` | `channelId: string` | Retire le canal de la liste, reset la sélection si c'était le canal courant |
| `handleCancelChannelForm` | — | Ferme le formulaire |
| `updateChannelsFromResponse` | `channels: Channel[]` | Remplace la liste en bulk, conserve la sélection si le canal existe encore |
| `selectFirstAvailableChannel` | — | Sélectionne `channels[0]` ou `null` si vide |
| `clearChannels` | — | Vide la liste, la sélection, et le formulaire |

---

## 4. Composants qui utilisent useChannelManager

| Composant | Propriétés utilisées |
|-----------|----------------------|
| `TeamsPage` | Toutes les propriétés et actions |
