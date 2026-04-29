# Flux d'authentification — Frontend

Vue consolidée des flux d'authentification côté frontend. Les flux détaillés par composant sont dans les specs de chaque composant.

---

### Flux 1 — Initialisation (montage du AuthProvider)

```
AuthContext.useEffect()
    │
    ├─ socket = new MessageClientAdapter(BACKEND_URL)
    ├─ authRef = new AuthSync(socket, setState)
    │       │
    │       ├─ socket.on("login_response", ...)
    │       ├─ socket.on("authenticate_response", ...)
    │       ├─ socket.on("register_response", ...)
    │       │
    │       └─ socket.onReady(() => {
    │              socket.onReconnect(() => socket.send("authenticate", {}))
    │              socket.send("authenticate", {})
    │          })
```

**Composants impliqués** : `AuthContext`, `AuthSync`, `MessageClientAdapter`

---

### Flux 2 — Login

```
LoginForm.handleSubmit()
    │
    ├─ authSync.login(email, password)
    │   ├─ setState({ isLoading: true })
    │   └─ socket.send("login", { email, password, deviceInfo })
    │
    │   Serveur répond avec login_response:
    │   ┌──────────────────────────────────
    │   status: "success" → setState({ isAuthenticated: true }), startExpiryTimer()
    │   status: "failure" → setState({ loginRejected: true })
```

**Composants impliqués** : `LoginForm`, `AuthSync`

---

### Flux 3 — Reconnexion Socket.io

```
Socket.io se reconnecte automatiquement
    │
    socket.io.on("reconnect")
    │
    └─ socket.send("authenticate", {})
       → Le serveur lit le cookie de session
       → authenticate_response { status: "success" | "failure" }
```

**Composants impliqués** : `AuthSync` (callback onReconnect)

---

### Flux 4 — Inscription

```
SignupForm.handleSubmit()
    │
    ├─ authSync.register({ password, firstname, lastname, email, phone })
    │   ├─ setState({ isLoading: true })
    │   └─ socket.send("register", { ... })
    │
    │   Serveur répond avec register_response:
    │   ┌──────────────────────────────────
    │   status: "success" → setState({ isAuthenticated: true }), startExpiryTimer()
    │   status: "failure" → setState({ isLoading: false })
```

**Composants impliqués** : `SignupForm`, `AuthSync`

---

### Flux 5 — Expiration de session

```
AuthSync.startExpiryTimer(expiresAt)
    │
    ├─ Timer 1 : REACT_APP_SESSION_EXPIRY_WARNING_MS avant expiration
    │   → setState({ showExpiryWarning: true })
    │   → AuthToasts affiche le toast d'expiration
    │       │
    │       ├─ [Prolonger] → authSync.refreshSession()
    │       │   └─ fetch("POST /api/auth/refresh", { credentials: "include" })
    │       │   → Set-Cookie mis à jour par le navigateur
    │       │   → Body: { status: "refreshed", expiresAt }
    │       │   → Nouveau timer démarré
    │       │
    │       └─ [Ignorer] → dismissExpiryWarning()
    │
    ├─ Timer 2 : à l'expiration exacte
    │   → setState reset complet (non authentifié)
```

**Composants impliqués** : `AuthSync`, `AuthToasts`

---

### Flux 6 — Déconnexion

```
NavigationSidebar / bouton logout
    │
    ├─ authSync.logout()
    │   └─ fetch("POST /api/auth/logout", { credentials: "include" })
    │   → Set-Cookie supprimé par le navigateur
    │   → clearExpiryTimer(), setState reset complet
```

**Composants impliqués** : `AuthSync`, composant déclencheur
