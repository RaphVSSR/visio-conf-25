# useAuth

**Source**: `FRONTENDV2/src/hooks/useAuth.ts`

Hook pour accéder à `AuthContext`. Encapsule `useContext(AuthContext)` avec une garde de fournisseur qui lance une erreur si utilisé en dehors de `AuthProvider`. Point d'accès unique pour l'état et les actions d'authentification dans les composants.

## Valeurs retournées

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `user` | `AuthUser \| null` | `{ _id: "abc", firstname: "John", ... }` | Données de l'utilisateur authentifié |
| `isAuthenticated` | `boolean` | `true` | Indique si l'utilisateur est authentifié |
| `isLoading` | `boolean` | `false` | Indique si une opération d'authentification est en cours |
| `expiresAt` | `number \| null` | `1711800000000` | Timestamp d'expiration de la session |
| `showExpiryWarning` | `boolean` | `false` | Indique si l'avertissement d'expiration de session doit être affiché |
| `loginRejected` | `boolean` | `false` | Indique si la dernière tentative de connexion a été rejetée |
| `socket` | `MessageClientAdapter \| null` | — | Wrapper client Socket.io |
| `login` | `(email: string, password: string) => void` | `login("a@b.com", "pass")` | Déclenche la connexion |
| `register` | `(data: { password, firstname, lastname, email, phone }) => void` | `register({...})` | Déclenche l'inscription |
| `logout` | `() => void` | `logout()` | Déclenche la déconnexion |
| `refreshSession` | `() => void` | `refreshSession()` | Prolonge la session courante |
| `dismissExpiryWarning` | `() => void` | `dismissExpiryWarning()` | Masque l'avertissement d'expiration |

## Détails

- Lance l'erreur `"useAuth must be used within an AuthProvider"` si le contexte est null

## Flux

Voir [auth-flows.md](../../flows/auth-flows.md)
