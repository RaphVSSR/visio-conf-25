# Décisions Backend — VisioConf

FAQ structurelle du backend. Chaque entrée suit : question → doute → solution → pourquoi.

---

# 1. Architecture & Pattern

## Pourquoi remplacer BetterAuth par un auth custom ?

**Constat :** BetterAuth fonctionnait via des routes HTTP REST (`toNodeHandler(...)`). Tout le reste de l'app passe par Socket.io + controleur.js (pub/sub). Deux systèmes d'échange coexistaient sans raison.

**Solution :** Un auth custom qui passe **entièrement par Socket.io + controleur.js**, comme tous les autres composants.

**Principe fondateur :** Le frontend lit et affiche, le serveur décide et modifie. Le frontend utilise les données dont il dispose (cookie, expiresAt) pour afficher des modales, mais ne prend jamais de décision — si quelque chose nécessite une décision « supérieure », le serveur s'en charge.

---

## Pourquoi cette arborescence backend ?

**Point de départ : c'est du MVC.** Même dans une SPA moderne, le pattern MVC s'applique — la View est simplement le frontend entier (FRONTENDV2). Ça ne veut pas dire que le backend n'est pas MVC, ça veut dire que la séparation V/MC se fait au niveau du projet, pas au niveau du backend. Le backend ne contient que le **M** et le **C**.

**Le C est unique.** Dans cette app, le controleur.js est le seul vrai Controller au sens MVC. Il n'y a pas une couche de controllers multiples qui dispatchent vers des services — il y a **un** bus de messages pub/sub. Tout ce qui n'est pas ce bus fait partie du Model : données, services, infrastructure.

**Conséquence sur les dossiers :** La structure backend reflète directement cette réalité MVC :
- `Controller/` = le **C** — le bus pub/sub, son pont Socket.io, et l'enveloppe TypeScript autour
- `models/` = le **M** — tout le reste : modèles de données, services métier, infrastructure core

```
src/
├── index.ts                            ← Point d'entrée
├── ListeMessages.ts                    ← Catalogue des messages
├── canalsocketio.js                    ← Pont Socket.io ↔ controleur
├── Controller/                         ← C — Le pattern pub/sub
│   ├── controleur.js                   ← Bus de messages (OFF-LIMITS)
│   ├── Controller.types.ts             ← Types TS du controleur
│   ├── Controller.service.ts           ← Classe abstraite ControllerService
│   └── Controller.abstracts.ts         ← Init (crée controleur + inscrit services)
├── models/                             ← M — Tout le reste
│   ├── Core/                           ← Infrastructure fondamentale
│   │   ├── HTTPServer.ts
│   │   ├── Collection.ts
│   │   ├── TracedError.ts
│   │   └── TestEnvironement.ts
│   ├── services/                       ← Services métier
│   │   ├── Database.ts
│   │   ├── SocketIO.ts
│   │   ├── FileSystem.ts
│   │   ├── RestService.ts
│   │   └── authentication/
│   ├── User.ts, Team.ts, Channel.ts…  ← Modèles de données
├── routes/                             ← Routes HTTP
└── uploads/                            ← Fichiers uploadés
```

**Pourquoi chaque dossier existe :**

