# AuthContext

**Source**: `FRONTENDV2/src/contexts/AuthContext.tsx`

Fournisseur de contexte React faisant le pont entre `AuthSync` (logique d'authentification Socket.io) et les composants React. Crée une instance `MessageClientAdapter` et `AuthSync` au montage, expose l'état et les actions d'authentification via le contexte, et nettoie au démontage.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `AuthContext` | `Context<AuthContextType \| null>` | — | L'objet de contexte React, exporté |
| `INITIAL_STATE` | `AuthState` (module const) | `{ user: null, isAuthenticated: false, isLoading: true, ... }` | État par défaut avec `isLoading: true`, tout le reste null/false |

## Méthodes / Actions / Valeurs retournées

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `AuthProvider` | `children: ReactNode` | `JSX.Element` | Composant fournisseur, crée socket + AuthSync au montage, détruit au démontage |
| `login` | `email: string, password: string` | `void` | Délègue à `AuthSync.login()` |
| `register` | `data: { password: string, firstname: string, lastname: string, email: string, phone: string }` | `void` | Délègue à `AuthSync.register()` |
| `logout` | — | `void` | Délègue à `AuthSync.logout()` |
| `refreshSession` | — | `void` | Délègue à `AuthSync.refreshSession()` |
| `dismissExpiryWarning` | — | `void` | Définit localement `showExpiryWarning: false` via setState |

## Exports

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `AuthContext` | `Context<AuthContextType \| null>` | — | L'objet de contexte |
| `AuthProvider` | `FC<PropsWithChildren>` | `<AuthProvider>{children}</AuthProvider>` | Le composant fournisseur |
| `AuthUser` | type (re-export) | — | Depuis `AuthSync.types.ts` |
| `AuthState` | type (re-export) | — | Depuis `AuthSync.types.ts` |
| `AuthActions` | type (re-export) | — | Depuis `AuthSync.types.ts` |
| `AuthContextType` | type (re-export) | — | Depuis `AuthSync.types.ts` |

## Détails

- Utilise la variable d'environnement `REACT_APP_BACKEND_API_URL` (défaut `http://localhost:3220`) pour la connexion socket
- La valeur du contexte inclut `socket: MessageClientAdapter | null` en plus de l'état et des actions
- Le montage crée socket + AuthSync ; le démontage appelle `destroy()` puis `disconnect()`

## Flux

Voir [auth-flows.md](../../flows/auth-flows.md)
