# Référence du garde UserAuth — VisioConf

**Fichier source** : `FRONTENDV2/src/routing/UserAuth.tsx`
**Type** : Composant React fonctionnel (FC) — Route Guard

---

## 1. Description

`UserAuth` est la garde de route principale. Elle protège les routes authentifiées en vérifiant `isAuthenticated` et `isLoading` depuis le context d'auth. Si l'utilisateur n'est pas authentifié, il est redirigé vers `/login`. Pendant le chargement (vérification de session), un écran de chargement est affiché.

---

## 2. Logique de rendu

```
isLoading ?
    → <h1>Chargement du bundle...</h1>

!isAuthenticated ?
    → <Navigate to="/login" replace />

sinon
    → <Outlet />     (rend les routes enfants)
```

---

## 3. Routes protégées

| Route | Composant |
|-------|-----------|
| `/` | `Navigate → /home` |
| `/home` | `Home` |
| `/admin` | `AdminPanel` (via AdminAuth imbriqué) |

---

## 4. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `useAuth` | UserAuth utilise useAuth() | Accède à `isAuthenticated` et `isLoading` |
| `AdminAuth` | AdminAuth est imbriqué dans UserAuth | Second niveau de vérification (rôle admin) |
| `Outlet` | react-router-dom | Rend les routes enfants si authentifié |

---

## 5. Exemples

### Montage dans App.tsx

```tsx
<Routes>
    <Route element={<UserAuth />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route element={<AdminAuth />}>
            <Route path="/admin" element={<AdminPanel />} />
        </Route>
    </Route>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
</Routes>
```
