# Architecture d'Authentification — VisioConf

## Vue d'ensemble

L'authentification fonctionne entièrement via **Socket.io + Controleur.js** (pattern pub/sub). Pas de REST pour l'auth.

```
FRONTENDV2                                              BACKEND
==========                                              =======

 LoginForm ──┐                                    ┌── AuthService.ts
 SignupForm ──┤                                    │     s'inscrit via inscription()
              │                                    │     utilise: Session, User
              v                                    v
      AuthContext.tsx                         controleur.js
        s'inscrit via inscription()                ^         |
              |         ^                          |         v
              v         |                    canalsocketio.js
      controleur.js                            s'inscrit via inscription()
              ^         |                          ^
              |         v                          |
      canalsocketio.js                             |
        s'inscrit via inscription()                |
              |         ^                          |
              +=========|=== Socket.io ============+
                        |
  SessionExpiryModal <──┘ (affiche les infos depuis AuthContext)
```

### Routage symétrique des messages

```
Envoi :    Service.envoie() → controleur → canalsocketio.traitementMessage() → socket.emit()
Réception: socket.on() → canalsocketio.envoie() → controleur → Service.traitementMessage()
```

---

## Modèle de confiance

```
1. Socket se connecte
        │
        v
2. Client envoie `authenticate` avec sessionId
        │
        v
3. Serveur vérifie la session en DB (existe + non expirée)
        │
   ┌────┴────┐
   │ Valide  │ Invalide
   v         v
4. Session.bindSocket()   auth_failure
   socketId sauvé en DB sur la Session
        │
        v
5. Socket est TRUSTED
   Tous les messages passent par cette socket
   Pas de vérification par message
        │
        v
6. Session.getSessionBySocket(socketId) → session → userId
   Lookup via requête MongoDB (index sur socketId)
        │
        v
7. Socket se déconnecte → Session.clearSocket()
   Confiance révoquée
```

---

## Responsabilités Frontend / Serveur

| Frontend (lecture + affichage) | Serveur (décision + modification) |
|-------------------------------|-----------------------------------|
| Lit `expiresAt` pour la modale | Crée / rafraîchit / invalide les sessions |
| Affiche le statut de session, les alertes | Gère les records Session en DB |
| Calcule le timer local à partir des données | Mappe socket → session en DB (Session.bindSocket) |
| Envoie les décisions utilisateur via messages | Approuve / rejette les demandes multi-session |
| Stocke le sessionId dans `sessionStorage` (isolé par onglet) | Envoie le sessionId via Socket.io |

---

## Cycle de vie d'une session

```
          ┌─────────────┐
          │   CREATED    │ ← login/register réussi
          └──────┬───────┘
                 │
                 v
          ┌─────────────┐
          │   ACTIVE     │ ← session en cours, socket mappé
          └──────┬───────┘
                 │
         ┌───────┼───────┐
         │       │       │
         v       v       v
    ┌────────┐ ┌──────┐ ┌───────────┐
    │WARNING │ │LOGOUT│ │SOCKET     │
    │(30 min)│ │      │ │DISCONNECT │
    │ client │ │      │ │           │
    └───┬────┘ └──┬───┘ └─────┬─────┘
        │         │           │
   ┌────┼────┐    │     Session reste
   │    │    │    │     active en DB
   v    v    v    v     (reconnexion possible)
 REFRESH IGNORE EXPIRE
   │       │      │
   v       v      v
 ACTIVE  EXPIRE  INVALIDATED
```

---

## Flux d'approbation multi-session

Déclenché quand un utilisateur tente un **login** ou un **authenticate** et qu'il existe déjà des sockets actifs pour cet utilisateur.

```
DEVICE 2 (nouveau)        SERVEUR                    DEVICE 1 (existant)
──────────────────        ───────                    ───────────────────
login {email, password, deviceInfo}
        │
        │ ══════════>     Credentials valides ✓
                          Sessions actives existent ?
                          OUI → créer demande en attente
                                │                           │
        <══════════ │     login_pending ──────────>   session_pending
                          { requestId }               { requestId,
                                                        requesterInfo }
                                                           │
                                                     [ACCEPTER / REFUSER]
                                                           │
                          <═══════════════════════   session_pending_choice
                                                     { requestId, accepted }
                          │
                    ┌─────┴──────┐
                ACCEPTÉ       REFUSÉ
                    │            │
              Créer session   Refuser login
                    │            │
                    │             │
        <══════════ │    login_failure ──────────> session_pending_rejected
        login_success     { reason: "rejected" }   { requestId }
        { user, sessionId,
          expiresAt }
                    │
        session_pending_accepted ──────────>
        { requestId }

                    ─── TIMEOUT (pas de réponse) ───
              Auto-rejet après le délai configuré
              login_failure { reason: "timeout" }
              + session_pending_rejected → Device 1
```

**Règles :**
- **Première réponse gagne** : si plusieurs sessions existent, la première à répondre fait autorité
- **Auto-rejet au timeout** : si aucune session ne répond dans le délai, le login est refusé
- **Réponses tardives ignorées** : une fois résolu, les réponses suivantes sont ignorées

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

