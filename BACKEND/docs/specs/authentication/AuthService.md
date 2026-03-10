# Référence de la classe AuthService — VisioConf

**Fichier source** : `BACKEND/src/models/services/authentication/AuthService.ts`
**Classe parente** : `ControllerService` (abstract)

---

## 1. Description

`AuthService` est le service qui gère toute l'authentification via le pattern pub/sub du controleur. Il traite les messages de login, register, authenticate, disconnect, session refresh, et l'approbation multi-session.

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `pendingRequests` | `Map<string, PendingSessionRequest>` | `private` | Map des demandes d'approbation multi-session en attente, indexée par requestId |
| `nomDInstance` | `string` | `readonly` (hérité) | `"AuthService"` — nom d'inscription dans le controleur |
| `controleur` | `Controller` | `protected readonly` (hérité) | Référence au controleur pour émettre des messages |
| `messagesEmitted` | `string[]` | `readonly` (hérité) | Messages que ce service peut émettre |
| `messagesReceived` | `string[]` | `readonly` (hérité) | Messages que ce service écoute |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description | Exemple |
|-----|------|--------|-------------|---------|
| `SESSION_APPROVAL_TIMEOUT_SECONDS` | `env` | `process.env.SESSION_APPROVAL_TIMEOUT_SECONDS \|\| "60"` | Timeout pour l'approbation multi-session (en secondes) | `"60"`, `"120"` |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `traitementMessage` | `mesg: ControllerMessage` | `void` | instance | Dispatcher principal. Route les messages reçus vers la méthode correspondante |
| `login` | `socketId: string, payload: { email, password, deviceInfo }` | `Promise<void>` | `private` | Authentifie un utilisateur. Si des sessions existent, déclenche le flow multi-session |
| `authenticate` | `socketId: string, payload: { sessionId }` | `Promise<void>` | `private` | Reconnexion via sessionId. Vérifie la session, bind le socket, retourne les données user |
| `register` | `socketId: string, payload: { password, firstname, lastname, email, phone }` | `Promise<void>` | `private` | Crée un compte, hash le password, crée une session |
| `user_disconnect` | `socketId: string` | `Promise<void>` | `private` | Déconnexion volontaire. Supprime la session |
| `session_refresh` | `socketId: string` | `Promise<void>` | `private` | Prolonge la session active |
| `createManualSessionValidationByUser` | `socketId: string, user: any, deviceInfo: string` | `Promise<void>` | `private` | Crée une demande d'approbation multi-session avec timeout |
| `succeedManualSessionValidationByUser` | `requestId: string` | `Promise<void>` | `private` | Accepte une demande multi-session. Crée la session et notifie |
| `rejectManualSessionValidationByUser` | `requestId: string, reason: string` | `Promise<void>` | `private` | Rejette une demande multi-session. Notifie le demandeur |
| `resultManualSessionValidationByUser` | `socketId: string, payload: { requestId, accepted }` | `void` | `private` | Route la décision accept/reject |
| `client_deconnexion` | `socketId: string` | `Promise<void>` | `private` | Gère la déconnexion du socket (clear socket de la session, pas de suppression) |
| `createSession` | `socketId: string, userId: string` | `Promise<{ sessionId, expiresAt }>` | `private` | Crée une session avec la durée configurée |
| `hashPassword` | `password: string` | `string` | `private` | Hash SHA256 du mot de passe |
| `verifyPassword` | `password: string, hash: string` | `boolean` | `private` | Compare le hash SHA256 du password avec le hash stocké |

---

## 5. Inscription au Controleur

```typescript
new AuthService(controleur, "AuthService",
    // Émis (serveur → client)
    ["auth_success", "auth_failure", "login_success", "login_failure", "login_pending",
     "registration_success", "registration_failure", "user_disconnect_success",
     "session_refreshed", "session_expired",
     "session_pending", "session_pending_accepted", "session_pending_rejected"],
    // Reçus (client → serveur)
    ["authenticate", "login", "register", "user_disconnect", "session_refresh",
     "session_pending_choice", "client_deconnexion"]
)
```

---

## 6. Catalogue des messages

**Total : 6 client→serveur + 12 serveur→client + 1 interne = 19 messages**

### Client → Serveur (6 messages)

