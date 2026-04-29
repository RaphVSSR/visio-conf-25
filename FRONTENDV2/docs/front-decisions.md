# Décisions Frontend — VisioConf

FAQ structurelle du frontend. Chaque entrée suit : question → doute → solution → pourquoi.

---

# 1. Architecture & Pattern

## Pourquoi cette arborescence frontend ?

**Point de départ : c'est la View du MVC.** Le frontend est la couche de présentation — il lit et affiche les données fournies par le serveur via le bus pub/sub. Il ne prend aucune décision « supérieure ». Le serveur décide, le frontend réagit.

**Le controleur.js est partagé.** Le même bus pub/sub tourne côté backend et côté frontend. Les services frontend s'inscrivent au controleur exactement comme les services backend — via `inscription()`, `envoie()`, `traitementMessage()`.

**Conséquence sur les dossiers :** La structure reflète une séparation par responsabilité :
- `Controller/` = le bus pub/sub (off-limits) + types TS + classe abstraite
- `services/` = les services métier inscrits au controleur (AuthService)
- `contexts/` = les React Context providers (pont entre services et composants)
- `hooks/` = les hooks d'accès aux contexts
- `components/` = les composants UI réutilisables
- `pages/` = les composants page (1 page = 1 route)
- `design-system/` = les composants UI primitifs (Button, Card, Toast, etc.)
- `routing/` = les gardes de route (auth, admin)
- `core/` = le point d'entrée de l'app (App.tsx)

```
src/
├── index.tsx                            ← Point d'entrée React
├── core/
│   └── App.tsx                          ← Composant racine, routing, providers
├── Controller/                          ← Bus pub/sub (OFF-LIMITS)
│   ├── controleur.js                    ← Bus de messages (OFF-LIMITS)
│   ├── canalsocketio.js                 ← Pont Socket.io ↔ controleur (OFF-LIMITS)
│   ├── Controller.service.ts            ← Classe abstraite ControllerService
│   └── Controller.types.ts              ← Types TS du controleur
├── services/                            ← Services métier inscrits au controleur
│   ├── SocketIO.ts                      ← Singleton Socket.io client
│   └── auth/
│       ├── AuthService.ts               ← Service d'auth (messages + state)
│       └── AuthService.types.ts         ← Types auth
├── contexts/                            ← React Context providers
│   ├── AuthContext.tsx                   ← Provider d'authentification
│   └── ToastContext.tsx                  ← Provider de notifications toast
├── hooks/                               ← Custom hooks d'accès aux contexts
│   └── useAuth.ts                       ← Hook useAuth()
├── components/                          ← Composants UI réutilisables
│   ├── LoginForm/
│   ├── SignupForm/
│   ├── Dashboard/
│   ├── AdminTabPanel/
│   ├── SessionExpiryModal/
│   ├── AuthToasts/
│   └── index.ts
├── pages/                               ← Composants page (1 page = 1 route)
│   ├── Home/
│   ├── Login/
│   ├── Signup/
│   ├── AdminPanel/
│   └── index.ts
├── design-system/                       ← Primitifs UI
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Toast/
│   │   ├── SearchBar/
│   │   ├── LucideIcons/
│   │   └── index.ts
│   └── scss/
│       ├── _colors.scss
│       └── global.scss
└── routing/                             ← Gardes de route
    ├── UserAuth.tsx
    └── AdminAuth.tsx
```

**Pourquoi chaque dossier existe :**

| Dossier | Raison d'être |
|---------|---------------|
| `core/` | Le composant racine `App.tsx` qui monte les providers, le router, et les routes. C'est le seul fichier qui a une vue d'ensemble de l'app. |
| `Controller/` | Le bus pub/sub partagé avec le backend. `controleur.js` et `canalsocketio.js` sont off-limits. Les types TS et la classe abstraite `ControllerService` s'ajoutent par-dessus sans toucher au JS. |
| `services/` | Les services métier inscrits au controleur. Un service écoute et émet des messages, gère du state, et expose des méthodes publiques. C'est le miroir frontend des services backend. |
| `contexts/` | Le pont entre les services (logique métier) et les composants React (UI). Un context provider instancie un service et expose son state + actions via React Context. |
| `hooks/` | Les custom hooks qui encapsulent `useContext()` avec le bon typage et la vérification de provider. |
| `components/` | Les composants UI qui consomment les contexts et affichent les données. Chaque composant est dans son dossier avec son `.tsx` et `.scss`. |
| `pages/` | Les composants de niveau page, mappés 1:1 avec les routes. Une page compose des composants et peut avoir sa propre logique d'affichage. |
| `design-system/` | Les primitifs UI réutilisables partout dans l'app. Indépendants de la logique métier — pas de dépendance aux services ou contexts. |
| `routing/` | Les gardes de route (route guards). Vérifient l'état d'auth et redirigent si nécessaire. Utilisent `Outlet` de react-router-dom pour le rendu conditionnel. |

---

## Pourquoi un design system séparé des composants ?

**Constat :** Les composants comme `Button`, `Card`, `Toast` sont des primitifs UI purs — ils ne dépendent d'aucun context, d'aucun service, d'aucune logique métier. Les composants comme `LoginForm`, `Dashboard` dépendent du context d'auth.

**Solution :** Deux niveaux de composants :
- `design-system/components/` = primitifs (Button, Card, Toast, SearchBar, LucideIcons). Aucune dépendance métier. Peuvent être réutilisés dans n'importe quel projet.
- `components/` = composants applicatifs qui consomment les contexts et composent les primitifs. Spécifiques à VisioConf.

