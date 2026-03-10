# Référence du composant TeamsSidebar — VisioConf

**Fichier source** : `FRONTENDV2/src/components/TeamsSidebar/TeamsSidebar.tsx`
**Styles** : `FRONTENDV2/src/components/TeamsSidebar/TeamsSidebar.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`TeamsSidebar` affiche la liste des équipes de l'utilisateur avec recherche, sélection et actions (créer, éditer). Indique le rôle admin et l'état de non-membre via des badges.

---

## 2. Props

```typescript
interface TeamsSidebarProps {
    teams: Team[]
    selectedTeam: Team | null
    onSelectTeam: (team: Team) => void
    onCreateTeam: () => void
    onEditTeam: (team: Team) => void
    isLoading: boolean
}
```

---

## 3. State local

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `searchQuery` | `string` | `""` | Filtre de recherche par nom d'équipe |

---

## 4. Comportement

- **Recherche** : Filtrage en temps réel par nom d'équipe (case-insensitive)
- **Badges** : `Admin` pour les admins, indication si non-membre
- **Settings** : Bouton d'édition visible uniquement pour les admins
- **Animation** : Framer Motion pour l'apparition des items
- **États** : Loading spinner, état vide avec message

---

## 5. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `SearchBar` | `design-system/` | Barre de recherche des équipes |
| `Button` | `design-system/` | Bouton de création d'équipe |
| `LucideIcons` | `design-system/` | Icônes (Settings, Users, Plus) |

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `TeamsPage` | TeamsPage rend TeamsSidebar | Composant parent |
| `Team` | Affiche les données Team | Type de données |