| Dossier | Raison d'être |
|---------|---------------|
| `src/` (racine) | Le point d'entrée (`index.ts`), le catalogue de messages (`ListeMessages.ts`), et `canalsocketio.js` qui fait le pont entre le Controller et Socket.io. |
| `Controller/` | Le **C** du MVC. Le controleur.js (bus pub/sub unique) et tout ce qui l'enveloppe : types TS, classe abstraite `ControllerService`, et l'init qui branche les services au bus. Il vit au même niveau que `models/` car ce sont les deux moitiés du backend — C et M. |
| `models/` | Le **M** du MVC, au sens large. En MVC, le Model n'est pas juste « les schémas de base de données » — c'est toute la logique métier, les données, et l'infrastructure. Tout ce qui n'est pas le controleur est un modèle : un modèle de données (User, Team), un modèle de service (AuthService, Database), ou un modèle d'infrastructure (HTTPServer). |
| `models/Core/` | L'infrastructure dont **tout le reste dépend**, mais qui ne dépend de rien de métier. Si on retire Core, plus rien ne démarre. Si on retire un service ou un modèle métier, Core continue de tourner. C'est cette asymétrie de dépendance qui définit ce qui est « Core ». |
| `models/services/` | Les services métier qui **s'inscrivent au controleur** et réagissent aux messages, ou qui fournissent des capacités transversales (DB, Socket.io, filesystem). La différence avec Core : un service porte de la logique métier ou applicative. |
| `routes/` | Les cas résiduels qui passent par HTTP au lieu de Socket.io (upload de fichiers, etc.). Ce dossier est volontairement petit — l'essentiel transite par le bus pub/sub. |

---

## Pourquoi le controleur.js et canalsocketio.js sont intouchables ?

**Constat :** Ces deux fichiers constituent le coeur du pattern pub/sub de l'app. Le controleur est le seul vrai « Controller » au sens MVC. Tout le reste est soit un Model soit un Service.

**Réflexion :**
- Le controleur.js est un bus de messages symétrique : le même fichier tourne côté backend et frontend
- canalsocketio.js fait le pont entre le controleur et Socket.io
- Les composants s'inscrivent via `inscription()`, envoient via `envoie()`, reçoivent via `traitementMessage()`
- Modifier ces fichiers casserait la symétrie et tous les composants qui s'y branchent

**Solution :** Toute adaptation se fait **autour** de ces fichiers, jamais dedans. Les types et abstractions TypeScript (`Controller.types.ts`, `ControllerService` abstract class) s'ajoutent par-dessus sans toucher au JS.

---

## Pourquoi des classes statiques partout ?

**Constat :** `Database`, `AuthService`, `Session`, `FileSystem` — tout est statique.

**Pourquoi :** Ces services sont des singletons fonctionnels. Il n'y a jamais deux instances de `Database` ou `AuthService`. Le pattern statique élimine le besoin d'instanciation et de dependency injection. Chaque service est autonome et cohérent avec son nom fonctionnel.

**Lien avec le controleur :** Les services s'inscrivent au controleur dans leur méthode `init()` statique. Pas besoin de `new AuthService()` — `AuthService.init(controleur)` suffit.

---

# 2. Sessions

## C'est quoi une session, concrètement ?

**Doute initial :** Qu'est-ce qu'une session active ? Inactive ? Pourquoi maintenir une session si les données utilisateur sont déjà en DB ? Est-ce que la session stocke des credentials ?

**Réflexion :**
- La session ne stocke rien de sensible — juste un `userId` et un `socketId`
- C'est un mapping user ↔ socket(s) avec persistance
- Elle existe = elle est active. Elle est supprimée = elle est terminée
- Pas de champ `isActive`, pas de champ `token` — l'existence du document est la seule source de vérité

**Solution :** Session minimaliste : `{ userId, socketId, deviceInfo, createdAt, expiresAt }`. Rien d'autre.

---

## Où stocker les sessions ?

**Options considérées :** Redis, en mémoire, MongoDB.

**Pourquoi MongoDB :** L'app utilise déjà MongoDB pour tout. Les index TTL gèrent l'expiration automatique. Les lookups par `_id` ou `socketId` s'adaptent bien aux index MongoDB. Pas de dépendance supplémentaire.

**Doute ouvert :** Quand un utilisateur ferme son navigateur sans se déconnecter, la session reste en DB jusqu'au TTL. C'est voulu (reconnexion possible via cookie). Mais à grande échelle, est-ce que les sessions orphelines deviennent un problème ?

**Réponse partielle :** Redis peut être ajouté plus tard comme couche de cache sans changer le modèle Session.

---

## Comment mapper un socket à un utilisateur ?

**Solution :** Stocker le `socketId` directement sur le document Session en MongoDB.

