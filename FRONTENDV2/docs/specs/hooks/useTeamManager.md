# Référence du hook useTeamManager — VisioConf

**Fichier source** : `FRONTENDV2/src/hooks/useTeamManager.ts`
**Type** : Hook React personnalisé

---

## 1. Description

`useTeamManager` gère l'état des équipes : sélection, création, édition, suppression et gestion des membres. Encapsule la logique métier pour découpler `TeamsPage` de la gestion d'état. Ne prend aucun paramètre.

---

## 2. Signature

```typescript
export function useTeamManager(): UseTeamManagerReturn
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
| `handleTeamSelect` | `team: Team` | Sélectionne une équipe, ferme le formulaire et la gestion membres |
| `handleCreateTeam` | — | Ouvre le formulaire en mode création, ferme la gestion membres |
| `handleEditTeam` | `team: Team` | Sélectionne l'équipe, ouvre le formulaire en mode édition |
| `handleManageMembers` | `teamId: string` | Ouvre la vue de gestion des membres, ferme le formulaire |
| `handleTeamCreated` | `team: Team` | Ajoute l'équipe à la liste, la sélectionne, ferme le formulaire |
| `handleTeamUpdated` | `team: Team` | Met à jour l'équipe dans la liste (par id), met à jour la sélection si même équipe |
| `handleTeamDeleted` | `teamId: string` | Retire l'équipe de la liste, reset la sélection si c'était l'équipe courante |
| `handleCancelTeamForm` | — | Ferme le formulaire |
| `handleCancelManageMembers` | — | Ferme la gestion des membres |
| `updateTeamsFromResponse` | `teams: Team[]` | Remplace la liste en bulk, conserve la sélection si l'équipe existe encore |
| `selectFirstAvailableTeam` | — | Sélectionne `teams[0]` ou `null` si vide |

---

## 4. Composants qui utilisent useTeamManager

| Composant | Propriétés utilisées |
|-----------|----------------------|
| `TeamsPage` | Toutes les propriétés et actions |