| Message | Payload | Description | Exemple |
|---------|---------|-------------|---------|
| `authenticate` | `{ sessionId: string }` | Vérifie si la session est encore active (reconnexion) | `{ authenticate: { sessionId: "67a1b2c3d4e5f6a7b8c9d0e1" }, id: "xK9mP2..." }` |
| `login` | `{ email: string, password: string, deviceInfo: string }` | Connexion avec identifiants | `{ login: { email: "dev@visioconf.com", password: "a1b2c3...", deviceInfo: "Mozilla/5.0..." }, id: "xK9mP2..." }` |
| `register` | `{ password: string, firstname: string, lastname: string, email: string, phone: string }` | Création de compte | `{ register: { password: "mdp", firstname: "Jean", lastname: "Dupont", email: "jean@example.com", phone: "0612345678" }, id: "xK9mP2..." }` |
| `user_disconnect` | `{}` | Déconnexion volontaire | `{ user_disconnect: {}, id: "xK9mP2..." }` |
| `session_refresh` | `{}` | Demande de prolongation de session | `{ session_refresh: {}, id: "xK9mP2..." }` |
| `session_pending_choice` | `{ requestId: string, accepted: boolean }` | Réponse à une demande d'approbation multi-session | `{ session_pending_choice: { requestId: "f47ac10b-...", accepted: true }, id: "xK9mP2..." }` |

### Serveur → Client (12 messages)

