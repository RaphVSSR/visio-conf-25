# Stratégie de session cookie — VisioConf

## Problème actuel

Les sessions sont gérées par `express-session` + `connect-mongodb-session`. Le cookie est transmis au navigateur **uniquement lors du handshake HTTP** de Socket.io (upgrade WebSocket). Après ça, la connexion est un WebSocket pur — aucun moyen d'envoyer un header `Set-Cookie`.

### Conséquence : dérive du cookie

```
10:00  Socket se connecte (handshake HTTP)
       → express-session crée la session en MongoDB
       → Set-Cookie: visioconf_session=...; maxAge=24h    ← navigateur reçoit le cookie
       → cookie expire à 10:00 le lendemain

10:01  login { email, password }  (WebSocket)
       → SessionManager.bind() écrit userId dans la session
       → session.save() → MongoDB mis à jour
       → PAS de Set-Cookie (WebSocket, pas HTTP)

22:00  L'utilisateur clique "Prolonger"
       → SessionManager.refreshSession() → session.cookie.maxAge = 24h
       → session.save() → MongoDB mis à jour (expire maintenant à 22:00 lendemain)
       → PAS de Set-Cookie (WebSocket, pas HTTP)
       → Le cookie du navigateur expire toujours à 10:00 lendemain

10:01 lendemain  Le navigateur supprime le cookie (maxAge original atteint)
       → L'utilisateur rafraîchit la page
       → Nouveau socket, handshake HTTP, PAS de cookie envoyé
       → Nouvelle session vide créée
       → authenticate {} → session.userId est undefined → échec
       → Page de login affichée
       → Alors que la session MongoDB est encore valide jusqu'à 22:00
```

### Résumé des horloges désynchronisées

| Horloge | Mise à jour par | Problème |
|---------|-----------------|----------|
| Cookie navigateur `maxAge` | Uniquement le handshake HTTP initial | Jamais mis à jour après |
| Document session MongoDB | `session.save()` | Toujours à jour |
| `socket.request.session` en mémoire | `bind()`, `refreshSession()`, `unbind()` | Toujours à jour |
| Timer frontend `expiresAt` | Payload des messages socket | Toujours à jour |

---

## Approche cible : REST minimal pour la synchronisation du cookie

### Principe

Seules les opérations qui **modifient la durée de vie du cookie** passent par HTTP. Le login et le register restent sur socket car le cookie vient d'être défini au handshake — pas de dérive possible.

### Ce qui change

| Opération | Transport | Raison |
|-----------|-----------|--------|
| Refresh session | **Avant :** socket `session {type:"refresh"}` → **Après :** `POST /api/auth/refresh` | Doit renvoyer `Set-Cookie` avec le nouveau `maxAge` |
| Logout | **Avant :** socket `session {type:"disconnect"}` → **Après :** `POST /api/auth/logout` | Doit renvoyer `Set-Cookie` avec `maxAge=0` pour supprimer le cookie |

### Ce qui ne change pas

| Opération | Transport | Raison |
|-----------|-----------|--------|
| Login | Socket (`login` message) | Le cookie vient d'être défini au handshake quelques secondes avant — pas de dérive |
| Register | Socket (`register` message) | Idem |
| Authenticate | Socket (`authenticate` message) | Vérification à la reconnexion, lit le cookie du handshake |
| `socket_disconnect` | Socket (interne) | Détection automatique de perte de connexion |
| Messages métier | Socket | Temps réel (channels, teams, users, posts) |

---

## Flux cible — Refresh session

```
Frontend                                    Serveur
--------                                    -------
L'utilisateur clique "Prolonger"
    |
    └─ fetch("POST /api/auth/refresh", { credentials: "include" })
        |=================================>     Lit la session depuis le cookie
                                                session.cookie.maxAge = nouvelle durée
                                                session.save()
        <==== HTTP Response ================
        Set-Cookie: visioconf_session=...; maxAge=24h    ← cookie à jour
        Body: { status: "refreshed", expiresAt }

        Frontend: redémarre le timer avec le nouveau expiresAt
        Cookie navigateur: mis à jour ✓
        MongoDB: mis à jour ✓
        Timer frontend: mis à jour ✓
        → Les 3 horloges sont synchronisées
```

**Si la requête échoue** (réseau coupé, serveur down) : rien ne change, l'utilisateur peut réessayer. Pas d'état intermédiaire corrompu.

## Flux cible — Logout

