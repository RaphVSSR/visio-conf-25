# Référence des Messages d'Authentification — VisioConf

## Catalogue complet des messages

### Client → Serveur (6 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `authenticate` | `{ sessionId: string }` | Vérifie si la session est encore active (reconnexion) |
| `login` | `{ email: string, password: string, deviceInfo: string }` | Connexion avec identifiants |
| `register` | `{ password: string, firstname: string, lastname: string, email: string, phone: string }` | Création de compte |
| `user_disconnect` | `{}` | Déconnexion volontaire |
| `session_refresh` | `{}` | Demande de prolongation de session |
| `session_pending_choice` | `{ requestId: string, accepted: boolean }` | Réponse à une demande d'approbation multi-session |

### Serveur → Client (12 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `auth_success` | `{ user: User, expiresAt: number }` | Reconnexion réussie |
| `auth_failure` | `{ reason: string }` | Reconnexion échouée (`"session_id_required"`, `"session_no_longer_exists"`, `"session_expired"`, `"user_not_found"`, `"not_authenticated"`) |
| `login_success` | `{ user: User, expiresAt: number, sessionId: string }` | Connexion réussie |
| `login_failure` | `{ reason: string }` | Connexion échouée (`"user_not_found"`, `"wrong_password"`, `"rejected"`, `"timeout"`) |
| `login_pending` | `{ requestId: string }` | En attente d'approbation multi-session |
| `registration_success` | `{ user: User, expiresAt: number, sessionId: string }` | Inscription réussie |
| `registration_failure` | `{ reason: string }` | Inscription échouée (`"email_already_exists"` ou message d'erreur) |
| `user_disconnect_success` | `{}` | Déconnexion confirmée |
| `session_refreshed` | `{ expiresAt: number }` | Session prolongée avec succès |
| `session_expired` | `{}` | Réponse à `session_refresh` quand la session n'existe plus |
| `session_pending` | `{ requestId: string, deviceInfo: string, requesterInfo: string }` | Nouvelle connexion nécessite approbation |
| `session_pending_accepted` | `{ requestId: string }` | Approbation accordée (notification toast) |
| `session_pending_rejected` | `{ requestId: string }` | Approbation refusée (notification toast) |

**Total : 6 client→serveur + 12 serveur→client = 18 messages**

---

## Types TypeScript des payloads

```typescript
// ===== Types utilisateur =====

interface User {
    _id: string
    firstname: string
    lastname: string
    email: string
    phone: string
    status: string
    job: string
    desc: string
    picture: string
    is_online: boolean
    disturb_status: string
    roles: string[]
}

// ===== Client → Serveur =====

interface AuthenticatePayload {
    sessionId: string
}

interface LoginPayload {
    email: string
    password: string
    deviceInfo: string
}

interface RegisterPayload {
    password: string
    firstname: string
    lastname: string
    email: string
    phone: string
}

interface UserDisconnectPayload {}

interface SessionRefreshPayload {}

interface SessionPendingChoicePayload {
    requestId: string
    accepted: boolean
}

// ===== Serveur → Client =====

interface AuthSuccessPayload {
    user: User
    expiresAt: number
}

interface AuthFailurePayload {
    reason: "session_id_required" | "session_no_longer_exists" | "session_expired" | "user_not_found" | "not_authenticated"
}

interface LoginSuccessPayload {
    user: User
    expiresAt: number
    sessionId: string
}

interface LoginFailurePayload {
    reason: "user_not_found" | "wrong_password" | "rejected" | "timeout"
}

interface LoginPendingPayload {
    requestId: string
}

interface RegistrationSuccessPayload {
    user: User
    expiresAt: number
    sessionId: string
}

interface RegistrationFailurePayload {
    reason: "email_already_exists" | string
}

interface UserDisconnectSuccessPayload {}

interface SessionRefreshedPayload {
    expiresAt: number
}

interface SessionExpiredPayload {}

interface SessionPendingPayload {
    requestId: string
    deviceInfo: string
    requesterInfo: string
}

interface SessionPendingAcceptedPayload {
    requestId: string
}

interface SessionPendingRejectedPayload {
    requestId: string
}
```

---

## Flux par scénario

### Flow 1 — Login (connexion fraîche)

```
Client                                          Serveur
------                                          -------
login { email, password, deviceInfo }
    │══════════════════════════════════════>     AuthService.login()
                                                    ├─ User.getUser(email)
                                                    ├─ verifyPassword()
                                                    ├─ Session.getSessions(userId)
                                                    │
                                            ┌───────┴───────┐
                                      Pas de sessions  Sessions existantes
                                            │               │
                                      createSession()  Flow 7 (multi-session)
                                            │
    <══════════════════════════════════      │
    login_success { user, expiresAt, sessionId }
    OU
    login_failure { reason }
```

### Flow 2 — Reconnexion (page refresh)

```
Client                                          Serveur
------                                          -------
authenticate { sessionId }
    │══════════════════════════════════════>     AuthService.authenticate()
                                                    ├─ Session.getSession(sessionId)
                                                    ├─ Vérifie expiration (expiresAt > now)
                                                    ├─ Session.bindSocket(sessionId, socketId)
                                                    ├─ User.findById() (charge les données user)
                                                    │
    <══════════════════════════════════
    auth_success { user, expiresAt }
    OU
    auth_failure { reason: "session_expired" | "session_no_longer_exists" | "user_not_found" }
```

### Flow 3 — Inscription

```
Client                                          Serveur
------                                          -------
register { password, firstname, lastname, email, phone }
    │══════════════════════════════════════>     AuthService.register()
                                                    ├─ Vérifier email unique
                                                    ├─ hashPassword()
                                                    ├─ Créer User en DB
                                                    ├─ createSession()
                                                    │
    <══════════════════════════════════
    registration_success { user, expiresAt, sessionId }
    OU
    registration_failure { reason }
```

### Flow 4 — Déconnexion

```
Client                                          Serveur
------                                          -------
user_disconnect {}
    │══════════════════════════════════════>     AuthService.user_disconnect()
                                                    ├─ Session.getSessionBySocket(socketId)
                                                    ├─ Session.deleteSession()
                                                    │
    <══════════════════════════════════
    user_disconnect_success {}
```

### Flow 5 — Avertissement d'expiration

```
Client (timer local)                            Serveur
------                                          -------
Timer déclenché 30min avant expiresAt
SessionExpiryModal s'affiche
    │
    ├─ [OUI - Prolonger]
    │   session_refresh {}
    │   │══════════════════════════════>     AuthService.session_refresh()
    │                                           ├─ Session.getSessionBySocket()
    │                                           ├─ Session.refreshSession()
    │   <══════════════════════════════
    │   session_refreshed { expiresAt }
    │
    ├─ [NON - Ignorer]
    │   Modale fermée, session expire naturellement
    │   MongoDB TTL supprime la session
    │   (pas de notification proactive)
    │   → Flow 6 au prochain accès
```

### Flow 6 — Retour après expiration offline

```
Client                                          Serveur
------                                          -------
Utilisateur revient après expiration
authenticate { sessionId }
    │══════════════════════════════════════>     AuthService.authenticate()
                                                    Session expirée ou supprimée
    <══════════════════════════════════
    auth_failure { reason: "session_expired" | "session_no_longer_exists" }
    │
    v
Page de login affichée
```

### Flow 7 — Approbation multi-session

```
Device 2 (nouveau)         Serveur                Device 1 (existant)
──────────────────         ───────                ───────────────────
login { email, pwd }
    │═══════════════>     Sessions actives ?
                          OUI →
    <═══════════════      login_pending ═════>    session_pending
    { requestId }         { requestId }           { requestId,
                                                    deviceInfo,
                                                    requesterInfo }
                                                       │
                                                 [ACCEPTER/REFUSER]
                                                       │
                          <═══════════════════    session_pending_choice
                                                 { requestId, accepted }
                          │
                    ┌─────┴──────┐
                ACCEPTÉ       REFUSÉ/TIMEOUT
                    │              │
    <═══════        │              │ ═══════>
    login_success   │          login_failure
                    │          { reason }
              ═══════════════════════════>
              session_pending_accepted
```

---

## Table d'assignation des messages

### Qui émet, qui reçoit

| Message | Émetteur | Récepteur |
|---------|----------|-----------|
| `authenticate` | AuthContext | AuthService |
| `login` | AuthContext (LoginForm) | AuthService |
| `register` | AuthContext (SignupForm) | AuthService |
| `user_disconnect` | AuthContext | AuthService |
| `session_refresh` | AuthContext | AuthService |
| `session_pending_choice` | AuthContext | AuthService |
| `auth_success` | AuthService | AuthContext |
| `auth_failure` | AuthService | AuthContext |
| `login_success` | AuthService | AuthContext |
| `login_failure` | AuthService | AuthContext |
| `login_pending` | AuthService | AuthContext |
| `registration_success` | AuthService | AuthContext |
| `registration_failure` | AuthService | AuthContext |
| `user_disconnect_success` | AuthService | AuthContext |
| `session_refreshed` | AuthService | AuthContext |
| `session_expired` | AuthService | AuthContext |
| `session_pending` | AuthService | AuthContext |
| `session_pending_accepted` | AuthService | AuthContext |
| `session_pending_rejected` | AuthService | AuthContext |

---

## Machine à états des sessions

```
                    ┌─────────────────┐
                    │  NON AUTHENTIFIÉ │
                    └────────┬────────┘
                             │
                    login / register / authenticate
                             │
                   ┌─────────┴──────────┐
                   │                    │
              Succès              Échec/Pending
                   │                    │
                   v                    v
            ┌──────────┐        ┌──────────────┐
            │ AUTHENTIFIÉ│        │ EN ATTENTE    │ (login_pending)
            └─────┬─────┘        │ D'APPROBATION│
                  │              └──────┬───────┘
         ┌────────┼────────┐           │
         │        │        │     Accepté/Rejeté/Timeout
         v        v        v           │
    session_  user_       socket   ┌───┴───┐
    refresh   disconnect  disconnect│       │
         │        v        │     Accepté  Rejeté
         │   NON AUTH     │        │       │
         v                v        v       v
    AUTHENTIFIÉ    Session reste  AUTH    NON AUTH
    (nouveau       active en DB
    expiresAt)
```

---

## Référence rapide

| "Je veux..." | "...envoyer ce message" |
|--------------|-------------------------|
| Me connecter | `login { email, password, deviceInfo }` |
| Me reconnecter (page refresh) | `authenticate { sessionId }` |
| Créer un compte | `register { password, firstname, lastname, email, phone }` |
| Me déconnecter | `user_disconnect {}` |
| Prolonger ma session | `session_refresh {}` |
| Accepter une nouvelle connexion | `session_pending_choice { requestId, accepted: true }` |
| Refuser une nouvelle connexion | `session_pending_choice { requestId, accepted: false }` |
