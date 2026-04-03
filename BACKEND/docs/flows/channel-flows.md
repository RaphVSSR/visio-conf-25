# Flux des canaux — Backend

Vue consolidée des flux client-serveur pour les opérations de canaux, posts et réponses.

---

### Flux 1 — Chargement des canaux d'une équipe

```
Client                                          Serveur
------                                          -------
channel_get { type: "list", teamId }
    |=================================>         ChannelService.handleChannelQuery()
                                                    -> getChannels()
                                                    |- resolveUserId(socketId)
                                                    |- Canaux publics + canaux privés dont l'user est membre
                                                    |
    <=================================
    channel_get_response { type: "list", etat: true, channels: [...] }
```

**Composants impliqués** : `TeamsPage` (callback onTeamSelected)

---

### Flux 2 — Création de canal

```
Client                                          Serveur
------                                          -------
channel_action { type: "create", name, isPublic, teamId, members? }
    |=================================>         ChannelService.handleChannelAction()
                                                    -> createChannel()
                                                    |- resolveUserId(socketId)
                                                    |- new Channel({ name, isPublic, teamId, createdBy })
                                                    |- Si public: ajouter tous les membres de l'équipe
                                                    |- Si privé: ajouter les membres spécifiés
                                                    |- Créateur ajouté comme admin
                                                    |
    <============= (broadcast membres équipe)
    channel_action_response { type: "create", etat: true, channel: {...} }
```

**Composants impliqués** : `ChannelForm` (mode création) → `TeamsPage` (listener broadcast)

---

### Flux 3 — Mise à jour de canal

```
Client                                          Serveur
------                                          -------
channel_action { type: "update", id, name, isPublic, teamId, members? }
    |=================================>         ChannelService.handleChannelAction()
                                                    -> updateChannel()
                                                    |- Vérification admin
                                                    |- Si public→privé: retirer les non-listés
                                                    |- Si privé→public: ajouter tous les membres manquants
                                                    |
    <=================================
    channel_action_response { type: "update", etat: true, channel: {...} }
```

**Composants impliqués** : `ChannelForm` (mode édition)

---

### Flux 4 — Suppression de canal (cascade)

```
Client                                          Serveur
------                                          -------
channel_action { type: "delete", channelId }
    |=================================>         ChannelService.handleChannelAction()
                                                    -> deleteChannel()
                                                    |- Vérification admin
                                                    |- Cascade:
                                                    |   |- ChannelPostResponse.deleteMany()
                                                    |   |- ChannelPost.deleteMany()
                                                    |   |- ChannelMember.deleteMany()
                                                    |   |- Channel.findByIdAndDelete()
                                                    |
    <=================================
    channel_action_response { type: "delete", etat: true, channelId }
```

**Composants impliqués** : `ChannelForm` (bouton supprimer), `ChannelView` (callback onChannelDeleted)

---

### Flux 5 — Gestion des membres de canal

```
Client                                          Serveur
------                                          -------

--- Lister les membres ---
channel_member { type: "list", channelId }
    |=================================>         getChannelMembers()
                                                    |- Vérification membership (canaux privés)
                                                    |- Populate user (firstname, lastname, picture)
    <=================================
    channel_member_response { type: "list", etat: true, members: [...] }

--- Ajouter un membre ---
channel_member { type: "add", channelId, userId }
    |=================================>         addChannelMember()
                                                    |- Vérification admin + doublon
    <=================================
    channel_member_response { type: "add", etat: true, channelId, userId }

--- Retirer un membre ---
channel_member { type: "remove", channelId, userId }
    |=================================>         removeChannelMember()
                                                    |- Vérification admin + cannot_remove_admin
    <=================================
    channel_member_response { type: "remove", etat: true, channelId, userId }

--- Quitter un canal ---
channel_member { type: "leave", channelId }
    |=================================>         leaveChannel()
                                                    |- Vérification: pas le dernier admin
    <=================================
    channel_member_response { type: "leave", etat: true, channelId }
```

**Composants impliqués** : `ChannelForm` (édition membres), `ChannelView` (panneau membres)

---

### Flux 6 — Chargement des posts

```
Client                                          Serveur
------                                          -------
channel_post { type: "list", channelId }
    |=================================>         ChannelService.handleChannelPost()
                                                    -> getChannelPosts()
                                                    |- Vérification membership (canaux privés)
                                                    |- Posts triés par date + réponses populées
                                                    |
    <=================================
    channel_post_response { type: "list", etat: true, posts: [...] }
```

**Composants impliqués** : `ChannelView` (useEffect au changement de canal)

---

### Flux 6b — Chargement des posts d'un utilisateur

```
Client                                          Serveur
------                                          -------
channel_post { type: "user", channelId, userId }
    |=================================>         ChannelService.handleChannelPost()
                                                    -> getUserPost()
                                                    |- resolveUserId(socketId)
                                                    |- Vérification membership (canaux privés)
                                                    |- Posts filtrés par authorId = userId
                                                    |- Triés par date, auteur populé
                                                    |
    <=================================
    channel_post_response { type: "user", etat: true, posts: [...] }
```

---

### Flux 7 — Publication d'un post

```
Client                                          Serveur
------                                          -------
channel_post { type: "publish", channelId, content }
    |=================================>         ChannelService.handleChannelPost()
                                                    -> publishPost()
                                                    |- Vérification membership
                                                    |- new ChannelPost({ channelId, content, authorId })
                                                    |
    <============= (broadcast membres connectés du canal)
    channel_post_response { type: "publish", etat: true, post: {...} }
```

**Composants impliqués** : `ChannelView` (formulaire de publication) → broadcast à tous les membres

---

### Flux 8 — Réponse à un post

```
Client                                          Serveur
------                                          -------
channel_post { type: "answer", postId, content }
    |=================================>         ChannelService.handleChannelPost()
                                                    -> answerPost()
                                                    |- Vérification membership
                                                    |- Interdit de répondre à son propre post
                                                    |- new ChannelPostResponse({ postId, content, authorId })
                                                    |- ChannelPost.responseCount++
                                                    |
    <============= (broadcast membres connectés du canal)
    channel_post_response { type: "answer", etat: true, postId, response: {...} }
```

**Composants impliqués** : `PostItem` (formulaire de réponse) → broadcast à tous les membres

---

### Flux 9 — Modification / Suppression de post

```
Client                                          Serveur
------                                          -------

--- Modifier ---
channel_post { type: "update", postId, content }
    |=================================>         updatePost()
                                                    |- Vérification auteur
    <=================================
    channel_post_response { type: "update", etat: true, postId, content }

--- Supprimer ---
channel_post { type: "delete", postId }
    |=================================>         deletePost()
                                                    |- Vérification auteur OU admin du canal
                                                    |- Cascade: ChannelPostResponse.deleteMany()
    <=================================
    channel_post_response { type: "delete", etat: true, postId }
```

---

### Flux page complète — ChannelView

```
ChannelView.useEffect (changement de canal)
    |
    ├─ socket.send("channel_post", { type: "list", channelId })
    ├─ socket.send("channel_member", { type: "list", channelId })
    |
    ├─ socket.on("channel_post_response")
    |   → switch(data.type):
    |       "list"    → setPosts(data.posts)
    |       "publish" → ajouter le post, auto-scroll
    |       "answer"  → ajouter la réponse au post parent
    |
    ├─ socket.on("channel_member_response")
    |   → "list" → setMembers(data.members)
    |
    └─ socket.on("channel_action_response")
        → "delete" → onChannelDeleted() si le canal courant est supprimé
```
