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

Voir `BACKEND/docs/auth-messages.md` pour le catalogue complet (18 messages).

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

---

## 7. Types TypeScript

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
```

---

## 8. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `ControllerService` | AuthService extends ControllerService | Hérite du pattern pub/sub |
| `User` | AuthService → User.getUser(), User constructor | Recherche et création d'utilisateurs |
| `Session` | AuthService → Session.* | Toutes les opérations de session (CRUD, bind, refresh) |
| `Controller` | AuthService ← Controller (messages) | Reçoit et émet les messages via le controleur |

---

## 9. Exemples

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