**Pourquoi :** Après `authenticate`, la socket est de confiance (connexion TCP persistante = ancre de confiance). N'importe quel service peut faire `Session.getSessionBySocket(socketId)` pour identifier l'utilisateur. Pas de maps en mémoire qui seraient perdues au redémarrage.

**Compromis accepté :** Une écriture DB à chaque connect/disconnect, mais ces événements sont rares comparés au trafic de messages.

---

## Comment le sessionId est persisté côté client ?

**Doute initial :** Cookie, `localStorage` ou `sessionStorage` ? Chacun a des compromis différents.

**Réflexion :**
- **Cookie** : envoyé avec chaque requête HTTP au serveur, protections natives (`httpOnly`, `secure`, `sameSite`), mais le backend ne lit jamais les cookies — toute l'auth passe par Socket.io. Et surtout : partagé entre tous les onglets
- **`localStorage`** : côté client uniquement (pas envoyé au serveur), ~5-10MB, pas d'expiry. Mais même problème que les cookies — partagé entre tous les onglets
- **`sessionStorage`** : isolé par onglet, côté client uniquement. Seul storage qui garantit qu'un onglet ne voit pas les données d'un autre
- Le partage inter-onglets est un vrai problème : si un onglet est rejeté par le flux multi-session et qu'on supprime le storage, tous les autres onglets perdent leur sessionId
- Pas de persistance après fermeture d'onglet — mais l'expiration est gérée côté serveur (TTL MongoDB), donc un onglet fermé = session orpheline qui expire naturellement

**Solution :** `sessionStorage` — chaque onglet stocke son propre sessionId, isolé des autres.

**Doute ouvert :** En production, WSS (WebSocket over TLS) est indispensable. `sessionStorage` est accessible au JavaScript — une XSS pourrait le voler. Suffisant pour le dev, à durcir pour la prod.

---

## Pourquoi 1 session = 1 socket, mais 1 user = N sessions ?

**Doute initial :** Chaque onglet du navigateur crée sa propre connexion Socket.io (son propre `socketId`). Est-ce qu'un onglet devrait réutiliser la session d'un autre onglet, ou avoir la sienne ?

**Réflexion :**
- Si plusieurs onglets partagent une session, `bindSocket` écrase le `socketId` précédent — le premier onglet perd silencieusement sa liaison et ne reçoit plus de messages
- Un utilisateur peut légitimement vouloir être connecté depuis plusieurs onglets/appareils
- Le flux multi-session (approbation) sert de second facteur — mais il doit s'appliquer partout, pas seulement au `login`

**Solution :** Chaque onglet a sa propre session. `authenticate` (via sessionStorage) passe par le même flux d'approbation que `login` si un socket est déjà actif pour cet utilisateur. Sur approbation → nouvelle session créée (même `userId`). Sur rejet → `login_failure` → retour au login.

---

## Pourquoi pas de nouveau token dans session_refreshed ?

**Réponse :** Le sessionId ne change jamais pendant la durée de vie de la session. Un refresh ne fait qu'étendre `expiresAt` en DB. Le client n'a besoin que du nouveau `expiresAt` pour mettre à jour son timer local. Renvoyer le même sessionId serait redondant.

---

# 3. Authentification

## Pourquoi pas de JWT ?

**Doute initial :** Le JWT est standard, il permet une vérification stateless sans appel DB. Pourquoi s'en passer ?

**Réflexion :**
- À quoi sert le JWT si chaque `authenticate` interroge déjà la DB pour la session ET l'utilisateur ?
- Dans quel cas le JWT est utile sans appel DB ? → Quand plusieurs services n'ont pas tous accès à la même DB (architecture micro-services distribuée)
- Discord utilise tokens ET sessions : le token sert à la vérification légère entre micro-services, la session gère le compte. Deux rôles distincts
- Est-ce que notre app est multi-services ? → Non, single-server. Le JWT n'est qu'un wrapper signé autour d'un sessionId qui finit vérifié en DB de toute façon