```
Frontend                                    Serveur
--------                                    -------
L'utilisateur clique "Déconnexion"
    |
    └─ fetch("POST /api/auth/logout", { credentials: "include" })
        |=================================>     SessionManager.unbind(socketId) si trouvé
                                                session.destroy()
        <==== HTTP Response ================
        Set-Cookie: visioconf_session=; maxAge=0          ← cookie supprimé
        Body: { status: "disconnected" }

        Frontend: reset complet du state, clear timer
        Le socket reste connecté mais non authentifié
        → Les messages métier sont ignorés (resolveUserId retourne null)
```

---

## Suppression du flux multi-session

Le flux d'approbation multi-session est supprimé. Le cookie est partagé par toutes les tabs du même navigateur — un seul session ID = une seule session par navigateur. Plusieurs tabs = plusieurs sockets sur la même session, pas plusieurs sessions.

Sur un autre appareil/navigateur, le cookie est différent → session indépendante, pas besoin d'approbation.

### Ce qui est supprimé

| Élément | Fichier |
|---------|---------|
| `createManualSessionValidation()` | AuthService.ts |
| `succeedManualSessionValidation()` | AuthService.ts |
| `rejectManualSessionValidation()` | AuthService.ts |
| `resendPendingRequests()` | AuthService.ts |
| `sessionPendingChoice()` | AuthService.ts |
| `pendingRequests` Map | AuthService.ts |
| `PendingSessionRequest` type | AuthService.ts |
| `login_response { status: "pending" }` | Message supprimé |
| `session_response { status: "pending_request" }` | Message supprimé |
| `session_response { status: "pending_accepted" }` | Message supprimé |
| `session_response { status: "pending_rejected" }` | Message supprimé |
| `session { type: "pending_choice" }` | Message supprimé |
| `pendingLoginRequestId` | AuthState (frontend) |
| `pendingSessionRequests` | AuthState (frontend) |
| `respondToPendingSession()` | AuthSync + AuthContext |
| `SessionPendingModal` | Composant frontend |

### Login simplifié (sans multi-session)

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

Pas de vérification de sessions actives. Pas de demande d'approbation. Chaque login crée/met à jour sa propre session indépendamment.

---

## Messages après modification

### Messages supprimés

| Message | Direction | Raison |
|---------|-----------|--------|
| `session { type: "pending_choice" }` | Client → Serveur | Multi-session supprimée |
| `session { type: "refresh" }` | Client → Serveur | Déplacé vers REST |
| `session { type: "disconnect" }` | Client → Serveur | Déplacé vers REST |
| `login_response { status: "pending" }` | Serveur → Client | Multi-session supprimée |
| `session_response { status: "pending_request" }` | Serveur → Client | Multi-session supprimée |
| `session_response { status: "pending_accepted" }` | Serveur → Client | Multi-session supprimée |
| `session_response { status: "pending_rejected" }` | Serveur → Client | Multi-session supprimée |
| `session_response { status: "refreshed" }` | Serveur → Client | Déplacé vers REST |
| `session_response { status: "disconnected" }` | Serveur → Client | Déplacé vers REST |
| `session_response { status: "expired" }` | Serveur → Client | Déplacé vers REST |

### Messages conservés

| Message | Direction | Usage |
|---------|-----------|-------|
| `login` | Client → Serveur | Connexion via socket |
| `login_response` | Serveur → Client | Réponse : `success` ou `failure` uniquement |
| `register` | Client → Serveur | Inscription via socket |
| `register_response` | Serveur → Client | Réponse : `success` ou `failure` |
| `authenticate` | Client → Serveur | Reconnexion socket (lit le cookie du handshake) |
| `authenticate_response` | Serveur → Client | Réponse : `success` ou `failure` |
| `socket_disconnect` | Interne | Détection de déconnexion socket |

### Nouveaux endpoints REST

| Endpoint | Méthode | Body requête | Body réponse | Set-Cookie |
|----------|---------|-------------|--------------|------------|
| `/api/auth/refresh` | POST | — | `{ status: "refreshed", expiresAt }` | `visioconf_session=...; maxAge=<durée>` |
| `/api/auth/logout` | POST | — | `{ status: "disconnected" }` | `visioconf_session=; maxAge=0` |

---

## Variables d'environnement

| Variable | Avant | Après |
|----------|-------|-------|
| `SESSION_DURATION` | Inchangé | Inchangé |
| `SESSION_SECRET` | Inchangé | Inchangé |
| `SESSION_APPROVAL_TIMEOUT_SECONDS` | Utilisé | **Supprimé** |
| `REACT_APP_SESSION_EXPIRY_WARNING_MS` | Inchangé | Inchangé |
