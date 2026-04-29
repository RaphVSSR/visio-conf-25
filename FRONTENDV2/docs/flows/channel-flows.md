# Flux des canaux — Frontend

Vue consolidée des flux React pour les opérations de canaux, posts et réponses.

---

### Flux 1 — Sélection de canal → Chargement des posts

```
ChannelTabs.onClick(channel)
    │
    └─ handleChannelSelect(channel)
        → setSelectedChannel(channel)
        → ChannelView se monte/met à jour
               │
               └─ useEffect([channel])
                   ├─ socket.send("channel_post", { type: "list", channelId })
                   ├─ socket.send("channel_member", { type: "list", channelId })
                   │
                   ├─ socket.on("channel_post_response") → data.type === "list"
                   │   → setPosts(data.posts)
                   │
                   └─ socket.on("channel_member_response") → data.type === "list"
                       → setMembers(data.members)
```

**Composants impliqués** : `ChannelTabs`, `ChannelView`

---

### Flux 2 — Création de canal

```
TeamsPage → bouton "nouveau canal"
    │
    └─ handleCreateChannel()
        → setChannelFormMode("create")
        → ChannelForm s'affiche
               │
               ├─ Au montage:
               │   socket.send("team_member", { type: "list", teamId })
               │   → socket.on("team_member_response")
               │   → setMembers(data.members) → MemberSelector (si privé)
               │
               └─ handleSubmit()
                   ├─ socket.send("channel_action", { type: "create", name, isPublic, teamId, members })
                   │
                   └─ socket.on("channel_action_response")
                       │ data.type === "create"
                       │
                       ├─ etat: true → onChannelCreated(data.channel)
                       │   → handleChannelCreated() → ajoute, sélectionne, ferme le formulaire
                       └─ etat: false → setError(data.error)
```

**Composants impliqués** : `ChannelForm`, `MemberSelector`, `useChannelManager`

---

### Flux 3 — Édition de canal

```
ChannelView → bouton paramètres
    │
    └─ onEditChannel()
        → setChannelFormMode("edit")
        → ChannelForm s'affiche avec channelToEdit
               │
               ├─ Au montage:
               │   ├─ socket.send("team_member", { type: "list", teamId })
               │   └─ socket.send("channel_member", { type: "list", channelId })
               │       → Pré-sélection des membres actuels
               │
               └─ handleSubmit()
                   socket.send("channel_action", { type: "update", id, name, isPublic, teamId, members })
                   → socket.on("channel_action_response") → data.type === "update"
                   → handleChannelUpdated(data.channel)
```

**Composants impliqués** : `ChannelView`, `ChannelForm`, `MemberSelector`

---

### Flux 4 — Suppression de canal

```
ChannelForm (mode édition) → bouton "Supprimer"
    │
    ├─ Confirmation utilisateur
    │
    └─ socket.send("channel_action", { type: "delete", channelId })
        │
        └─ socket.on("channel_action_response")
            │ data.type === "delete"
            │
            └─ handleChannelDeleted(channelId)
                ├─ Retire le canal de la liste
                └─ Sélectionne le premier canal restant
```

**Composants impliqués** : `ChannelForm`, `useChannelManager`, `TeamsPage`

---

### Flux 5 — Publication d'un post

```
ChannelView → formulaire de publication
    │
    ├─ Saisie du contenu (newPostContent)
    │
    └─ handleSubmit()
        ├─ socket.send("channel_post", { type: "publish", channelId, content })
        ├─ setNewPostContent("")
        │
        └─ socket.on("channel_post_response") → data.type === "publish"
            → setPosts([...posts, data.post])
            → auto-scroll vers le bas
```

**Composants impliqués** : `ChannelView` (broadcast reçu par tous les membres connectés)

---

### Flux 6 — Réponse à un post

```
PostItem → bouton "répondre"
    │
    ├─ Toggle du formulaire de réponse
    │
    └─ handleSubmitResponse()
        ├─ socket.send("channel_post", { type: "answer", postId, content })
        │
        └─ socket.on("channel_post_response") → data.type === "answer"
            → Ajoute data.response aux réponses du post parent
            → Incrémente responseCount
```

**Composants impliqués** : `PostItem`, `PostResponseItem` (broadcast reçu par tous les membres connectés)

---

### Flux 7 — Broadcast et réactivité en temps réel

```
Publication ou réponse par un autre utilisateur
    │
    ├─ Serveur broadcast via getConnectedChannelMemberSocketIds()
    │   → Envoie à tous les sockets des membres du canal
    │
    └─ ChannelView reçoit les messages
        │
        ├─ channel_post_response { type: "publish" }
        │   → Nouveau post ajouté à la liste
        │   → Auto-scroll
        │
        └─ channel_post_response { type: "answer" }
            → Réponse ajoutée au post parent
```

**Composants impliqués** : `ChannelView`, `PostItem` (mise à jour réactive)

---

### Flux vue complète — ChannelView listeners

```
ChannelView.useEffect (montage + changement de canal)
    │
    ├─ Envois initiaux:
    │   ├─ socket.send("channel_post", { type: "list", channelId })
    │   └─ socket.send("channel_member", { type: "list", channelId })
    │
    ├─ socket.on("channel_post_response")
    │   → switch(data.type):
    │       "list"    → setPosts(data.posts), setIsLoading(false)
    │       "publish" → posts = [...posts, data.post], auto-scroll
    │       "answer"  → ajouter la réponse au post parent
    │
    ├─ socket.on("channel_member_response")
    │   → "list" → setMembers(data.members)
    │
    └─ socket.on("channel_action_response")
        → "delete" → si channelId courant → onChannelDeleted()
```
