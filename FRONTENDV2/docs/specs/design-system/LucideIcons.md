# Référence du composant LucideIcons — VisioConf Design System

**Fichier source** : `FRONTENDV2/src/design-system/components/LucideIcons/LucideIcons.tsx`
**Type** : Composant React fonctionnel (FC) — Primitif UI

---

## 1. Description

`LucideIcons` est le wrapper type-safe pour les icônes lucide-react. Il permet de rendre dynamiquement n'importe quelle icône du set lucide-react par son nom (string), avec un typage strict via `keyof typeof icons`.

---

## 2. Props

```typescript
type LucideIconsProps = {
    name: keyof typeof icons     // Nom de l'icône (type-safe, ~1000+ icônes)
    size?: number                // Taille en pixels
    className?: string           // Classe CSS
}
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `keyof typeof icons` | oui | Nom de l'icône lucide-react |
| `size` | `number` | non | Taille en pixels |
| `className` | `string` | non | Classe CSS additionnelle |

---

## 3. Fonctionnement

```typescript
const Icon = icons[name]    // Lookup dynamique dans le registre lucide-react
return <Icon size={size} {...props} />
```

---

## 4. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `Button` | Button rend LucideIcons | Icônes dans les boutons |
| `Card` | Card rend LucideIcons | Icônes dans les cartes |
| `lucide-react` | LucideIcons wrappe lucide-react | Bibliothèque d'icônes source |

---

## 5. Exemples

```tsx
<LucideIcons name="LogOut" size={16} className="btnIco" />
<LucideIcons name="MessageSquare" size={20} />
```
