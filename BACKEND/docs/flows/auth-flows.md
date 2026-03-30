# Architecture d'authentification — VisioConf

## Vue d'ensemble

L'authentification passe entièrement par **Socket.io + Controleur.js** (pattern pub/sub). Pas de REST pour l'auth de base (login, register, authenticate). Les sessions sont basées sur des cookies via `connect-mongodb-session`.

```
FRONTENDV2                                              BACKEND
==========                                              =======

 LoginForm ---+                                    +-- AuthService.ts
 SignupForm --|                                    |     pattern autonome
              |                                    |     utilise: SessionManager, User
              v                                    v
      AuthContext.tsx                         controleur.js
        utilise AuthSync                           ^         |
              |         ^                          |         v
              v         |                    canalsocketio.js
      AuthSync.ts                               inscrit via inscription()
        utilise MessageClientAdapter               ^
              |         ^                          |
              v         |                          |
      MessageClientAdapter.ts                      |
        enveloppe socket.io-client                 |
              |         ^                          |
              +=========|=== Socket.io ============+
                        |
  AuthToasts <--+ (affiche les infos depuis AuthContext)
```

### Routage symétrique des messages

```
Envoi:     MessageClientAdapter.emit() --> socket.emit() --> canalsocketio.envoie() --> controleur --> Service.traitementMessage()
Réception: Service.envoie() --> controleur --> canalsocketio.traitementMessage() --> socket.emit() --> MessageClientAdapter.on()
```

---

## Modèle de confiance

```
1. Le socket se connecte
        |
        v
2. Le client envoie `authenticate` (pas de payload — cookie envoyé automatiquement)
        |
        v
3. Le serveur vérifie la session via connect-mongodb-session (cookie)
        |
   +----+----+
   | Valide  | Invalide
   v         v
4. SessionManager       authenticate_response
   .bind(socketId,       { status: "failure" }
    userId)
   socket.join(userId)
        |
        v
5. Le socket est FIABLE
   Tous les messages passent par ce socket
   Pas de vérification par message
        |
        v
6. SessionManager.getUserId(socketId) --> userId
   Lit session.userId depuis socket.request.session
        |
        v
7. Le socket se déconnecte --> AuthService.socketDisconnect()
   --> SessionManager.unbind(socketId)
   Confiance révoquée
```

---

## Responsabilités Frontend / Serveur

| Frontend (lecture + affichage) | Serveur (décision + modification) |
|-------------------------------|-----------------------------------|
| Lit `expiresAt` pour la modale | Crée / rafraîchit / invalide les sessions |
| Affiche le statut de session, alertes | Gère le store de sessions via connect-mongodb-session |
| Calcule le timer local à partir des données | Mappe socket → session en mémoire (SessionManager) |
| Envoie les décisions utilisateur via messages | Configure le cookie via express-session + connect-mongodb-session |
| Cookie géré automatiquement par le navigateur | |

---

## Cycle de vie d'une session

```
          +-------------+
          |   CRÉÉE      | <-- succès login/register
          +------+-------+
                 |
                 v
          +-------------+
          |   ACTIVE     | <-- session en cours, socket mappé
          +------+-------+
                 |
         +-------+-------+
         |       |       |
         v       v       v
    +--------+ +------+ +-----------+
    |AVERTIS.| |LOGOUT| |SOCKET     |
    |(30 min)| |      | |DÉCONNEXION|
    | client | |      | |           |
    +---+----+ +--+---+ +-----+-----+
        |         |           |
   +----+----+    |     La session reste
   |    |    |    |     active dans le store
   v    v    v    v     (reconnexion possible)
 REFRESH IGNORER EXPIRE
   |       |      |
   v       v      v
 ACTIVE  EXPIRE  INVALIDÉE
```

---

## Flux par scénario

### Flux 1 — Login (connexion fraîche)

```
Client                                          Serveur
------                                          -------
login { email, password, deviceInfo }
    |======================================>     AuthService.login()
                                                    +-- User.getUser(email)
                                                    +-- verifyPassword(password, user.password)
                                                    +-- bindSession(socketId, userId)
                                                    |
    <======================================
    login_response { status: "success", user, expiresAt }
    OU
    login_response { status: "failure", reason }
```

**Côté frontend :** Sur `login_response { status: "success" }`, le timer d'expiration démarre et le state passe à `isAuthenticated: true`. Sur `status: "failure"`, le state est réinitialisé.

### Flux 2 — Reconnexion (rafraîchissement de page / reconnexion socket)

```
Client                                          Serveur
------                                          -------
authenticate {}    (pas de payload — session lue depuis socket.request.session)
    |======================================>     AuthService.authenticate()
                                                    +-- SessionManager.getUserId(socketId)
                                                    +-- User.model.findById(userId)
                                                    +-- bindSession(socketId, userId)
                                                    |
    <======================================
    authenticate_response { status: "success", user, expiresAt }
    OU
    authenticate_response { status: "failure", reason: "session_expired"
                         | "user_not_found" }
```