**Côté frontend :** Sur `login_success`, le sessionId est stocké dans `sessionStorage`, le timer d'expiration démarre, et l'état passe à `isAuthenticated: true`. Sur `login_failure`, `sessionStorage` est vidé.

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
                                            │            (l'ancienne est abandonnée)
    <══════════════════════════════════      │
    auth_success { user, expiresAt }
    OU
    auth_failure { reason: "session_id_required" | "session_no_longer_exists"
                         | "session_expired" | "user_not_found" }
```

**Différence clé avec login :** Quand aucun socket n'est actif, `authenticate` réutilise la session existante (`bindSocket`). Mais quand l'approbation multi-session est déclenchée puis acceptée, une **nouvelle** session est créée (même `userId`) — l'ancienne session (du `sessionStorage`) est abandonnée.

**Côté frontend :** `authenticate` est envoyé automatiquement à l'init du `AuthService` si un sessionId existe dans `sessionStorage`, et aussi sur `socket.io.reconnect`. Sur `auth_success`, le timer d'expiration démarre. Sur `auth_failure`, `sessionStorage` est vidé et le state est réinitialisé.

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

**Côté frontend :** Identique à `login_success` — sessionId stocké, timer démarré, `isAuthenticated: true`.

### Flow 4 — Déconnexion volontaire (logout)

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
    OU (si pas de session trouvée)
    auth_failure { reason: "not_authenticated" }
```

**Côté frontend :** `sessionStorage` est vidé **côté client avant la réponse** (dans `logout()`). Sur `user_disconnect_success`, le timer est nettoyé et tout le state est réinitialisé.

### Flow 5 — Avertissement d'expiration

```
Client (timer local)                            Serveur
------                                          -------
Timer déclenché REACT_APP_SESSION_EXPIRY_WARNING_MS
avant expiresAt
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

**Côté frontend :** Le timer est géré par `startExpiryTimer()` dans le `AuthService` frontend. Sur `session_refreshed`, un nouveau timer est démarré et `showExpiryWarning` passe à `false`.

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

**Si `session_refresh` est tenté quand la session n'existe plus :** le serveur répond `session_expired {}` au lieu de `session_refreshed`. Côté frontend, cela déclenche le nettoyage complet (timer, sessionStorage, state).

### Flow 7 — Approbation multi-session

Déclenché par Flow 1 (login) ou Flow 2 (authenticate) quand des sockets actifs existent pour l'utilisateur.

```
Device 2 (nouveau)         Serveur                Device 1 (existant)
──────────────────         ───────                ───────────────────
login / authenticate
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

**Côté frontend (Device 2) :** `login_pending` met `pendingLoginRequestId` dans le state → UI affiche un état d'attente.

**Côté frontend (Device 1) :** `session_pending` ajoute la demande dans `pendingSessionRequests[]` → `SessionPendingModal` s'affiche. L'utilisateur clique accepter/refuser → `session_pending_choice` envoyé. Sur `session_pending_accepted`/`session_pending_rejected`, la demande est retirée du state.

**Règles :**
- **Première réponse gagne** : si plusieurs sessions existent, la première à répondre fait autorité
- **Auto-rejet au timeout** : si aucune session ne répond dans le délai (`SESSION_APPROVAL_TIMEOUT_SECONDS`), le login est refusé
- **Réponses tardives ignorées** : une fois résolu, les réponses suivantes sont ignorées
- **Résultat identique pour login et authenticate** : dans les deux cas, l'approbation crée une **nouvelle** session

### Flow 8 — Déconnexion socket (perte de connexion)

```
Client                                          Serveur
------                                          -------
[Socket se déconnecte]
                                                canalsocketio détecte la déconnexion
                                                    │
                                                    v
                                                client_deconnexion (socketId)
                                                    │══════>  AuthService.client_deconnexion()
                                                              ├─ Session.clearSocket(socketId)
                                                              │  ($unset socketId sur le document)
                                                              └─ Pas de message de retour

[Socket se reconnecte]
authenticate { sessionId }
    │══════════════════════════════════════>     → Flow 2
```

**Pas de suppression de session.** La session reste en DB (reconnexion possible). Seul le `socketId` est dissocié. La session expirera naturellement via le TTL MongoDB si le client ne revient pas.

---

## Gestion de la mémoire

### Mapping socket ↔ session (via MongoDB)

Le mapping socket → utilisateur est géré **entièrement en DB** via le champ `socketId` du modèle `Session` (index MongoDB sur `socketId`).

| Opération | Méthode | Description |
|-----------|---------|-------------|
| Associer socket à session | `Session.bindSocket(sessionId, socketId)` | Appelé à l'`authenticate` |
| Trouver session par socket | `Session.getSessionBySocket(socketId)` | Requête MongoDB |
| Lister sockets d'un user | `Session.getUserSocketIds(userId)` | Pour le broadcast multi-onglets |
| Dissocier socket | `Session.clearSocket(socketId)` | Appelé à la déconnexion socket |

### État en mémoire (AuthService)

| Structure | Type | Contenu |
|-----------|------|---------|
| `pendingRequests` | `Map<requestId, PendingRequest>` | Demandes d'approbation multi-session en attente |

**Nettoyage :**
- **Déconnexion socket** : `Session.clearSocket()` retire le `socketId` du document en DB. La Session reste active (reconnexion possible).
- **Invalidation session** (logout) : `Session.deleteSession()` supprime le document en DB.
- **Demandes en attente** : nettoyées à la résolution ou au timeout (+ `clearTimeout`).

### Nettoyage des sessions en DB
- Les sessions ont un champ `expiresAt` avec un index TTL → MongoDB supprime automatiquement les documents expirés.
- Pas de sweep manuel nécessaire.

---

## SessionStorage & Session

**SessionId stocké dans `sessionStorage` côté frontend :**
```
clé: process.env.REACT_APP_SESSION_STORAGE_KEY | isolé par onglet | pas de persistance après fermeture
```

Chaque onglet stocke son propre sessionId dans `sessionStorage`. Le backend gère les sessions en DB et envoie le sessionId via Socket.io. Le frontend utilise `sessionStorage.getItem()` / `setItem()` / `removeItem()` — pas de cookies.

Le sessionId est un ObjectId MongoDB (24 caractères hexadécimaux). Pas de JWT — la session est vérifiée directement en DB à chaque reconnexion.

**Pourquoi `sessionStorage` et pas cookies/localStorage :** Isolation par onglet. Un onglet rejeté par le flux multi-session ne supprime pas le sessionId des autres onglets. L'expiration est gérée côté serveur (TTL MongoDB), pas côté client.

---

## Variables d'environnement

### Backend

| Variable | Type | Exemple | Description |
|----------|------|---------|-------------|
| `SESSION_DURATION` | string (zeit/ms) | `24h` | Durée de vie de la session |
| `SESSION_APPROVAL_TIMEOUT_SECONDS` | int | `60` | Timeout pour l'approbation multi-session |

### Frontend

| Variable | Type | Exemple | Description |
|----------|------|---------|-------------|
| `REACT_APP_SESSION_STORAGE_KEY` | string | `"visioconf_session"` | Clé utilisée dans `sessionStorage` pour stocker le sessionId |
| `REACT_APP_SESSION_EXPIRY_WARNING_MS` | int (ms) | `1800000` | Délai avant expiration pour afficher la modale d'avertissement (30 min) |

---

## Modèle de sécurité

1. **Mots de passe** : hachés en SHA256 via `js-sha256` avant stockage.
2. **Sessions** : vérifiées en DB à chaque reconnexion (existence + expiration).
3. **Pas de vérification par message** : la connexion TCP persistante EST l'ancre de confiance.
4. **Sessions en DB** : suppression automatique via TTL MongoDB.
5. **Multi-session** : les nouvelles connexions doivent être approuvées par les sessions existantes.
6. **SessionId côté client** : stocké dans `sessionStorage` (isolé par onglet), envoyé via Socket.io pour l'authentification.
7. **Session.userId** : stocké en `ObjectId` avec `ref: "User"` (pas en string).

---

## Fichiers clés

### Backend

| Fichier | Rôle |
|---------|------|
| `src/Controller/controleur.js` | Bus de messages (pub/sub) |
| `src/canalsocketio.js` | Pont Socket.io ↔ controleur |
| `src/models/services/authentication/AuthService.ts` | Logique auth, handlers de messages |
| `src/models/services/authentication/Session.ts` | Modèle MongoDB des sessions |
| `src/ListeMessages.ts` | Catalogue de tous les messages |
| `src/index.ts` | Initialisation (controleur + services) |

### Frontend

| Fichier | Rôle |
|---------|------|
| `src/Controller/controleur.js` | Bus de messages (pub/sub) |
| `src/Controller/canalsocketio.js` | Pont Socket.io ↔ controleur |
| `src/Controller/Controller.service.ts` | Classe abstraite ControllerService (côté frontend) |
| `src/services/auth/AuthService.ts` | Service auth frontend (ControllerService), gère les messages et le state |
| `src/services/auth/AuthService.types.ts` | Types AuthState, AuthUser, AuthActions |
| `src/services/SocketIO.ts` | Initialisation Socket.io côté frontend |
| `src/contexts/AuthContext.tsx` | Provider React, instancie AuthService + expose le state |
| `src/hooks/useAuth.ts` | Hook pour consommer l'état auth |
| `src/components/SessionExpiryModal/` | Modales d'expiration et d'approbation |
| `src/components/LoginForm/` | Formulaire de connexion |
| `src/components/SignupForm/` | Formulaire d'inscription |

---

## Problèmes restants

### 1. Hachage SHA256 des mots de passe

Les mots de passe sont hachés en SHA256 (`js-sha256`). SHA256 est un hash rapide, ce qui le rend vulnérable aux attaques par force brute. Pour la production, `bcrypt` ou `argon2` serait recommandé (hash lent avec salt intégré).

**Note :** ce choix est volontaire pour le développement actuel. À revisiter avant mise en production.
