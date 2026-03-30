# CookieSessionStrategy

**Source**: conceptual strategy (implemented across `AuthService.ts`, `SessionManager.ts`, `AuthRoutes.ts`)

Document de stratégie expliquant pourquoi le rafraîchissement de session et la déconnexion utilisent des endpoints REST plutôt que des messages socket. Le problème central : les en-têtes `Set-Cookie` ne peuvent être envoyés que via HTTP, mais après le handshake Socket.io la connexion est en pur WebSocket. Les opérations qui modifient la durée de vie du cookie doivent passer par HTTP pour garder le cookie du navigateur synchronisé avec la session côté serveur.

## Attribution des transports

| Opération | Transport | Raison |
|-----------|-----------|--------|
| `login` | Socket | Le cookie vient d'être défini au handshake quelques instants avant — pas de décalage |
| `register` | Socket | Même chose que login |
| `authenticate` | Socket | Lit le cookie depuis le handshake, pas besoin de le mettre à jour |
| `socket_disconnect` | Socket (interne) | Détection automatique, pas de cookie impliqué |
| Rafraîchissement de session | REST `POST /api/auth/refresh` | Doit envoyer `Set-Cookie` avec un `maxAge` mis à jour |
| Déconnexion | REST `POST /api/auth/logout` | Doit envoyer `Set-Cookie` avec `maxAge=0` pour supprimer le cookie |

## Endpoints REST

| Endpoint | Méthode | Corps de la requête | Corps de la réponse | Set-Cookie |
|----------|---------|---------------------|---------------------|------------|
| `/api/auth/refresh` | POST | — | `{ status: "refreshed", expiresAt: number }` ou `{ status: "failure", reason: "not_authenticated" \| "session_save_error" }` | `visioconf_session=...; maxAge=<duration>` |
| `/api/auth/logout` | POST | — | `{ status: "disconnected" }` ou `{ status: "failure", reason: "session_destroy_error" }` | `visioconf_session=; maxAge=0` (efface) |

## Problème de synchronisation des horloges

| Horloge | Mise à jour par | Reste synchronisé ? |
|---------|-----------------|---------------------|
| Cookie navigateur `maxAge` | En-tête HTTP `Set-Cookie` uniquement | Seulement si refresh/logout passent par REST |
| Document session MongoDB | `session.save()` | Toujours |
| `socket.request.session` en mémoire | `bind()`, `refreshSession()`, `unbind()` | Toujours |
| Timer frontend `expiresAt` | Payloads de réponse Socket/REST | Toujours |

## Détails

Sans endpoints REST pour le rafraîchissement et la déconnexion, le `maxAge` du cookie navigateur se désynchronise de l'expiration de la session côté serveur. Le cookie expire selon son timestamp de handshake initial, même si la session a été prolongée côté serveur. Quand l'utilisateur rafraîchit la page après l'expiration du cookie, le navigateur n'envoie pas de cookie, une nouvelle session vide est créée, et `authenticate` échoue malgré une session MongoDB valide.

Le flux d'approbation multi-session (requêtes en attente, approbation/rejet) a été supprimé. Le cookie est partagé entre tous les onglets d'un même navigateur — un cookie équivaut à une session. Plusieurs onglets partagent la même session. Des navigateurs/appareils différents obtiennent des sessions indépendantes sans approbation nécessaire.

## Flux

Voir [auth-flows.md](../../flows/auth-flows.md)
