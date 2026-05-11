# Décisions Backend — VisioConf

FAQ structurelle. Chaque entrée : question → doute → solution → pourquoi.

---

# 1. Architecture & Pattern

## Pourquoi un auth custom plutôt que BetterAuth ?

**Constat :** BetterAuth tournait sur des routes HTTP REST. Tout le reste de l'app passe par Socket.io + controleur (pub/sub). Deux systèmes d'échange coexistaient sans raison.

**Solution :** Auth custom branché sur **le même bus pub/sub** que les autres services. Les opérations qui touchent au cookie (refresh, logout) restent en HTTP — c'est leur canal naturel — mais la logique métier (login/register/authenticate) passe par Socket.io.

**Principe fondateur :** Le frontend lit et affiche, le serveur décide et modifie. Le client ne décide jamais à la place du serveur.

---

## Pourquoi cette arborescence backend ?

**Point de départ : c'est du MVC.** La View, c'est le frontend (FRONTENDV2). Le backend ne contient que le **M** et le **C**.

**Le C est unique.** Le `controleur.js` est le seul vrai Controller : un bus pub/sub. Pas de couche de "controllers" multiples.

```
src/
├── index.ts                            ← Boot
├── Controller/                         ← C — Le pub/sub
│   ├── controleur.js                   ← Bus (OFF-LIMITS)
│   ├── canalsocketio.js                ← Pont Socket.io ↔ bus (OFF-LIMITS)
│   └── *.d.ts, *.service.ts            ← TS autour
├── models/                             ← M — Tout le reste
│   ├── Core/                           ← Infra fondamentale (HTTPServer, Collection, TracedError)
│   ├── services/                       ← Services métier (Database, FileSystem, AuthService, …)
│   ├── User.ts, Team.ts, Channel.ts…   ← Modèles de données
│   └── ListeMessages.ts                ← Catalogue des messages
├── routes/                             ← Cas résiduels HTTP (uploads, refresh, logout)
└── uploads/
```

**Règle de dépendance :** Core ne dépend de rien de métier. Si on retire un service, Core continue de tourner. C'est cette asymétrie qui définit "Core".

---

## Pourquoi `controleur.js` et `canalsocketio.js` sont intouchables ?

C'est le cœur du pattern pub/sub, partagé symétriquement entre backend et frontend (le même fichier tourne des deux côtés). Toute adaptation se fait **autour** : types TypeScript (`controleur.d.ts`, `canalsocketio.d.ts`), wrappers, services. Jamais dedans.

---

## Pourquoi des classes statiques partout ?

`Database`, `SessionManager`, `AccessRoleGuard`, `BroadcastTargets`, `RestService`, `HTTPServer` — tout est statique. Ce sont des singletons fonctionnels : il n'y a jamais deux instances. Le statique élimine le besoin d'instanciation et de DI. Les services pub/sub (`AuthService`, `TeamService`, …) gardent une instance car le controleur les inscrit par référence.

---

# 2. Sessions

## C'est quoi une session, concrètement ?

**Réflexion :** Une session ne stocke rien de sensible. C'est juste un mapping `userId ↔ navigateur` avec une durée de vie. Elle existe = elle est active. Elle est détruite = elle est terminée.

**Solution :** La session est **un cookie signé** géré par `connect-mongodb-session`. Le cookie porte juste l'identifiant de session ; le store Mongo (collection `sessions`) garde `userId` + `cookie.maxAge`. Pas de champ `isActive`, pas de token applicatif.

---

## Pourquoi un cookie plutôt que `sessionStorage` ou `localStorage` ?

**Doute initial :** Cookie, `localStorage`, `sessionStorage` ?

