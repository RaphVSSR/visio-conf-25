# AuthenticatedLayout

**Source**: `FRONTENDV2/src/components/AuthenticatedLayout/AuthenticatedLayout.tsx`

Wrapper de mise en page racine pour les routes authentifiées. Compose le NavigationSidebar avec les données utilisateur et un React Router Outlet pour le rendu des routes imbriquées.

## Props

Aucune prop (rendu en tant que `FC` sans paramètres).

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| user | `UserAuth \| null` (from useAuth) | `{ firstname: "John", ... }` | Objet utilisateur authentifié courant |
| logout | `() => void` (from useAuth) | `logout()` | Callback de déconnexion passé au onLogout de NavigationSidebar |

## Méthodes

Aucune méthode handler définie.

## Détails

- Construit un objet `SidebarUserData` à partir des champs de `user` : firstname, lastname, roles (valeurs par défaut : chaîne vide / tableau vide si null)
- Passe les constantes `NAVIGATION_ITEMS` et `SIDEBAR_BRAND` à NavigationSidebar
- Les routes enfants sont rendues dans `<main id="authenticatedContent">` via `<Outlet />`

## Flux

Voir [auth-flows.md](../../flows/auth-flows.md)