**Solution :** Utiliser des ObjectId MongoDB bruts comme identifiants de session. Pas de JWT.

**Pourquoi ça tient :** Les ObjectId ne sont pas devinables (96 bits d'entropie). La vérification se fait en DB à chaque reconnexion — exactement comme avant, mais sans la couche JWT inutile.

**Doute ouvert :** À quel point de croissance le bottleneck DB justifierait de réintroduire du JWT ? Pas de réponse — « quand le nombre d'utilisateurs ou de services rend les lookups DB trop coûteux ». À garder en tête.

---

## Pourquoi SHA256 et pas bcrypt/argon2 ?

**Réponse :** Choix délibéré. SHA256 (`js-sha256`) est rapide, simple, sans dépendances natives. bcrypt/argon2 nécessitent une compilation native. Pour le développement, SHA256 suffit.

**Pourquoi c'est safe pour l'instant :** `hashPassword`/`verifyPassword` sont isolés dans `AuthService`. L'upgrade vers bcrypt/argon2 = un seul fichier à modifier.

**Doute ouvert :** SHA256 est un hash rapide = vulnérable au brute force. À migrer avant la production.

---

## Pourquoi un flux d'approbation multi-session ?

**Besoin :** Si un utilisateur a déjà une session active et qu'un login arrive depuis un autre appareil, les sessions existantes doivent valider ou refuser la nouvelle connexion.

**Pourquoi :** La session légitime agit comme un second facteur. Si les identifiants sont compromis, l'attaquant ne peut pas se connecter sans que l'utilisateur légitime approuve.

**Fonctionnement :**
- La notification est envoyée uniquement aux sockets du **même utilisateur**, pas à toutes les sockets
- Les `pendingRequests` sont en mémoire (éphémères — les perdre au redémarrage = le login expire simplement)
- Timeout configurable → auto-rejet si pas de réponse
- Première réponse gagne, réponses tardives ignorées

**Évolution du design :** Un `SessionManager` séparé avait été envisagé pour isoler cette logique. Éliminé — trop de complexité pour pas assez de gain. La logique multi-session vit dans `AuthService`, qui utilise `Session` pour le CRUD avec un naming fonctionnel (`createManualSessionValidationByUser`, `succeedManualSessionValidationByUser`, `rejectManualSessionValidationByUser`).

**Doute ouvert :** L'UX est-elle bonne ? Un utilisateur sur son téléphone qui veut se connecter sur son PC doit retourner sur son téléphone pour approuver. Est-ce trop contraignant pour des utilisateurs non-techniques ?

---

# 4. Modèle de données

## Pourquoi les statuts utilisateur sont limités à waiting/active ?

**Doute initial :** Faut-il un statut `banned` ? `deleted` ? `inactive` ?

**Réflexion :**
- `banned` implique une action admin — pas encore implémenté
- `deleted` est contradictoire — si supprimé, le document n'existe plus
- `inactive` est ambigu — inactif depuis quand ? pourquoi ?

**Solution :** Deux statuts seulement : `waiting` (inscription en attente de validation) et `active`. Les autres seront ajoutés quand le besoin se présentera.

---

# 5. Doutes ouverts

| Sujet | Doute | Piste |
|-------|-------|-------|
| JWT | Quand le bottleneck DB justifierait du JWT ? | Quand multi-services ou trop de lookups DB |
| Sessions orphelines | Les sessions sans socket actif posent-elles problème à grande échelle ? | Redis comme cache, ou sweep périodique |
| Multi-session UX | L'approbation est-elle trop contraignante ? | À tester avec des vrais utilisateurs |
| SHA256 | Vulnérable au brute force | Migrer vers bcrypt/argon2 avant prod (1 fichier) |
| sessionStorage sécurité | XSS peut voler le sessionId | WSS obligatoire en prod |
| Statuts utilisateur | `banned`/`deleted` manquants | À ajouter quand le besoin se présente |