| Message | Payload | Description | Exemple |
|---------|---------|-------------|---------|
| `auth_success` | `{ user: User, expiresAt: number }` | Reconnexion réussie | `{ auth_success: { user: { _id: "67a1...", firstname: "Admin", ... }, expiresAt: 1709312400000 }, id: ["xK9mP2..."] }` |
| `auth_failure` | `{ reason: string }` | Reconnexion échouée (`"session_id_required"`, `"session_no_longer_exists"`, `"session_expired"`, `"user_not_found"`, `"not_authenticated"`) | `{ auth_failure: { reason: "session_no_longer_exists" }, id: ["xK9mP2..."] }` |
| `login_success` | `{ user: User, expiresAt: number, sessionId: string }` | Connexion réussie | `{ login_success: { user: { _id: "67a1...", firstname: "Admin", ... }, expiresAt: 1709312400000, sessionId: "67b2c3d4..." }, id: ["xK9mP2..."] }` |
| `login_failure` | `{ reason: string }` | Connexion échouée (`"user_not_found"`, `"wrong_password"`, `"rejected"`, `"timeout"`) | `{ login_failure: { reason: "wrong_password" }, id: ["xK9mP2..."] }` |
| `login_pending` | `{ requestId: string }` | En attente d'approbation multi-session | `{ login_pending: { requestId: "f47ac10b-..." }, id: ["xK9mP2..."] }` |
| `registration_success` | `{ user: User, expiresAt: number, sessionId: string }` | Inscription réussie | `{ registration_success: { user: { _id: "67c3...", firstname: "Jean", ... }, expiresAt: 1709312400000, sessionId: "67d4e5f6..." }, id: ["xK9mP2..."] }` |
| `registration_failure` | `{ reason: string }` | Inscription échouée (`"email_already_exists"` ou message d'erreur) | `{ registration_failure: { reason: "email_already_exists" }, id: ["xK9mP2..."] }` |
| `user_disconnect_success` | `{}` | Déconnexion confirmée | `{ user_disconnect_success: {}, id: ["xK9mP2..."] }` |
| `session_refreshed` | `{ expiresAt: number }` | Session prolongée avec succès | `{ session_refreshed: { expiresAt: 1709398800000 }, id: ["xK9mP2..."] }` |
| `session_expired` | `{}` | Réponse à `session_refresh` quand la session n'existe plus | `{ session_expired: {}, id: ["xK9mP2..."] }` |
| `session_pending` | `{ requestId: string, deviceInfo: string, requesterInfo: string }` | Nouvelle connexion nécessite approbation | `{ session_pending: { requestId: "f47ac10b-...", deviceInfo: "Chrome sur Windows", requesterInfo: "Jean Dupont" }, id: ["aB3nQ7..."] }` |
| `session_pending_accepted` | `{ requestId: string }` | Approbation accordée (notification toast) | `{ session_pending_accepted: { requestId: "f47ac10b-..." }, id: ["aB3nQ7..."] }` |
| `session_pending_rejected` | `{ requestId: string }` | Approbation refusée (notification toast) | `{ session_pending_rejected: { requestId: "f47ac10b-..." }, id: ["aB3nQ7..."] }` |

### Interne (1 message)

| Message | Payload | Description | Exemple |
|---------|---------|-------------|---------|
| `client_deconnexion` | `string` (socketId) | Déclenché automatiquement quand un socket se déconnecte | `{ client_deconnexion: "xK9mP2...", id: "canalsocketio" }` |

### Dispatch (traitementMessage)

| Action (clé du message) | Méthode appelée | Exemple de payload |
|--------------------------|-----------------|-------------------|
| `login` | `this.login()` | `{ email: "john@example.com", password: "sha256...", deviceInfo: "web" }` |
| `authenticate` | `this.authenticate()` | `{ sessionId: "67a1b2c3..." }` |
| `register` | `this.register()` | `{ firstname: "John", lastname: "Doe", email: "john@example.com", password: "mdp", phone: "06..." }` |
| `user_disconnect` | `this.user_disconnect()` | `{}` |
| `session_refresh` | `this.session_refresh()` | `{}` |
| `session_pending_choice` | `this.resultManualSessionValidationByUser()` | `{ requestId: "req-001", accepted: true }` |
| `client_deconnexion` | `this.client_deconnexion()` | `{}` (automatic on socket disconnect) |

### Table d'assignation

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

## 7. Flux par scénario

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

### Flow 2 — Reconnexion (page refresh / reconnexion socket)

```
Client                                          Serveur
------                                          -------
authenticate { sessionId }
    │══════════════════════════════════════>     AuthService.authenticate()
                                                    ├─ Vérifie sessionId non vide
                                                    ├─ Session.getSession(sessionId)
                                                    ├─ Vérifie expiration (expiresAt > now)
                                                    ├─ User.findById() (charge les données user)
                                                    ├─ Session.getUserSocketIds(userId)
                                                    │
                                            ┌───────┴───────┐
                                      Pas de sockets     Sockets actifs
                                            │               │
                                      bindSocket()     Flow 7 (multi-session)
                                            │          → crée NOUVELLE session
                                            │
    <══════════════════════════════════      │
    auth_success { user, expiresAt }
    OU
    auth_failure { reason: "session_id_required" | "session_no_longer_exists"
                         | "session_expired" | "user_not_found" }
```

**Différence clé avec login :** Sans sockets actifs, `authenticate` réutilise la session existante (`bindSocket`). Avec approbation multi-session, une **nouvelle** session est créée — l'ancienne est abandonnée.

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

### Machine à états des sessions

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

### Référence rapide

| "Je veux..." | "...envoyer ce message" |
|--------------|-------------------------|
| Me connecter | `login { email, password, deviceInfo }` |
| Me reconnecter (page refresh) | `authenticate { sessionId }` |
| Créer un compte | `register { password, firstname, lastname, email, phone }` |
| Me déconnecter | `user_disconnect {}` |
| Prolonger ma session | `session_refresh {}` |
| Accepter une nouvelle connexion | `session_pending_choice { requestId, accepted: true }` |
| Refuser une nouvelle connexion | `session_pending_choice { requestId, accepted: false }` |

---

## 8. Types TypeScript

```typescript
type PendingSessionRequest = {
    socketId: string
    userId: string
    user: any
    deviceInfo: string
    timeout: NodeJS.Timeout
}

class AuthService extends ControllerService {
    private pendingRequests: Map<string, PendingSessionRequest>;
    traitementMessage(mesg: ControllerMessage): void;
}

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

## 9. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `ControllerService` | AuthService extends ControllerService | Hérite du pattern pub/sub |
| `User` | AuthService → User.getUser(), User constructor | Recherche et création d'utilisateurs |
| `Session` | AuthService → Session.* | Toutes les opérations de session (CRUD, bind, refresh) |
| `Controller` | AuthService ← Controller (messages) | Reçoit et émet les messages via le controleur |

---

## 10. Exemples

### Inscription au controleur (Controller.abstracts.ts)

```typescript
new AuthService(controleur, "AuthService",
    ["auth_success", "auth_failure", "login_success", "login_failure", "login_pending",
     "registration_success", "registration_failure", "user_disconnect_success",
     "session_refreshed", "session_expired", "session_pending", "session_pending_accepted", "session_pending_rejected"],
    ["authenticate", "login", "register", "user_disconnect", "session_refresh", "session_pending_choice", "client_deconnexion"]
);
```

### Flow login complet (message)

```typescript
// 1. Client envoie via CanalSocketio :
{ id: "xK9...", login: { email: "dev@visioconf.com", password: sha256("d3vV1s10C0nf"), deviceInfo: "web" } }

// 2. AuthService.traitementMessage() route vers this.login()
// 3. Réponse (pas de sessions existantes) :
{ id: "xK9...", login_success: { user: { firstname: "Admin", ... }, sessionId: "s1...", expiresAt: 1709312400000 } }

// 3bis. Réponse (sessions existantes — flow multi-session) :
{ id: "xK9...", login_pending: { requestId: "req-001" } }
```