**Avantage :** Le design system peut évoluer indépendamment de la logique métier. Les primitifs sont testables en isolation.

---

## Pourquoi un service AuthService séparé du AuthContext ?

**Doute initial :** Pourquoi ne pas mettre toute la logique d'auth directement dans le AuthContext ?

**Réflexion :**
- Le AuthContext est un composant React — il suit le lifecycle React (mount, unmount, re-render)
- Le AuthService est un service inscrit au controleur — il suit le lifecycle du bus pub/sub (inscription, traitementMessage, désinscription)
- Mélanger les deux rend le code fragile : les callbacks de messages arrivent en dehors du render cycle de React

**Solution :** Le AuthService hérite de `ControllerService`, gère toute la logique métier et les messages. Le AuthContext crée l'instance, passe `setState` comme callback, et expose le state + actions au composants.

**Pattern :**
```
AuthContext (React) → crée AuthService (controleur)
AuthService reçoit un message → appelle setState
React re-render → les composants voient le nouveau state
```

---

## Pourquoi sessionStorage et pas localStorage ou cookies ?

**Raison :** Isolation par onglet. Le flux multi-session implique que chaque onglet a sa propre session. Si un onglet est rejeté, seul cet onglet perd son sessionId — les autres restent intacts.

Voir `BACKEND/docs/back-decisions.md` — section "Comment le sessionId est persisté côté client ?" pour le raisonnement complet.

---

## Pourquoi framer-motion partout ?

**Constat :** Les animations d'entrée/sortie et les transitions entre états (loading, authenticated, pending) sont omniprésentes dans l'UI.

**Solution :** `framer-motion` gère toutes les animations. Les composants du design system (`motion.button`, `motion.div`, `motion.article`) héritent des props de framer-motion pour permettre des animations déclaratives.

**Compromis :** Dépendance lourde (~30KB gzip). Acceptable pour une app de visioconférence — l'UX bénéficie fortement des animations fluides.

---

# 2. Gestion d'état

## Pourquoi React Context et pas Redux/Zustand ?

**Réflexion :**
- Le state global de l'app est limité : auth + toasts. Pas de state complexe, pas de normalisation, pas de relations entre entités côté client
- Le state des données métier (users, teams, channels) vit côté serveur et arrive via le controleur — pas besoin de le cacher dans un store client
- Redux ajouterait du boilerplate pour un gain nul. Zustand serait plus léger mais ne résout pas un problème qu'on a

**Solution :** React Context + useState. Un context par domaine (auth, toast). Les services inscrivent des callbacks `setState` pour mettre à jour le context depuis les messages du controleur.

---

## Pourquoi le hook s'appelle useAuth et pas useAuthMessages ?

**Historique :** Le fichier s'appelait `useAuthMessages.ts` dans la première itération, quand le hook exposait les messages bruts du controleur. Le hook a évolué pour exposer le context complet (state + actions), et le fichier a été renommé en `useAuth.ts` pour refléter ce changement.

---

# 3. Routing

## Pourquoi des gardes de route imbriquées ?

**Pattern :** `UserAuth` est la première couche (vérifie l'authentification). `AdminAuth` est imbriquée dedans (vérifie le rôle admin). Les routes protégées sont des `Outlet` de react-router-dom v7.

```
Routes
├── /login          (public)
├── /signup         (public)
└── UserAuth        (vérifie isAuthenticated)
    ├── /           → redirect /home
    ├── /home       (Home)
    └── AdminAuth   (vérifie user.roles.includes("admin"))
        └── /admin  (AdminPanel)
```

**Pourquoi pas un seul guard :** La logique est séparée — vérifier l'authentification et vérifier les permissions sont deux responsabilités distinctes. Un utilisateur authentifié sans rôle admin doit être redirigé vers `/home`, pas vers `/login`.

---

# 4. Composants

## Pourquoi du HTML sémantique strict ?

**Règle :** `main`, `nav`, `section`, `article`, `header`, `footer`, `aside`, `dialog`, `fieldset` sont utilisés systématiquement. `div` uniquement pour le layout quand aucun élément sémantique ne convient.

**Pourquoi :** Accessibilité native (screen readers), SEO implicite, et lisibilité du code. Un `<dialog>` est plus explicite qu'un `<div className="modal">`.

---

## Pourquoi les modales utilisent `<dialog>` ?

**Raison :** L'élément HTML `<dialog>` offre un comportement natif (focus trap, accessibilité, `open` attribute). Pas besoin de bibliothèque de modales.

**Limitation actuelle :** Les modales utilisent `<dialog open>` (non-modal). Pour un vrai dialog modal avec backdrop, il faudrait utiliser `.showModal()` via ref.

---

# 5. Doutes ouverts

| Sujet | Doute | Piste |
|-------|-------|-------|
| ~~useAuthMessages.ts~~ | ~~Nom de fichier trompeur~~ | Renommé en `useAuth.ts` ✓ |
| SearchBar dropdown | Fonctionnalité non implémentée | TODO dans le code |
| Dashboard valeurs | Toutes les valeurs dynamiques commentées | À connecter aux services quand disponibles |
| AdminPanel | Code ancien commenté, valeurs hardcodées | À migrer vers le pattern ControllerService |
| dialog vs .showModal() | Les modales sont non-modales (pas de backdrop natif) | Passer à `.showModal()` si backdrop requis |
| framer-motion poids | ~30KB gzip pour des animations | Acceptable pour une app de visioconf |
| AdminMenu | Composant entièrement commenté | À supprimer si AdminTabPanel le remplace définitivement |
