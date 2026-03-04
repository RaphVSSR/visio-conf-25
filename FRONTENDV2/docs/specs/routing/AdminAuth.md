# Référence du garde AdminAuth — VisioConf

**Fichier source** : `FRONTENDV2/src/routing/AdminAuth.tsx`
**Type** : Composant React fonctionnel (FC) — Route Guard

---

## 1. Description

`AdminAuth` est la garde de route pour les pages d'administration. Elle vérifie que l'utilisateur authentifié possède le rôle `"admin"` dans son tableau `roles`. Si ce n'est pas le cas, il est redirigé vers `/home`.

**Prérequis :** `AdminAuth` doit toujours être imbriqué dans `UserAuth`. L'authentification est déjà vérifiée — AdminAuth ne vérifie que les permissions.

---

## 2. Logique de rendu

```
!user?.roles?.includes("admin") ?
    → <Navigate to="/home" replace />

sinon
    → <Outlet />     (rend les routes enfants admin)
```

---

## 3. Routes protégées

| Route | Composant |
|-------|-----------|
| `/admin` | `AdminPanel` |

---

## 4. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `useAuth` | AdminAuth utilise useAuth() | Accède à `user` pour vérifier les rôles |
| `UserAuth` | AdminAuth est imbriqué dans UserAuth | L'auth est vérifiée en amont |
| `Outlet` | react-router-dom | Rend les routes enfants si admin |
