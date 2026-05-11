# Décisions Frontend — VisioConf

FAQ structurelle. Chaque entrée : question → doute → solution → pourquoi.

---

# 1. Architecture & Pattern

## Pourquoi cette arborescence frontend ?

**Point de départ : c'est la View du MVC.** Le frontend lit et affiche les données fournies par le serveur via le bus pub/sub. Il ne prend aucune décision « supérieure » — le serveur décide, le frontend réagit.

**Le `controleur.js` est partagé.** Le même bus pub/sub tourne côté backend et frontend (fichier identique). Les services frontend s'inscrivent au controleur exactement comme les services backend.

```
src/
├── index.tsx                            ← Point d'entrée React
├── Core/                                ← Composant racine
│   └── App.tsx                          ← Routing + providers
├── Controller/                          ← Bus pub/sub (OFF-LIMITS)
│   ├── controleur.js                    ← Bus de messages (OFF-LIMITS)
│   ├── canalsocketio.js                 ← Pont Socket.io ↔ controleur (OFF-LIMITS)
│   ├── controleur.d.ts                  ← Types TS du bus
│   └── canalsocketio.d.ts               ← Types TS du pont
├── services/                            ← Services métier + transport
│   ├── MessageClientAdapter.ts          ← Wrapper Socket.io + auto-inscription au bus
│   ├── auth/
│   │   ├── AuthSync.ts                  ← Handler auth (login/register/authenticate + timers)
│   │   └── AuthSync.types.ts            ← Types AuthState, AuthUser, AuthActions
│   └── chat/                            ← Services chat
├── contexts/                            ← React Context providers
│   ├── AuthContext.tsx                  ← Provider d'authentification (wrap AuthSync)
│   ├── ToastContext.tsx                 ← Provider de notifications toast
│   └── call/                            ← Provider visioconf
├── hooks/                               ← Custom hooks d'accès aux contexts
├── components/                          ← Composants applicatifs
│   ├── LoginForm/, SignupForm/
│   ├── Dashboard/, AdminTabPanel/
│   └── AuthToasts/                      ← Toasts d'évènements auth
├── pages/                               ← Une page = une route
├── design-system/                       ← Primitifs UI (Button, Card, Toast, …)
└── routing/                             ← Gardes de route (UserAuth, AdminAuth)
```

**Pourquoi chaque dossier existe :**

| Dossier | Raison d'être |
|---------|---------------|
| `Core/` | Composant racine (`App.tsx`) qui monte les providers, le router, les routes. Seul fichier avec une vue d'ensemble. |
| `Controller/` | Bus pub/sub partagé avec le backend. `controleur.js` et `canalsocketio.js` sont **off-limits**. Les types TS s'ajoutent par-dessus sans toucher au JS. |
| `services/` | Services métier inscrits au bus. `MessageClientAdapter` est l'adaptateur transport (Socket.io + inscription au controleur). Un service écoute/émet des messages, gère du state, expose des méthodes. |
| `contexts/` | Pont entre les services et React. Un provider instancie un service et expose son state + actions. Aucune logique métier ici. |
| `hooks/` | `useContext()` typé + vérification de provider. |
| `components/` | Composants applicatifs qui consomment les contexts. Spécifiques à VisioConf. |
| `pages/` | Composants de niveau page, mappés 1:1 avec les routes. |
| `design-system/` | Primitifs UI (Button, Card, Toast, …) sans dépendance métier — réutilisables ailleurs. |
| `routing/` | Gardes de route (`UserAuth`, `AdminAuth`). Utilisent `Outlet` de react-router-dom. |

---

## Pourquoi `controleur.js` et `canalsocketio.js` sont intouchables ?

C'est le cœur du pattern pub/sub, **partagé symétriquement** avec le backend (même fichier). Modifier ici casserait la symétrie. Toute adaptation (typage TS, wrappers, services) se fait par-dessus.

---

## Pourquoi un design system séparé des composants ?

**Constat :** `Button`, `Card`, `Toast` sont purs — aucune dépendance context/service/métier. `LoginForm`, `Dashboard` dépendent du context d'auth.

**Solution :** Deux niveaux :
- `design-system/components/` — primitifs réutilisables ailleurs.
- `components/` — composants applicatifs qui composent les primitifs et consomment les contexts.

---

## Pourquoi un service `AuthSync` séparé du `AuthContext` ?

**Doute initial :** Pourquoi pas toute la logique d'auth dans `AuthContext` ?

