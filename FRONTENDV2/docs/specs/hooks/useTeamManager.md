# Référence du hook useTeamManager — VisioConf

**Fichier source** : `FRONTENDV2/src/hooks/useTeamManager.ts`
**Type** : Custom React Hook

---

## 1. Description

`useTeamManager` gère l'état complexe des équipes : sélection, création, édition, suppression et gestion des membres. Encapsule la logique métier pour découpler `TeamsPage` de la gestion d'état.

---

## 2. Paramètres

```typescript
interface UseTeamManagerProps {
    initialTeams: Team[]
    onTeamsChange?: (teams: Team[]) => void
    onTeamSelected?: (team: Team | null) => void
    onTeamDeleted?: () => void
}
```

---

## 3. Valeurs retournées

### State

| Propriété | Type | Description |
|-----------|------|-------------|
| `teams` | `Team[]` | Liste des équipes |
| `selectedTeam` | `Team \| null` | Équipe sélectionnée |
| `teamFormMode` | `"create" \| "edit" \| null` | Mode du formulaire |
| `managingMembersTeamId` | `string \| null` | ID de l'équipe en gestion de membres |

### Actions

| Action | Paramètres | Description |
|--------|------------|-------------|
| `handleTeamSelect` | `team: Team` | Sélectionne une équipe, ferme le formulaire |
| `handleCreateTeam` | — | Ouvre le formulaire en mode création |
| `handleEditTeam` | `team: Team` | Ouvre le formulaire en mode édition |
| `handleManageMembers` | `teamId: string` | Ouvre la vue de gestion des membres |
| `handleTeamCreated` | `team: Team` | Ajoute l'équipe, la sélectionne |
| `handleTeamUpdated` | `team: Team` | Met à jour l'équipe dans la liste |
| `handleTeamDeleted` | `teamId: string` | Retire l'équipe de la liste |
| `handleCancelTeamForm` | — | Ferme le formulaire |
| `handleCancelManageMembers` | — | Ferme la gestion des membres |
| `updateTeamsFromResponse` | `teams: Team[]` | Met à jour en bulk depuis la réponse API |
| `selectFirstAvailableTeam` | — | Sélectionne la première équipe disponible |

---

## 4. Composants qui utilisent useTeamManager

| Composant | Propriétés utilisées |
|-----------|----------------------|
| `TeamsPage` | Toutes les propriétés et actions |
