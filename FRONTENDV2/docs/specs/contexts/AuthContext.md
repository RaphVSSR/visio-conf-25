# Référence du AuthContext — VisioConf

**Fichier source** : `FRONTENDV2/src/contexts/AuthContext.tsx`
**Type** : React Context Provider

---

## 1. Description

`AuthContext` est le pont entre `AuthSync` (logique métier Socket.io) et les composants React (UI). Le provider instancie `MessageClientAdapter` et `AuthSync` au montage, expose le state d'authentification et les actions via React Context, et nettoie tout au démontage.

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
| `AuthContextType` | type (re-export) | Union AuthState & AuthActions & { socket } |

---

## 3. State initial

```typescript
const INITIAL_STATE: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    expiresAt: null,
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
1. socket = new MessageClientAdapter(REACT_APP_BACKEND_API_URL || "http://localhost:3220")
2. socketRef.current = socket
3. authRef.current = new AuthSync(socket, setState)
   // → s'abonne aux 4 messages response
   // → envoie authenticate dès que le socket est prêt
```

### Démontage (cleanup)

```typescript
1. authRef.current?.destroy()    // Désabonne des messages, clear timer
2. authRef.current = null
3. socket.disconnect()           // Ferme la connexion Socket.io
4. socketRef.current = null
```

---

## 5. Actions exposées

| Action | Paramètres | Description |
|--------|------------|-------------|
| `login` | `email: string, password: string` | Délègue à `AuthSync.login()` |
| `register` | `data: { password, firstname, lastname, email, phone }` | Délègue à `AuthSync.register()` |
| `logout` | — | Délègue à `AuthSync.logout()` |
| `refreshSession` | — | Délègue à `AuthSync.refreshSession()` |
| `respondToPendingSession` | `requestId: string, accepted: boolean` | Délègue à `AuthSync.respondToPendingSession()` |
| `dismissExpiryWarning` | — | `setState({ showExpiryWarning: false })` (action locale) |

---

## 6. Variables d'environnement

| Nom | Type | Description |
|-----|------|-------------|
| `REACT_APP_BACKEND_API_URL` | `string` | URL du backend. Défaut: `"http://localhost:3220"` |

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `AuthSync` | AuthContext crée et détruit AuthSync | Service métier Socket.io |
| `MessageClientAdapter` | AuthContext crée et déconnecte le socket | Wrapper socket.io-client |
| `useAuth` | Hook d'accès au AuthContext | Expose `AuthContextType` aux composants |

---

## 8. Exemples

### Utilisation dans un composant

```typescript
const { user, isAuthenticated, socket, login, logout } = useAuth()

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