**Différence clé avec le login :** `authenticate` ne prend pas de payload — la session est lue depuis `socket.request.session` (cookie via connect-mongodb-session). SessionManager résout le userId via `getUserId()` qui lit `session.userId`.

**Côté frontend :** `authenticate` est envoyé automatiquement à l'init d'AuthSync et sur `socket.io.reconnect`. Sur `status: "success"`, le timer démarre. Sur `status: "failure"`, le state est réinitialisé.

### Flux 3 — Inscription

```
Client                                          Serveur
------                                          -------
register { password, firstname, lastname, email, phone }
    |======================================>     AuthService.register()
                                                    +-- Vérifier unicité email
                                                    +-- hashPassword()
                                                    +-- Créer User en DB
                                                    +-- bindSession()
                                                    |
    <======================================
    register_response { status: "success", user, expiresAt }
    OU
    register_response { status: "failure", reason }
```

**Côté frontend :** Identique à `login_response { status: "success" }` — timer démarre, `isAuthenticated: true`.

### Flux 4 — Déconnexion volontaire (logout)

```
Client                                          Serveur
------                                          -------
POST /api/auth/logout  (cookie envoyé automatiquement)
    |======================================>     Lit la session depuis le cookie
                                                    +-- SessionManager.unbind() pour chaque socket
                                                    +-- session.destroy()
    <==== HTTP Response ================
    Set-Cookie: visioconf_session=; maxAge=0
    Body: { status: "disconnected" }
```

**Côté frontend :** Sur réception de la réponse, le timer est nettoyé et tout le state est réinitialisé.

### Flux 5 — Avertissement d'expiration

```
Client (timer local)                            Serveur
------                                          -------
Le timer déclenche REACT_APP_SESSION_EXPIRY_WARNING_MS
avant expiresAt
AuthToasts affiche le toast d'expiration
    |
    +-- [OUI - Prolonger]
    |   POST /api/auth/refresh  (cookie envoyé automatiquement)
    |   |==============================>     Lit la session depuis le cookie
    |                                           +-- session.cookie.maxAge = nouvelle durée
    |                                           +-- session.save()
    |   <==== HTTP Response ============
    |   Set-Cookie: visioconf_session=...; maxAge=24h
    |   Body: { status: "refreshed", expiresAt }
    |
    +-- [NON - Ignorer]
    |   Modale fermée, la session expire naturellement
    |   MongoDB TTL supprime la session
    |   (pas de notification proactive)
    |   --> Flux 6 au prochain accès
```

**Côté frontend :** Le timer est géré par AuthSync. Sur réception de `{ status: "refreshed" }`, un nouveau timer démarre et `showExpiryWarning` passe à `false`.

### Flux 6 — Retour après expiration hors ligne

```
Client                                          Serveur
------                                          -------
L'utilisateur revient après expiration
authenticate {}
    |======================================>     AuthService.authenticate()
                                                    Session expirée ou supprimée
    <======================================
    authenticate_response { status: "failure", reason: "session_expired" | "user_not_found" }
    |
    v
Page de login affichée
```

### Flux 7 — Déconnexion socket (perte de connexion)

```
Client                                          Serveur
------                                          -------
[Le socket se déconnecte]
                                                canalsocketio détecte la déconnexion
                                                    |
                                                    v
                                                socket_disconnect (socketId)
                                                    |======>  AuthService.socketDisconnect()
                                                              +-- SessionManager.unbind(socketId)
                                                              |  (quitte le room Socket.io, efface session.userId)
                                                              +-- Pas de message retour

[Le socket se reconnecte]
authenticate {}
    |======================================>     --> Flux 2
```

**Pas de suppression de session.** La session reste dans le store (reconnexion possible). Seul le mapping socket en mémoire est effacé. La session expire naturellement via MongoDB TTL si le client ne revient pas.

---

## Gestion de la mémoire

### Mapping socket ↔ session (SessionManager via rooms Socket.io)

SessionManager utilise les **rooms Socket.io** + **express-session** pour le mapping socket-utilisateur. `bind()` écrit le `userId` dans `socket.request.session` et joint le socket à un room nommé d'après le userId. `getUserSocketIds()` lit les membres du room.

