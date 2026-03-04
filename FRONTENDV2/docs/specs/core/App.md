# Référence du composant App — VisioConf

**Fichier source** : `FRONTENDV2/src/core/App.tsx`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`App` est le composant racine de l'application. Il monte les providers (AuthProvider, ToastProvider), configure le routeur (BrowserRouter), et définit toutes les routes avec leurs gardes. C'est le seul fichier qui a une vue d'ensemble de l'architecture frontend.

---

## 2. Hiérarchie des providers

```
<AuthProvider>
    <ToastProvider>
        <BrowserRouter>
            <Routes>...</Routes>
        </BrowserRouter>
        <AuthToasts />
    </ToastProvider>
</AuthProvider>
```

**Ordre important :**
- `AuthProvider` en premier car `ToastProvider` et `AuthToasts` dépendent du context d'auth
- `ToastProvider` encapsule le router et `AuthToasts` pour que les toasts soient visibles sur toutes les pages
- `AuthToasts` est en dehors du `BrowserRouter` car c'est un overlay global (pas lié à une route)

---

## 3. Table des routes

| Path | Composant | Garde | Description |
|------|-----------|-------|-------------|
| `/login` | `Login` | aucune (public) | Page de connexion |
| `/signup` | `Signup` | aucune (public) | Page d'inscription |
| `/` | `Navigate → /home` | `UserAuth` | Redirection vers /home |
| `/home` | `Home` | `UserAuth` | Page d'accueil (dashboard) |
| `/admin` | `AdminPanel` | `UserAuth` + `AdminAuth` | Panel d'administration |

---

## 4. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `AuthProvider` | App monte AuthProvider | Provider d'authentification (contexte global) |
| `ToastProvider` | App monte ToastProvider | Provider de notifications toast |
| `BrowserRouter` | App monte le routeur | react-router-dom v7 |
| `UserAuth` | Garde de route | Redirige vers /login si non authentifié |
| `AdminAuth` | Garde de route imbriquée | Redirige vers /home si pas admin |
| `AuthToasts` | Composant global | Affiche les toasts d'auth (expiration, pending) |

---

## 5. Exemples

### Point d'entrée (index.tsx)

```typescript
ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
```
