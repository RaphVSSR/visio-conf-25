# Flux des équipes — Backend

Vue consolidée des flux client-serveur pour les opérations d'équipe.

---

### Flux 1 — Chargement des équipes

```
Client                                          Serveur
------                                          -------
team_get { type: "list" }
    |=================================>         TeamService.handleTeamQuery()
                                                    -> getTeamsList()
                                                    |- resolveUserId(socketId)
                                                    |- TeamMember.find({ id: userId })
                                                    |- Team.find({ _id: { $in: teamIds } })
                                                    |
    <=================================
    team_get_response { type: "list", etat: true, teams: [...] }
```

**Composants impliqués** : `TeamsPage` (useEffect au montage)

---

### Flux 1b — Chargement de toutes les équipes (admin)

```
Client                                          Serveur
------                                          -------
team_get { type: "all" }
    |=================================>         TeamService.handleTeamQuery()
                                                    -> getAllTeams()
                                                    |- resolveUserId(socketId)
                                                    |- Team.model.find({}) (toutes les équipes)
                                                    |- Pas de rôle inclus (pas de membership)
                                                    |
    <=================================
    team_get_response { type: "all", etat: true, teams: [...] }
```

**Différence avec Flux 1** : retourne TOUTES les équipes sans filtrer par membership, et sans le champ `role`.

**Composants impliqués** : `AdminPanel`

---

### Flux 2 — Création d'équipe

```
Client                                          Serveur
------                                          -------
team_action { type: "create", name, description?, picture?, members: [] }
    |=================================>         TeamService.handleTeamAction()
                                                    -> createTeam()
                                                    |- resolveUserId(socketId)
                                                    |- new Team({ name, description, picture, createdBy })
                                                    |- team.save()
                                                    |- new TeamMember({ id: userId, role: "admin", teamId })
                                                    |- Pour chaque membre: new TeamMember({ id, role: "member", teamId })
                                                    |
    <=================================
    team_action_response { type: "create", etat: true, team: {...} }
    OU
    team_action_response { type: "create", etat: false, error: "not_authenticated" }
```

**Composants impliqués** : `TeamForm` (mode création) → `TeamsPage` (callback onTeamCreated)

---

### Flux 3 — Mise à jour d'équipe

```
Client                                          Serveur
------                                          -------
team_action { type: "update", id, name?, description?, picture? }
    |=================================>         TeamService.handleTeamAction()
                                                    -> updateTeam()
                                                    |- resolveUserId(socketId)
                                                    |- Vérification rôle admin
                                                    |- Team.findByIdAndUpdate()
                                                    |
    <=================================
    team_action_response { type: "update", etat: true, team: {...} }
    OU
    team_action_response { type: "update", etat: false, error: "admin_required" }
```

**Composants impliqués** : `TeamForm` (mode édition)

---

### Flux 4 — Suppression d'équipe (cascade)

```
Client                                          Serveur
------                                          -------
team_action { type: "delete", teamId }
    |=================================>         TeamService.handleTeamAction()
                                                    -> deleteTeam()
                                                    |- resolveUserId(socketId)
                                                    |- Vérification rôle admin
                                                    |- Cascade:
                                                    |   |- ChannelPostResponse.deleteMany()
                                                    |   |- ChannelPost.deleteMany()
                                                    |   |- ChannelMember.deleteMany()
                                                    |   |- Channel.deleteMany({ teamId })
                                                    |   |- TeamMember.deleteMany({ teamId })
                                                    |   |- Team.findByIdAndDelete()
                                                    |
    <=================================
    team_action_response { type: "delete", etat: true, teamId }
```

**Composants impliqués** : `TeamForm` (bouton supprimer) → `TeamsPage` (callback onTeamDeleted)

---

### Flux 5 — Quitter une équipe

```
Client                                          Serveur
------                                          -------
team_action { type: "leave", teamId }
    |=================================>         TeamService.handleTeamAction()
                                                    -> leaveTeam()
                                                    |- resolveUserId(socketId)
                                                    |- Vérification: pas le dernier admin
                                                    |- TeamMember.findOneAndDelete()
                                                    |
    <=================================
    team_action_response { type: "leave", etat: true, teamId }
    OU
    team_action_response { type: "leave", etat: false, error: "last_admin_cannot_leave" }
```

---

### Flux 6 — Gestion des membres

```
Client                                          Serveur
------                                          -------

--- Lister les membres ---
team_member { type: "list", teamId }
    |=================================>         getTeamMembers()
                                                    |- Populate user (firstname, lastname, picture)
    <=================================
    team_member_response { type: "list", etat: true, members: [...] }

--- Ajouter un membre ---
team_member { type: "add", teamId, userId }
    |=================================>         addTeamMember()
                                                    |- Vérification admin + doublon
                                                    |- new TeamMember({ id: userId, role: "member", teamId })
    <=================================
    team_member_response { type: "add", etat: true, teamId, userId }

--- Retirer un membre ---
team_member { type: "remove", teamId, userId }
    |=================================>         removeTeamMember()
                                                    |- Vérification admin + cannot_remove_admin
                                                    |- TeamMember.findOneAndDelete()
    <=================================
    team_member_response { type: "remove", etat: true, teamId, userId }
```

**Composants impliqués** : `TeamForm` (mode édition, ajout/retrait immédiat via socket)

---

### Flux page complète — TeamsPage

```
TeamsPage.useEffect (montage)
    |
    ├─ socket.send("team_get", { type: "list" })
    |
    ├─ socket.on("team_get_response") → data.type === "list"
    |   → updateTeamsFromResponse(data.teams)
    |   → useEffect([selectedTeam]) déclenche le chargement des canaux
    |
    ├─ socket.on("channel_get_response") → data.type === "list"
    |   → updateChannelsFromResponse(data.channels)
    |
    ├─ socket.on("channel_action_response")
    |   → "create" | "update" | "delete"
    |   → re-fetch: socket.send("channel_get", { type: "list", teamId })
    |
    └─ useEffect([selectedTeam]) → socket.send("channel_get", { type: "list", teamId })
```
