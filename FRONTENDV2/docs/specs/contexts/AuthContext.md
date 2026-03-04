# Référence du AuthContext — VisioConf

**Fichier source** : `FRONTENDV2/src/contexts/AuthContext.tsx`
**Type** : React Context Provider

---

## 1. Description

`AuthContext` est le pont entre le service `AuthService` (logique métier pub/sub) et les composants React (UI). Le provider instancie le controleur, SocketIO, et AuthService au montage, expose le state d'authentification et les actions via React Context, et nettoie tout au démontage.

---

## 2. Exports

| Export | Type | Description |
|--------|------|-------------|
| `AuthContext` | `Context<AuthContextType \| null>` | Le context React |
| `AuthProvider` | `FC<PropsWithChildren>` | Le composant provider |
| `AuthUser` | type (re-export) | Type utilisateur |
| `PendingSessionRequest` | type (re-export) | Type demande multi-session |
| `AuthState` | type (re-export) | Type state d'authentification |
| `AuthActions` | type (re-export) | Type actions d'authentification |
| `AuthContextType` | type (re-export) | Union AuthState & AuthActions |

---

## 3. State initial

```typescript
const INITIAL_STATE: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,          // true au démarrage (en attente de la vérification de session)
    expiresAt: null,
    sessionId: null,
    pendingLoginRequestId: null,
    pendingSessionRequests: [],
    showExpiryWarning: false,
    loginRejected: false,
}
```

---

## 4. Lifecycle du provider

### Montage (useEffect)

```typescript
1. new Controleur()                          // Crée le bus pub/sub
2. controleur.verboseall = VERBOSE           // Configure le logging si REACT_APP_VERBOSE
3. SocketIO.init(controleur)                 // Crée CanalSocketio + connexion Socket.io
4. authRef.current = new AuthService(        // Crée le service d'auth inscrit au controleur
       controleur, setState                  // setState = callback de mise à jour du state React
   )
```

### Démontage (cleanup)

```typescript
1. authRef.current?.destroy()    // Désinscrit du controleur, clear timer
2. authRef.current = null
3. SocketIO.disconnect()         // Ferme le socket, reset SocketIO
```

---

## 5. Actions exposées

| Action | Paramètres | Description |
|--------|------------|-------------|
| `login` | `email: string, password: string` | Délègue à `AuthService.login()` |
| `register` | `data: { password, firstname, lastname, email, phone }` | Délègue à `AuthService.register()` |
| `logout` | — | Délègue à `AuthService.logout()` |
| `refreshSession` | — | Délègue à `AuthService.refreshSession()` |
| `respondToPendingSession` | `requestId: string, accepted: boolean` | Délègue à `AuthService.respondToPendingSession()` |
| `dismissExpiryWarning` | — | `setState({ showExpiryWarning: false })` (action locale, pas de message serveur) |

---

## 6. Variables d'environnement

| Nom | Type | Description |
|-----|------|-------------|
| `REACT_APP_VERBOSE` | `"true" \| "false"` | Active le logging du controleur |
| `REACT_APP_VERBOSE_LVL` | `string (number)` | Niveau de verbosité (≥3 pour `verboseall`) |

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `AuthService` | AuthContext crée et détruit AuthService | Service métier inscrit au controleur |
| `SocketIO` | AuthContext initialise et déconnecte SocketIO | Singleton Socket.io |
| `Controleur` | AuthContext crée l'instance (JS) | Bus pub/sub partagé |
| `useAuth` | Hook d'accès au AuthContext | Expose `AuthContextType` aux composants |

---

## 8. Exemples

### Utilisation dans un composant

```typescript
const { user, isAuthenticated, login, logout } = useAuth()

if (!isAuthenticated) login("dev@visioconf.com", "d3vV1s10C0nf")
```

### Montage dans App.tsx

```tsx
<AuthProvider>
    <ToastProvider>
        <BrowserRouter>...</BrowserRouter>
        <AuthToasts />
    </ToastProvider>
</AuthProvider>
```
