# Décisions d'Auth — VisioConf

FAQ structurelle du système d'authentification. Chaque entrée suit : question → doute → solution → pourquoi.

---

## Pourquoi remplacer BetterAuth par un auth custom ?

**Constat :** BetterAuth fonctionnait via des routes HTTP REST (`toNodeHandler(...)`). Tout le reste de l'app passe par Socket.io + controleur.js (pub/sub). Deux systèmes d'échange coexistaient sans raison.

**Solution :** Un auth custom qui passe **entièrement par Socket.io + controleur.js**, comme tous les autres composants.

**Principe fondateur :** Le frontend lit et affiche, le serveur décide et modifie. Le frontend utilise les données dont il dispose (cookie, expiresAt) pour afficher des modales, mais ne prend jamais de décision — si quelque chose nécessite une décision « supérieure », le serveur s'en charge.

---

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

## Pourquoi SHA256 et pas bcrypt/argon2 ?

**Réponse :** Choix délibéré. SHA256 (`js-sha256`) est rapide, simple, sans dépendances natives. bcrypt/argon2 nécessitent une compilation native. Pour le développement, SHA256 suffit.

**Pourquoi c'est safe pour l'instant :** `hashPassword`/`verifyPassword` sont isolés dans `AuthService`. L'upgrade vers bcrypt/argon2 = un seul fichier à modifier.

**Doute ouvert :** SHA256 est un hash rapide = vulnérable au brute force. À migrer avant la production.

---

## Comment le sessionId est persisté côté client ?

**Doute initial :** Le cookie devrait-il être chiffré ? Pourquoi envoyer le sessionId via WebSocket plutôt que HTTP ? Est-ce moins sécurisé ?

**Réflexion :**
- Les cookies HTTP ont des protections natives (`httpOnly`, `secure`, `sameSite`) que les messages WebSocket n'ont pas
- Mais le backend ne lit jamais les cookies HTTP — toute l'auth passe par Socket.io
- Le cookie est purement de la persistance côté client (survit au refresh de page)
- La connexion WebSocket elle-même est l'ancre de confiance (TCP persistant), pas le transport du sessionId

**Solution :** Cookie `visioconf_session` avec `SameSite=Strict`, envoyé comme payload Socket.io `authenticate` à la reconnexion.

**Doute ouvert :** En production, WSS (WebSocket over TLS) est indispensable. Sans `httpOnly`, le cookie est accessible au JavaScript — une XSS pourrait le voler. Suffisant pour le dev, à durcir pour la prod.

---

## Pourquoi pas de nouveau token dans session_refreshed ?

**Réponse :** Le sessionId ne change jamais pendant la durée de vie de la session. Un refresh ne fait qu'étendre `expiresAt` en DB. Le client n'a besoin que du nouveau `expiresAt` pour mettre à jour son timer local. Renvoyer le même sessionId serait redondant.

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

## Pourquoi les statuts utilisateur sont limités à waiting/active ?

**Doute initial :** Faut-il un statut `banned` ? `deleted` ? `inactive` ?

**Réflexion :**
- `banned` implique une action admin — pas encore implémenté
- `deleted` est contradictoire — si supprimé, le document n'existe plus
- `inactive` est ambigu — inactif depuis quand ? pourquoi ?

**Solution :** Deux statuts seulement : `waiting` (inscription en attente de validation) et `active`. Les autres seront ajoutés quand le besoin se présentera.

---

## Résumé des doutes ouverts

| Sujet | Doute | Piste |
|-------|-------|-------|
| JWT | Quand le bottleneck DB justifierait du JWT ? | Quand multi-services ou trop de lookups DB |
| Sessions orphelines | Les sessions sans socket actif posent-elles problème à grande échelle ? | Redis comme cache, ou sweep périodique |
| Multi-session UX | L'approbation est-elle trop contraignante ? | À tester avec des vrais utilisateurs |
| SHA256 | Vulnérable au brute force | Migrer vers bcrypt/argon2 avant prod (1 fichier) |
| Cookie sécurité | XSS peut voler le sessionId | WSS obligatoire en prod, envisager `httpOnly` via HTTP handshake |
| Statuts utilisateur | `banned`/`deleted` manquants | À ajouter quand le besoin se présente |
