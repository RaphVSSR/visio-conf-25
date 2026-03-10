# Référence du TeamsService — VisioConf

**Fichier source** : `FRONTENDV2/src/services/teams/TeamsService.ts`
**Classe parente** : `ControllerService`

---

## 1. Description

`TeamsService` est le service frontend qui communique avec le backend via le controleur pour les opérations sur les équipes. Utilise un pattern de callbacks pour notifier les composants des réponses.

---

## 2. Callbacks

```typescript
interface TeamsServiceCallbacks {
    onTeamsListReceived: (teams: Team[]) => void
    onTeamsListError: (error: string) => void
    onTeamCreated: (team: Team) => void
    onTeamCreateError: (error: string) => void
    onTeamUpdated: (team: Team) => void
    onTeamUpdateError: (error: string) => void
    onTeamDeleted: () => void
    onTeamDeleteError: (error: string) => void
    onTeamMembersReceived: (members: any[]) => void
    onTeamMembersError: (error: string) => void
    onTeamMemberAdded: (userId: string) => void
    onTeamMemberAddError: (error: string, userId?: string) => void
    onTeamMemberRemoved: (userId: string) => void
    onTeamMemberRemoveError: (error: string, userId?: string) => void
    onUsersListReceived: (users: any[]) => void
    onUsersListError: (error: string) => void
}
```

---

## 3. Méthodes publiques

| Méthode | Paramètres | Description |
|---------|------------|-------------|
| `requestTeamsList` | — | Demande les équipes de l'utilisateur |
| `createTeam` | `{ name, description?, picture? }` | Crée une équipe |
| `updateTeam` | `{ id, name?, description?, picture? }` | Met à jour une équipe |
| `deleteTeam` | `teamId: string` | Supprime une équipe |
| `requestTeamMembers` | `teamId: string` | Demande les membres d'une équipe |
| `addTeamMember` | `teamId: string, userId: string` | Ajoute un membre |
| `removeTeamMember` | `teamId: string, userId: string` | Retire un membre |
| `requestUsersList` | — | Demande la liste des utilisateurs |

---

## 4. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `ControllerService` | TeamsService extends ControllerService | Classe parente |
| `TeamForm` | TeamForm utilise TeamsService (via controleur) | Consommateur principal |
| `TeamsPage` | TeamsPage utilise TeamsService (via controleur) | Consommateur principal |
