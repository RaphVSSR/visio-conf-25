# Référence du hook useAuth — VisioConf

**Fichier source** : `FRONTENDV2/src/hooks/useAuth.ts`
**Type** : Custom React Hook

---

## 1. Description

`useAuth` est le hook d'accès au `AuthContext`. Il encapsule `useContext(AuthContext)` avec une vérification de provider et un typage strict. C'est le seul point d'accès recommandé au state et aux actions d'authentification.

**Note :** Le fichier s'appelait `useAuthMessages.ts` (nom historique) et a été renommé en `useAuth.ts` pour la cohérence.

---

## 2. Signature

```typescript
function useAuth(): AuthContextType
```

- **Retour** : `AuthContextType` = `AuthState & AuthActions`
- **Erreur** : Throw `"useAuth must be used within an AuthProvider"` si utilisé en dehors du provider

---

## 3. Valeurs retournées

### State (AuthState)

| Propriété | Type | Description |
|-----------|------|-------------|
| `user` | `AuthUser \| null` | Données utilisateur authentifié |
| `isAuthenticated` | `boolean` | L'utilisateur est-il authentifié ? |
| `isLoading` | `boolean` | Une opération d'auth est en cours ? |
| `expiresAt` | `number \| null` | Timestamp d'expiration de la session |
| `sessionId` | `string \| null` | ID de la session courante |
| `pendingLoginRequestId` | `string \| null` | ID de la demande multi-session en attente (côté demandeur) |
| `pendingSessionRequests` | `PendingSessionRequest[]` | Demandes multi-session à approuver (côté session existante) |
| `showExpiryWarning` | `boolean` | Faut-il afficher l'avertissement d'expiration ? |
| `loginRejected` | `boolean` | La dernière tentative de login a été rejetée par une session existante ? |

### Actions (AuthActions)

| Action | Paramètres | Description |
|--------|------------|-------------|
| `login` | `email: string, password: string` | Lance une connexion |
| `register` | `data: { password, firstname, lastname, email, phone }` | Lance une inscription |
| `logout` | — | Déconnecte l'utilisateur |
| `refreshSession` | — | Prolonge la session |
| `respondToPendingSession` | `requestId: string, accepted: boolean` | Accepte ou refuse une demande multi-session |
| `dismissExpiryWarning` | — | Ferme l'avertissement d'expiration |

---

## 4. Composants qui utilisent useAuth

| Composant | Propriétés utilisées |
|-----------|----------------------|
| `LoginForm` | `login`, `isLoading`, `isAuthenticated`, `pendingLoginRequestId`, `loginRejected` |
| `SignupForm` | `register`, `isLoading`, `isAuthenticated` |
| `Home` | `isAuthenticated`, `user`, `logout` |
| `UserAuth` | `isAuthenticated`, `isLoading` |
| `AdminAuth` | `user` |
| `SessionExpiryModal` | `showExpiryWarning`, `expiresAt`, `refreshSession`, `dismissExpiryWarning` |
| `SessionPendingModal` | `pendingSessionRequests`, `respondToPendingSession` |
| `AuthToasts` | `showExpiryWarning`, `expiresAt`, `refreshSession`, `dismissExpiryWarning`, `pendingSessionRequests`, `respondToPendingSession` |

---

## 5. Exemples

```typescript
const { user, isAuthenticated, login } = useAuth()

if (!isAuthenticated) return <Navigate to="/login" replace />

return <h1>Bonjour, {user?.firstname}</h1>
```
