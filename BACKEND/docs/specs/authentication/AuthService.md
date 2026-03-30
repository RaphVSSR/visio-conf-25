# Referentiel de la classe AuthService — VisioConf

**Fichier source** : `BACKEND/src/models/services/authentication/AuthService.ts`
**Classe parente** : Aucune (autonome)

---

## 1. Description

`AuthService` gere toute l'authentification via le pattern pub/sub du controleur. Il gere le login, l'inscription, l'authentification par cookie, et la deconnexion socket. Il n'etend pas `ControllerService` — il possede ses propres references `controleur`, `nomDInstance` et Map `handlers`. La gestion des sessions est deleguee a `SessionManager`. Les sessions sont basees sur les cookies via `connect-mongodb-session`.

Le logout et le refresh de session passent par des routes REST (`/auth/logout`, `/auth/refresh`) definies dans `AuthRoutes.ts`.

---

## 2. Proprietes de la classe

| Propriete | Type | Visibilite | Description |
|-----------|------|------------|-------------|
| `controleur` | `any` | `public` | Reference au controleur pour l'envoi/reception de messages |
| `nomDInstance` | `string` | `public` | `"AuthService"` — nom d'inscription dans le controleur |
| `handlers` | `Map<string, MessageHandler>` | `private` | Map des noms de messages vers leurs fonctions de traitement |

---

## 3. Methodes

| Methode | Parametres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `register` | — | `void` | instance | Enregistre tous les handlers via `registerHandler()` et appelle `controleur.inscription()` |
| `traitementMessage` | `msg: any` | `void` | instance | Dispatcher principal. Extrait la cle d'action, recherche le handler, l'execute |
| `registerHandler` | `messageName: string, handler: MessageHandler` | `void` | `private` | Enregistre une fonction dans la Map `handlers` |
| `send` | `socketIds: string \| string[], messageName: string, payload: unknown` | `void` | `private` | Encapsule `controleur.envoie()`, normalise socketIds en tableau |
| `login` | `socketId: string, payload: { email, password, deviceInfo }` | `Promise<void>` | `private` | Authentification par identifiants. Verifie email/password, lie la session |
| `authenticate` | `socketId: string` | `Promise<void>` | `private` | Reconnexion via cookie. Pas de payload — userId resolu depuis `SessionManager.getUserId(socketId)` |
| `handleRegister` | `socketId: string, payload: { password, firstname, lastname, email, phone }` | `Promise<void>` | `private` | Cree un compte, hache le mot de passe, lie la session |
| `socketDisconnect` | `socketId: string` | `void` | `private` | Gere la deconnexion socket. Delie la session via `SessionManager.unbind()` |
| `bindSession` | `socketId: string, userId: string` | `number` (expiresAt) | `private static` | Appelle `SessionManager.bind()`, retourne le timestamp `expiresAt` |
| `sanitizeUser` | `user: Record<string, any>` | `object` | `private static` | Supprime le champ `password` de l'objet utilisateur |
| `parseDeviceInfo` | `ua: string` | `string` | `private static` | Parse la chaine user-agent en format lisible (ex. "Chrome sur Windows") |
| `hashPassword` | `password: string` | `string` | `private static` | Hash SHA256 du mot de passe |
| `verifyPassword` | `password: string, hash: string` | `boolean` | `private static` | Compare le hash SHA256 avec le hash stocke |

---

## 4. Inscription au Controleur

```typescript
const authService = new AuthService(controleur, "AuthService")
authService.register()
```

```typescript
register() {
    this.registerHandler("login", this.login)
    this.registerHandler("authenticate", this.authenticate)
    this.registerHandler("register", this.handleRegister)
    this.registerHandler("socket_disconnect", this.socketDisconnect)

    const outgoing = [...getMessagesByDomain("auth").received, ...getMessagesByDomain("socket").received]
    this.controleur.inscription(this, outgoing, [...this.handlers.keys()])
}
```

Sortants (le serveur peut emettre) : `login_response`, `register_response`, `authenticate_response`, `socket_disconnect`
Entrants (le serveur ecoute) : `login`, `authenticate`, `register`, `socket_disconnect`

---

## 5. Catalogue des messages

**Total : 3 client->serveur (Socket.io) + 2 client->serveur (REST) + 3 serveur->client + 1 interne = 9 messages**

### Client -> Serveur (Socket.io)

| Message | Payload | Description | Exemple |
|---------|---------|-------------|---------|
| `login` | `{ email: string, password: string, deviceInfo: string }` | Connexion avec identifiants | `{ login: { email: "dev@visioconf.com", password: "a1b2c3...", deviceInfo: "Mozilla/5.0..." }, id: "xK9mP2..." }` |
| `register` | `{ password: string, firstname: string, lastname: string, email: string, phone: string }` | Creation de compte | `{ register: { password: "mdp", ... }, id: "xK9mP2..." }` |
| `authenticate` | — (pas de payload, cookie envoye automatiquement) | Reconnexion via session cookie | `{ authenticate: {}, id: "xK9mP2..." }` |

