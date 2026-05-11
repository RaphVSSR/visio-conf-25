# AuthContext — VisioConf (Frontend)

**Fichier source** : `FRONTENDV2/src/contexts/AuthContext.tsx`
**Type** : React Context Provider
**Pendant logique** : `services/auth/AuthSync.ts` (voir `authentication/AuthSync.md`)

---

## 1. À quoi ça sert

Wrapper React minimal autour de `AuthSync`. Au montage, `AuthProvider` crée un `MessageClientAdapter` (transport Socket.io) et une instance `AuthSync` (handler des messages auth) ; il expose le `AuthState` + les actions à toute l'app via `AuthContext`. Au démontage, il détruit `AuthSync` et déconnecte le socket.

Aucune logique métier ici : tout le pub/sub vit dans `AuthSync`. `AuthContext` n'est qu'un pont React ↔ service.

---

## 2. Exports

| Export | Type | Description |
|--------|------|-------------|
| `AuthContext` | `Context<AuthContextType \| null>` | Le React Context |
| `AuthProvider` | `FC<PropsWithChildren>` | Provider à monter haut dans l'arbre |
| `AuthUser` | type (re-export depuis `AuthSync.types`) | User exposé après authentification |
| `AuthState` | type (re-export) | Forme du state d'auth |
| `AuthActions` | type (re-export) | Actions exposées |
| `AuthContextType` | type (re-export) | `AuthState & AuthActions & { socket }` |

---

## 3. State initial

```typescript
const INITIAL_STATE: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isRefreshing: false,
    expiresAt: null,
    showExpiryWarning: false,
    loginRejected: false,
}
```

`isLoading: true` au démarrage : on attend la première réponse `authenticate_response` (envoyée automatiquement par `AuthSync` au boot).

---

## 4. Lifecycle du provider

### Montage (`useEffect`)

```typescript
1. new MessageClientAdapter(REACT_APP_BACKEND_API_URL)   // Socket.io + bus pub/sub
2. authRef.current = new AuthSync(socket, setState)      // Inscrit les 3 handlers, envoie authenticate {}
```

### Démontage (cleanup)

```typescript
1. authRef.current?.destroy()    // Détache les handlers + clear timers
2. socket.disconnect()           // Ferme la connexion Socket.io
```

---

## 5. Actions exposées

| Action | Paramètres | Description |
|--------|------------|-------------|
| `login` | `email : string, password : string` | Délègue à `AuthSync.login()` |
| `register` | `{ password, firstname, lastname, email, phone }` | Délègue à `AuthSync.register()` |
| `logout` | — | Délègue à `AuthSync.logout()` (`POST /auth/logout`) |
| `refreshSession` | — | Délègue à `AuthSync.refreshSession()` (`POST /auth/refresh`) |
| `dismissExpiryWarning` | — | Action **locale** : `setState({ showExpiryWarning: false })`, pas de message serveur |

---

## 6. Messages

`AuthContext` ne traite **aucun message** directement — c'est `AuthSync` qui s'occupe du pub/sub. Voir `authentication/AuthSync.md` pour le catalogue complet (`login` / `register` / `authenticate` + `_response`).

---

## 7. Variables d'environnement

| Nom | Défaut | Description |
|-----|--------|-------------|
| `REACT_APP_BACKEND_API_URL` | `http://localhost:3220` | URL passée à `MessageClientAdapter` |

---

## 8. Relations

| Composant | Relation |
|-----------|----------|
| `AuthSync` | Instancié par `AuthProvider` ; reçoit `setState` comme callback |
| `MessageClientAdapter` | Créé par `AuthProvider`, détruit au cleanup |
| `useAuth` | Hook qui consomme `AuthContext` (vérifie le provider) |
| `LoginForm` / `SignupForm` / `AuthToasts` / `Dashboard` / … | Lisent le state + appellent les actions via `useAuth()` |

---

## 9. Exemples

```tsx
// App.tsx
<AuthProvider>
    <ToastProvider>
        <BrowserRouter>...</BrowserRouter>
        <AuthToasts />
    </ToastProvider>
</AuthProvider>

// Dans un composant
const { user, isAuthenticated, login, logout } = useAuth()

if (!isAuthenticated) login(email, password) // credentials saisis par l'utilisateur
```