**Réflexion :**
- `AuthContext` suit le lifecycle React (mount, unmount, re-render).
- `AuthSync` suit le lifecycle du transport (handlers attachés au socket, timers, fetch HTTP).
- Mélanger les deux rend les callbacks de messages fragiles vis-à-vis du render cycle React.

**Solution :** `AuthSync` = handler pur (pub/sub + timers + HTTP). `AuthContext` = wrapper React qui crée/détruit l'instance et passe `setState` comme callback.

```
AuthProvider (React) → crée AuthSync(socket, setState)
AuthSync reçoit un message → appelle setState(prev => …)
React re-render → les composants voient le nouveau state
```

**Note historique :** ce service s'appelait `AuthService.ts`. Renommé `AuthSync` après la refonte cookie (le mot "service" était déjà chargé côté backend, et "Sync" reflète mieux son rôle de synchroniseur état React ↔ serveur).

---

## Pourquoi `MessageClientAdapter` et plus de singleton `SocketIO` ?

**Constat :** L'ancien code avait un singleton `SocketIO` global qui initialisait le socket + le bus. Couplage fort, double initialisation difficile, ordre de boot fragile.

**Solution :** `MessageClientAdapter` est instancié explicitement par celui qui en a besoin (`AuthProvider`), avec une API d'attente prête à l'emploi (`onReady`, `onReconnect`, `on`, `off`, `send`). Plus de singleton — chaque consommateur peut créer le sien si besoin (en pratique, un seul, partagé via `AuthContext.socket`).

---

## Pourquoi cookie de session et pas `sessionStorage` ?

Session unique par navigateur via cookie HTTP signé (`connect-mongodb-session` côté serveur). Pas de `sessionStorage`, pas de logique multi-session, pas d'approbation. Le cookie est attaché automatiquement aux requêtes HTTP **et** au handshake Socket.io — le frontend n'a aucun token applicatif à gérer.

**Avantage :** moins de code, pas de divergence onglet/serveur, expiration centralisée. Le frontend consomme `expiresAt` (renvoyé par les `_response`) pour piloter le timer d'avertissement local.

---

## Pourquoi framer-motion partout ?

Les transitions d'état (loading → authenticated, modales, toasts) sont omniprésentes. `framer-motion` les rend déclaratives. Compromis accepté : ~30KB gzip.

---

# 2. Gestion d'état

## Pourquoi React Context et pas Redux/Zustand ?

State global limité (auth + toasts). Le state métier (users, teams, channels) vit côté serveur et arrive via le bus — pas de cache client à normaliser. Redux ajouterait du boilerplate sans gain. Zustand serait plus léger mais résoudrait un problème qu'on n'a pas.

**Solution :** `useState` + Context. Un context par domaine. Les services injectent un callback `setState` pour mettre à jour le context depuis les messages.

---

# 3. Routing

## Gardes imbriquées

```
Routes
├── /login          (public)
├── /signup         (public)
└── UserAuth        (vérifie isAuthenticated)
    ├── /           → redirect /home
    ├── /home       (Home)
    └── AdminAuth   (vérifie roles.includes("admin"))
        └── /admin  (AdminPanel)
```

**Pourquoi pas un seul guard :** "authentifié" et "admin" sont deux décisions distinctes — un user authentifié sans rôle admin doit retomber sur `/home`, pas sur `/login`.

---

# 4. Composants

## HTML sémantique strict

`main`, `nav`, `section`, `article`, `header`, `footer`, `aside`, `dialog`, `fieldset` utilisés systématiquement. `div` uniquement pour le layout pur. Bénéfice : accessibilité native, lisibilité, SEO implicite.

## Modales avec `<dialog>`

Comportement natif (focus trap, attribut `open`, `.showModal()` pour le backdrop). Pas de bibliothèque de modales nécessaire.

---

# 5. Doutes ouverts

| Sujet | Doute | Piste |
|-------|-------|-------|
| `dialog` non-modal | Modales avec `open` simple, pas de backdrop natif | Passer à `.showModal()` via ref si backdrop requis |
| framer-motion poids | ~30KB gzip | Acceptable, à mesurer si l'app grossit |
| AdminPanel | Code partiellement câblé | À migrer vers les services/contextes correspondants |
| `disturb_status` drift | Backend bascule "offline"→"available" automatiquement, peut écraser un statut user "dnd" | Compensation côté serveur dans `AuthService.socketDisconnect` ; à revoir si le besoin de "dnd" devient explicite |
| Video call UI | `VideoCallProvider` monté mais composants UI à compléter | Construire `VideoCallOverlay` / grille de tiles en consommant le hook dédié |