**Réflexion :**
- **Cookie** : envoyé automatiquement par le navigateur sur HTTP **et** sur le handshake WebSocket → un seul middleware côté serveur sert les deux. `httpOnly` empêche l'accès JS (anti-XSS), `sameSite=lax` mitige le CSRF, `secure` force HTTPS.
- **`localStorage` / `sessionStorage`** : accessibles au JS donc volables par XSS, et il faut écrire un protocole applicatif (lire la valeur, l'envoyer, la vérifier) — on réinvente ce que le cookie fait déjà.
- L'isolation par onglet de `sessionStorage` n'est plus utile : il n'y a plus de flux multi-session à isoler.

**Solution :** `connect-mongodb-session` côté Express, le **même** middleware monté sur Express et sur l'engine Socket.io. Conséquence : `req.session` côté HTTP et `socket.request.session` côté WebSocket sont la même session.

**Compromis :** un cookie partagé entre tous les onglets — souhaité ici (un user = un device = un cookie, peu importe le nombre d'onglets).

---

## Où stocker les sessions ?

**Solution :** MongoDB (collection `sessions`). L'app utilise déjà Mongo, le store `connect-mongodb-session` gère l'expiration. Pas de Redis pour l'instant.

**Doute ouvert :** À grande échelle, un cache Redis pourrait soulager Mongo sans changer l'API.

---

## Comment retrouver le `userId` depuis un socket ?

`SessionManager.getUserId(socketId)` lit d'abord `socket.data.userId` (posé en RAM par `bind`), puis retombe sur `socket.request.session.userId` (le cookie). Pas de table en mémoire à maintenir : la **room Socket.io nommée `userId`** sert d'index inverse `userId → sockets[]`.

---

## Pourquoi pas de modèle Mongoose `Session` ?

Une version précédente avait un `Session.ts` (CRUD complet, TTL index, bindSocket/clearSocket). Tout ça est déjà fait par `connect-mongodb-session`. Le maintenir doublait la responsabilité. **Supprimé.**

---

## Pourquoi pas de flux d'approbation multi-session ?

**Constat passé :** un design antérieur exigeait que chaque login depuis un nouvel appareil soit approuvé par un appareil déjà connecté. La logique vivait dans `AuthService` avec une `Map<requestId, PendingRequest>`, un timeout, et un round-trip frontend complet (`SessionPendingModal`).

**Pourquoi supprimé :**
- Beaucoup de complexité (état en RAM, timeouts, race conditions "première réponse gagne", cas du refresh, etc.).
- UX coûteuse : un user sur PC qui veut se connecter sur téléphone devait retourner sur le PC pour approuver.
- Le bénéfice — second facteur "souple" — peut être réintroduit plus tard sous une forme dédiée (TOTP, magic link…) si le besoin se confirme.

**Solution actuelle :** un cookie par navigateur, pas d'approbation. Multi-onglet géré nativement par les rooms Socket.io.

**Doute ouvert :** quand il faudra un vrai 2FA, le faire proprement (TOTP), pas en réintroduisant le flux d'approbation socket.

---

## Pourquoi `refresh` et `logout` sont en HTTP et pas en messages ?

Ces deux opérations **manipulent directement la session cookie** (`session.save`, `session.destroy`, `clearCookie`). Le cycle de vie du cookie est piloté par `express-session`, qui s'exprime en HTTP. Forcer ces actions à passer par Socket.io ajouterait un aller-retour pour rien. Les autres opérations (login/register/authenticate) restent en messages parce qu'elles n'éditent pas le cookie côté Express, elles posent juste `session.userId`.

---

# 3. Authentification

## Pourquoi pas de JWT ?

**Réflexion :** Le JWT est utile en multi-services (vérification stateless sans appel DB partagé). Ici, single-server, le cookie + lookup Mongo couvre déjà tout. Un JWT ne ferait qu'ajouter une couche signée autour d'un identifiant de session qui finit vérifié en DB de toute façon.

**Solution :** Identifiant de session géré par `express-session` (cookie signé), persisté en Mongo. Pas de JWT applicatif.

---

## Pourquoi SHA256 et pas bcrypt/argon2 ?

Choix délibéré pour le dev : SHA256 via `js-sha256`, rapide, sans dépendance native. `hashPassword`/`verifyPassword` sont isolés dans `AuthService` → migration future = un seul fichier.

**Doute ouvert :** SHA256 = hash rapide = vulnérable au brute force. À migrer vers bcrypt/argon2 avant prod.

---

## Comment `is_online` reste cohérent ?

À chaque `bind` → `is_online = true`. À chaque `socket_disconnect` (émis par `CanalSocketIO`), `AuthService.socketDisconnect` retire le socket de la room et **ne flippe `is_online = false` que si plus aucun socket actif** (`SessionManager.hasActiveSessions(userId)`). Sinon, on bascule juste `disturb_status` `"offline"` → `"available"`.

**Pourquoi :** un user avec deux onglets ne doit pas passer offline quand il en ferme un.

---

# 4. Modèle de données

## Pourquoi les statuts utilisateur sont limités à `waiting`/`active` ?

**Réflexion :**
- `banned` implique une action admin — pas encore implémenté.
- `deleted` est contradictoire : si supprimé, le document n'existe plus.
- `inactive` est ambigu (depuis quand ? pourquoi ?).

**Solution :** Deux statuts seulement. Les autres viendront avec les vrais besoins.

---

# 5. Doutes ouverts

| Sujet | Doute | Piste |
|-------|-------|-------|
| Cache sessions | Mongo suffit-il à grande échelle ? | Ajouter Redis comme cache du store |
| 2FA | Si le besoin revient, comment le faire proprement ? | TOTP / magic link, pas un retour au flux socket |
| SHA256 | Vulnérable brute force | Migrer vers bcrypt/argon2 avant prod (1 fichier) |
| Statuts utilisateur | `banned` / `deleted` manquants | À ajouter quand le besoin se présente |
