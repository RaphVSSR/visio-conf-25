# Flux des équipes — Frontend

Vue consolidée des flux React pour les opérations d'équipe.

---

### Flux 1 — Chargement initial (TeamsPage)

```
TeamsPage.useEffect()
    │
    ├─ socket.send("team_get", { type: "list" })
    │
    └─ socket.on("team_get_response")
        │ data.type === "list"
        │
        ├─ updateTeamsFromResponse(data.teams)
        │   → useTeamManager met à jour la liste et sélectionne la première
        ├─ setIsLoadingTeams(false)
        └─ useEffect([selectedTeam]) déclenche Flux 2 (chargement des canaux)
```

**Composants impliqués** : `TeamsPage`, `useTeamManager`, `TeamsSidebar`

---

### Flux 2 — Sélection d'équipe → Chargement des canaux

```
TeamsSidebar.onClick(team)
    │
    └─ teamManager.handleTeamSelect(team)
        │
        └─ setSelectedTeam(team)
               │
               TeamsPage.useEffect([selectedTeam])
               │
               ├─ setIsLoadingChannels(true)
               ├─ socket.send("channel_get", { type: "list", teamId: team.id })
               │
               └─ socket.on("channel_get_response")
                   │ data.type === "list"
                   │
                   ├─ updateChannelsFromResponse(data.channels)
                   │   → useChannelManager met à jour la liste et sélectionne le premier
                   └─ setIsLoadingChannels(false)
```

**Composants impliqués** : `TeamsSidebar`, `TeamsPage`, `useChannelManager`, `ChannelTabs`

---

### Flux 3 — Création d'équipe

```
TeamsSidebar → bouton "+"
    │
    └─ handleCreateTeam()
        → setTeamFormMode("create")
        → TeamForm s'affiche
               │
               ├─ Au montage: socket.send("user_get", { type: "list" })
               │   → socket.on("user_get_response")
               │   → setMembers(data.users) → MemberSelector
               │
               └─ handleSubmit()
                   ├─ socket.send("team_action", { type: "create", name, description, picture, members })
                   │
                   └─ socket.on("team_action_response")
                       │ data.type === "create"
                       │
                       ├─ etat: true → onTeamCreated(data.team)
                       │   → handleTeamCreatedWrapper()
                       │       ├─ handleTeamCreated() → ajoute l'équipe, la sélectionne
                       │       └─ socket.send("team_get", { type: "list" }) (re-fetch)
                       └─ etat: false → setError(data.error)
```

**Composants impliqués** : `TeamsSidebar`, `TeamForm`, `MemberSelector`, `useTeamManager`

---

### Flux 4 — Édition d'équipe

```
TeamsSidebar → bouton éditer
    │
    └─ handleEditTeam(team)
        → setTeamFormMode("edit")
        → TeamForm s'affiche avec teamToEdit
               │
               ├─ Au montage:
               │   ├─ socket.send("user_get", { type: "list" })
               │   └─ socket.send("team_member", { type: "list", teamId })
               │       → socket.on("team_member_response")
               │       → setTeamMembers(data.members) → pré-sélection
               │
               ├─ Ajout membre (immédiat):
               │   socket.send("team_member", { type: "add", teamId, userId })
               │   → socket.on("team_member_response") → data.type === "add"
               │
               ├─ Retrait membre (immédiat):
               │   socket.send("team_member", { type: "remove", teamId, userId })
               │   → socket.on("team_member_response") → data.type === "remove"
               │
               └─ handleSubmit()
                   socket.send("team_action", { type: "update", id, name, description, picture })
                   → socket.on("team_action_response") → data.type === "update"
```

**Composants impliqués** : `TeamForm`, `MemberSelector`, `useTeamManager`

---

### Flux 5 — Suppression d'équipe

```
TeamForm (mode édition) → bouton "Supprimer"
    │
    ├─ Confirmation utilisateur
    │
    └─ socket.send("team_action", { type: "delete", teamId })
        │
        └─ socket.on("team_action_response")
            │ data.type === "delete"
            │
            └─ handleTeamDeleted(teamId)
                ├─ Retire l'équipe de la liste
                ├─ Sélectionne la première équipe restante
                └─ Recharge les canaux
```

**Composants impliqués** : `TeamForm`, `useTeamManager`, `TeamsPage`