| Opération | Méthode | Description |
|-----------|---------|-------------|
| Lier un socket à un utilisateur | `SessionManager.bind(socketId, userId)` | Écrit session.userId + socket.join(userId) |
| Trouver l'utilisateur d'un socket | `SessionManager.getUserId(socketId)` | Lit socket.request.session.userId |
| Lister les sockets d'un utilisateur | `SessionManager.getUserSocketIds(userId)` | Lit le room Socket.io du userId |
| Vérifier les sessions actives | `SessionManager.hasActiveSessions(userId)` | Vérifie taille du room > 0 |
| Rafraîchir la session | `SessionManager.refreshSession(socketId)` | Met à jour cookie.maxAge + session.save() |
| Délier un socket | `SessionManager.unbind(socketId)` | socket.leave(userId) + supprime session.userId |
| Obtenir la durée de session | `SessionManager.getSessionDurationMs()` | Parse la variable SESSION_DURATION |

**Nettoyage :**
- **Déconnexion socket** : `SessionManager.unbind()` quitte le room Socket.io + efface session.userId. La session reste dans le store (reconnexion possible).
- **Invalidation de session** (logout) : `SessionManager.unbind()` efface session.userId, la session reste dans le store MongoDB jusqu'à expiration TTL.

### Nettoyage des sessions dans le store
- Les sessions ont un champ `expiresAt` avec un index TTL → MongoDB supprime automatiquement les documents expirés.
- Pas de nettoyage manuel nécessaire.

---

## Sessions basées sur les cookies

**Sessions gérées via `express-session` + `connect-mongodb-session` :**
```
Cookie défini par le serveur | httpOnly | secure (en prod) | sameSite | envoyé automatiquement à chaque requête
```

Le navigateur envoie automatiquement le cookie de session avec chaque connexion Socket.io et chaque requête HTTP REST. Pas de gestion manuelle de sessionId côté frontend. Pas de `sessionStorage`, pas de `localStorage`.

Le store de sessions est sauvegardé dans MongoDB via `connect-mongodb-session`. Le serveur lit la session depuis le cookie à chaque requête `authenticate`.

**Pourquoi les cookies plutôt que sessionStorage :** Les cookies sont envoyés automatiquement par le navigateur, éliminant le besoin de gestion manuelle du sessionId. `httpOnly` empêche l'accès XSS à l'identifiant de session.

---

## Variables d'environnement

### Backend

| Variable | Type | Exemple | Description |
|----------|------|---------|-------------|
| `SESSION_DURATION` | string (zeit/ms) | `24h` | Durée de vie d'une session |
| `SESSION_SECRET` | string | `"your-secret"` | Secret pour la signature du cookie express-session |

### Frontend

| Variable | Type | Exemple | Description |
|----------|------|---------|-------------|
| `REACT_APP_SESSION_EXPIRY_WARNING_MS` | int (ms) | `1800000` | Délai avant expiration pour afficher la modale d'avertissement (30 min) |

---

## Modèle de sécurité

1. **Mots de passe** : hashés avec SHA256 via `js-sha256` avant stockage.
2. **Sessions** : vérifiées via le store cookie à chaque reconnexion.
3. **Pas de vérification par message** : la connexion TCP persistante EST l'ancre de confiance.
4. **Sessions dans le store** : suppression automatique via MongoDB TTL.
5. **Cookie de session** : `httpOnly`, géré automatiquement par le navigateur, envoyé via le handshake Socket.io et les requêtes REST.

---

## Fichiers clés

### Backend

| Fichier | Rôle |
|---------|------|
| `src/controller/controleur.js` | Bus de messages (pub/sub) |
| `src/controller/canalsocketio.js` | Pont Socket.io ↔ controleur |
| `src/models/services/authentication/AuthService.ts` | Logique d'auth, handlers de messages |
| `src/models/services/authentication/SessionManager.ts` | Mapping socket-session via rooms Socket.io |
| `src/models/ListeMessages.ts` | Catalogue de tous les messages |
| `src/index.ts` | Initialisation (controleur + services) |

### Frontend

| Fichier | Rôle |
|---------|------|
| `src/services/MessageClientAdapter.ts` | Wrapper Socket.io (remplace controleur.js + canalsocketio.js côté frontend) |
| `src/services/auth/AuthSync.ts` | Service de synchronisation auth, gère les messages et le state |
| `src/services/auth/AuthSync.types.ts` | Types pour AuthState, AuthUser, AuthActions |
| `src/contexts/AuthContext.tsx` | Provider React, instancie AuthSync + expose le state |
| `src/components/AuthToasts/` | Toast d'avertissement d'expiration |
| `src/components/LoginForm/` | Formulaire de login |
| `src/components/SignupForm/` | Formulaire d'inscription |

---

## Points en suspens

### 1. Hashage SHA256 des mots de passe

Les mots de passe sont hashés avec SHA256 (`js-sha256`). SHA256 est un hash rapide, ce qui le rend vulnérable aux attaques par force brute. En production, `bcrypt` ou `argon2` seraient recommandés (hash lent avec sel intégré).

**Note :** ce choix est intentionnel pour le développement actuel. À revoir avant la mise en production.
