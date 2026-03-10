# Référence du composant NavigationSidebar — VisioConf

**Fichier source** : `FRONTENDV2/src/components/NavigationSidebar/NavigationSidebar.tsx`
**Styles** : `FRONTENDV2/src/components/NavigationSidebar/NavigationSidebar.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`NavigationSidebar` est la barre de navigation latérale principale. Elle se replie/déplie au survol avec une animation Framer Motion. Filtre les items de navigation par rôle utilisateur.

---

## 2. Props

```typescript
interface NavigationSidebarProps {
    items: NavigationItem[]
    logoSource: string
    logoAltText: string
    brandLabel: string
    userData: SidebarUserData
    onLogout: () => void
}

interface NavigationItem {
    label: string
    path: string
    icon: keyof typeof icons
    requiresRole?: string
}

interface SidebarUserData {
    firstname: string
    lastname: string
    roles: string[]
}
```

---

## 3. State local

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `expanded` | `boolean` | `false` | État replié/déplié de la sidebar (au hover) |

---

## 4. Configuration exportée

```typescript
export const NAVIGATION_ITEMS: NavigationItem[] = [
    { label: "Discussions", path: "/discussions", icon: "MessageSquare" },
    { label: "Equipes", path: "/equipes", icon: "Users" },
    { label: "Drive", path: "/drive", icon: "FolderOpen" },
    { label: "Annuaire", path: "/annuaire", icon: "BookOpen" },
    { label: "Admin", path: "/admin", icon: "UserRoundCog", requiresRole: "admin" },
]

export const SIDEBAR_BRAND = {
    logoSource: "/logos/logo_univ_grand.svg",
    logoAltText: "Logo Université de Toulon",
    brandLabel: "Université de Toulon",
}
```

---

## 5. Comportement

- **Filtrage par rôle** : Les items avec `requiresRole` sont masqués si l'utilisateur n'a pas le rôle correspondant
- **Animation** : Framer Motion pour l'expansion au hover (largeur variable)
- **Avatar** : Initiales de l'utilisateur (firstname[0] + lastname[0])
- **Déconnexion** : Bouton en bas de la sidebar

---

## 6. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `LucideIcons` | `design-system/` | Icônes de navigation dynamiques |
| `NavLink` | `react-router-dom` | Liens de navigation avec état actif |
| `motion.nav` | `framer-motion` | Animation d'expansion |

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `AuthenticatedLayout` | Layout rend NavigationSidebar | Composant parent |
| `LucideIcons` | Sidebar utilise LucideIcons | Rendu dynamique des icônes |
