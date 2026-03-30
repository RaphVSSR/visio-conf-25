# Flux des utilisateurs — Backend

Vue consolidée des flux client-serveur pour les opérations utilisateur.

---

### Flux 1 — Liste des utilisateurs actifs

```
Client                                          Serveur
------                                          -------
user_get { type: "list" }
    |=================================>         UserService.handleUserQuery()
                                                    -> getUsersList()
                                                    |- resolveUserId(socketId)
                                                    |- User.find({ status: "active" })
                                                    |- Sélection: firstname, lastname, email, picture, is_online, job
                                                    |
    <=================================
    user_get_response { type: "list", etat: true, users: [{id, firstname, lastname, email, picture, isOnline, job}] }
```

**Composants impliqués** : `TeamForm` (MemberSelector), `AdminPanel`

---

### Flux 2 — Profil d'un utilisateur

```
Client                                          Serveur
------                                          -------
user_get { type: "info", userId }
    |=================================>         UserService.handleUserQuery()
                                                    -> getUserInfo()
                                                    |- resolveUserId(socketId) (vérification auth)
                                                    |- User.findById(userId)
                                                    |- Sélection: firstname, lastname, email, picture, is_online, job, desc, phone, date_created
                                                    |
    <=================================
    user_get_response { type: "info", etat: true, user: {id, firstname, lastname, email, picture, isOnline, job, desc, phone, dateCreated} }
    OU
    user_get_response { type: "info", etat: false, error: "user_not_found" }
```

---

### Flux 3 — Recherche d'utilisateurs

```
Client                                          Serveur
------                                          -------
user_get { type: "search", query }
    |=================================>         UserService.handleUserQuery()
                                                    -> searchUsers()
                                                    |- resolveUserId(socketId)
                                                    |- Regex insensible à la casse sur firstname, lastname, email
                                                    |- Filtre: status = "active"
                                                    |- Limite: 20 résultats
                                                    |
    <=================================
    user_get_response { type: "search", etat: true, users: [{id, firstname, lastname, email, picture, isOnline}] }
```

---

### Flux 4 — Mise à jour du profil personnel

```
Client                                          Serveur
------                                          -------
user_update { type: "profile", firstname?, lastname?, phone?, job?, desc?, picture? }
    |=================================>         UserService.handleUserUpdate()
                                                    -> updateUser()
                                                    |- resolveUserId(socketId)
                                                    |- Liste blanche: [firstname, lastname, phone, job, desc, picture]
                                                    |- User.updateOne({ _id: userId }, { $set: filteredData })
                                                    |
    <=================================
    user_update_response { type: "profile", etat: true }
```

---

### Flux 5 — Changement de statut (admin)

```
Client                                          Serveur
------                                          -------
user_update { type: "status", userId, status }
    |=================================>         UserService.handleUserUpdate()
                                                    -> updateUserStatus()
                                                    |- AccessRoleGuard.requireRole(socketId, "admin")
                                                    |   |- Vérifie session + rôle admin
                                                    |   |- Si non autorisé: { etat: false, error: "not_authenticated" | "insufficient_role" }
                                                    |- User.updateOne({ _id: userId }, { $set: { status } })
                                                    |
    <=================================
    user_update_response { type: "status", etat: true, userId, status }
```

**Composants impliqués** : `AdminPanel`

---

### Flux 6 — Changement de rôles (admin)

```
Client                                          Serveur
------                                          -------
user_update { type: "roles", userId, roles: [] }
    |=================================>         UserService.handleUserUpdate()
                                                    -> updateUserRoles()
                                                    |- AccessRoleGuard.requireRole(socketId, "admin")
                                                    |- User.updateOne({ _id: userId }, { $set: { roles } })
                                                    |
    <=================================
    user_update_response { type: "roles", etat: true, userId, roles }
```

**Composants impliqués** : `AdminPanel`