### Client -> Serveur (REST — AuthRoutes.ts)

| Endpoint | Methode | Description |
|----------|---------|-------------|
| `/auth/refresh` | `POST` | Prolonge la session. Repond `{ status: "refreshed", expiresAt }` ou `{ status: "failure", reason }` |
| `/auth/logout` | `POST` | Detruit la session + clear cookie. Repond `{ status: "disconnected" }` |

### Interne

| Message | Source | Description |
|---------|--------|-------------|
| `socket_disconnect` | CanalSocketio | Declenche par la deconnexion du socket. Appelle `SessionManager.unbind()` |

### Serveur -> Client (Socket.io)

| Message | Status | Payload | Exemple |
|---------|--------|---------|---------|
| `login_response` | `"success"` | `{ status, user, expiresAt }` | `{ login_response: { status: "success", user: {...}, expiresAt: 170... }, id: ["xK9..."] }` |
| | `"failure"` | `{ status, reason: "user_not_found" \| "wrong_password" }` | `{ login_response: { status: "failure", reason: "wrong_password" }, id: ["xK9..."] }` |
| `register_response` | `"success"` | `{ status, user, expiresAt }` | `{ register_response: { status: "success", user: {...}, expiresAt: 170... }, id: ["xK9..."] }` |
| | `"failure"` | `{ status, reason: "email_already_exists" \| string }` | `{ register_response: { status: "failure", reason: "email_already_exists" }, id: ["xK9..."] }` |
| `authenticate_response` | `"success"` | `{ status, user, expiresAt }` | `{ authenticate_response: { status: "success", user: {...}, expiresAt: 170... }, id: ["xK9..."] }` |
| | `"failure"` | `{ status, reason: "session_expired" \| "user_not_found" }` | `{ authenticate_response: { status: "failure", reason: "session_expired" }, id: ["xK9..."] }` |

### Dispatch (traitementMessage)

| Cle du message | Methode handler | Payload |
|----------------|-----------------|---------|
| `login` | `this.login` | `{ email, password, deviceInfo }` |
| `authenticate` | `this.authenticate` | — (pas de payload) |
| `register` | `this.handleRegister` | `{ firstname, lastname, email, password, phone }` |
| `socket_disconnect` | `this.socketDisconnect` | `string` (socketId) |

### Table d'assignation

| Message | Emetteur | Recepteur |
|---------|----------|-----------|
| `login` | AuthContext (LoginForm) | AuthService |
| `register` | AuthContext (SignupForm) | AuthService |
| `authenticate` | AuthContext | AuthService |
| `login_response` | AuthService | AuthContext |
| `register_response` | AuthService | AuthContext |
| `authenticate_response` | AuthService | AuthContext |

---

## 6. Flux de scenarios

> Voir [auth-flows.md](../../flows/auth-flows.md)

---

## 7. Types TypeScript

```typescript
type MessageHandler = (socketId: string, payload: any) => void

class AuthService {
    controleur: any
    nomDInstance: string
    private handlers: Map<string, MessageHandler>
    register(): void
    traitementMessage(msg: any): void
}

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

interface LoginResponse {
    status: "success" | "failure"
    user?: User
    expiresAt?: number
    reason?: "user_not_found" | "wrong_password"
}

interface RegisterResponse {
    status: "success" | "failure"
    user?: User
    expiresAt?: number
    reason?: "email_already_exists" | string
}

interface AuthenticateResponse {
    status: "success" | "failure"
    user?: User
    expiresAt?: number
    reason?: "session_expired" | "user_not_found"
}
```

---

## 8. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `SessionManager` | AuthService -> SessionManager.bind/unbind/getUserId | Gestion des sessions en memoire |
| `User` | AuthService -> User.getUser(), User constructor | Recherche et creation d'utilisateurs |
| `Controller` (controleur) | AuthService <-> Controller (messages) | Recoit et emet des messages via le pub/sub |
| `ListeMessages` | AuthService -> getMessagesByDomain() | Recupere les listes de messages pour l'inscription |
| `AuthRoutes` | Routes REST complementaires | `/auth/refresh` et `/auth/logout` |

---

## 9. Exemples

### Flux complet de connexion (messages)

```typescript
// 1. Le client envoie via CanalSocketio :
{ id: "xK9...", login: { email: "dev@visioconf.com", password: sha256("d3vV1s10C0nf"), deviceInfo: "Mozilla/5.0..." } }

// 2. AuthService.traitementMessage() recherche "login" dans la Map handlers -> appelle this.login()
// 3. Reponse :
{ id: ["xK9..."], login_response: { status: "success", user: { firstname: "Admin", ... }, expiresAt: 1709312400000 } }
```
