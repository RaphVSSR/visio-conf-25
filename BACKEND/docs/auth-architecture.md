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
| Stocke le sessionId dans un cookie (`visioconf_session`) | Envoie le sessionId via Socket.io |

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

Déclenché quand un utilisateur tente un **login avec identifiants** et a déjà des sessions actives.

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

## Cookie & Session

**SessionId stocké dans un cookie côté frontend :**
```
nom: visioconf_session | path: / | max-age: 24h | SameSite: Strict
```

Le frontend gère le cookie (`document.cookie`), le backend gère les sessions en DB et envoie le sessionId via Socket.io.

Le sessionId est un ObjectId MongoDB (24 caractères hexadécimaux). Pas de JWT — la session est vérifiée directement en DB à chaque reconnexion.

---

## Variables d'environnement

| Variable | Type | Exemple | Description |
|----------|------|---------|-------------|
| `SESSION_DURATION` | string (zeit/ms) | `24h` | Durée de vie de la session |
| `SESSION_APPROVAL_TIMEOUT_SECONDS` | int | `60` | Timeout pour l'approbation multi-session |

---

## Modèle de sécurité

1. **Mots de passe** : hachés en SHA256 via `js-sha256` avant stockage.
2. **Sessions** : vérifiées en DB à chaque reconnexion (existence + expiration).
3. **Pas de vérification par message** : la connexion TCP persistante EST l'ancre de confiance.
4. **Sessions en DB** : suppression automatique via TTL MongoDB.
5. **Multi-session** : les nouvelles connexions doivent être approuvées par les sessions existantes.
6. **SessionId côté client** : stocké dans un cookie `visioconf_session` (SameSite=Strict, 24h), envoyé via Socket.io pour l'authentification.
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
| `src/core/controleur.js` | Bus de messages (pub/sub) |
| `src/core/canalsocketio.js` | Pont Socket.io ↔ controleur |
| `src/contexts/AuthContext.tsx` | Provider React, bridge vers controleur |
| `src/hooks/useAuthMessages.ts` | Hook pour consommer l'état auth |
| `src/components/SessionExpiryModal/` | Modales d'expiration et d'approbation |
| `src/components/LoginForm/` | Formulaire de connexion |
| `src/components/SignupForm/` | Formulaire d'inscription |

---

## Problèmes restants

### 1. Hachage SHA256 des mots de passe

Les mots de passe sont hachés en SHA256 (`js-sha256`). SHA256 est un hash rapide, ce qui le rend vulnérable aux attaques par force brute. Pour la production, `bcrypt` ou `argon2` serait recommandé (hash lent avec salt intégré).

**Note :** ce choix est volontaire pour le développement actuel. À revisiter avant mise en production.
