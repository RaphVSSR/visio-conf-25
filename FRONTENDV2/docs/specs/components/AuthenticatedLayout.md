# Référence du composant AuthenticatedLayout — VisioConf

**Fichier source** : `FRONTENDV2/src/components/AuthenticatedLayout/AuthenticatedLayout.tsx`
**Styles** : `FRONTENDV2/src/components/AuthenticatedLayout/AuthenticatedLayout.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`AuthenticatedLayout` est le layout principal pour les utilisateurs authentifiés. Il compose la `NavigationSidebar` et un `Outlet` React Router pour les routes imbriquées.

---

## 2. Structure HTML sémantique

```html
<div id="authenticatedLayout">
    <NavigationSidebar
        items={NAVIGATION_ITEMS}
        logoSource="..."
        logoAltText="..."
        brandLabel="..."
        userData={{ firstname, lastname, roles }}
        onLogout={logout}
    />
    <main id="mainContent">
        <Outlet />
    </main>
</div>
```

---

## 3. Props et state

| Source | Propriété | Utilisation |
|--------|-----------|-------------|
| `useAuth()` | `user` | Données utilisateur pour la sidebar (firstname, lastname, roles) |
| `useAuth()` | `logout` | Callback de déconnexion passé à la sidebar |

---

## 4. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `NavigationSidebar` | `components/` | Navigation latérale avec items et profil |
| `Outlet` | `react-router-dom` | Rendu des routes enfants |

---

## 5. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `useAuth` | Layout utilise useAuth() | State d'auth et action logout |
| `NavigationSidebar` | Layout rend NavigationSidebar | Navigation principale |
| `UserAuth` | Layout est rendu par UserAuth | Garde de route parente |
