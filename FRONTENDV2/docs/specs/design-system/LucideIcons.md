# LucideIcons

**Source**: `FRONTENDV2/src/design-system/components/LucideIcons/LucideIcons.tsx`

Wrapper type-safe pour les icônes lucide-react. Affiche dynamiquement toute icône du jeu lucide-react par nom sous forme de chaîne, avec un typage strict via `keyof typeof icons`.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `name` | `keyof typeof icons` | `"LogOut"` | Nom de l'icône Lucide (1000+ disponibles) |
| `size` | `number` | `16` | Taille de l'icône en pixels |
| `className` | `string` | `"btnIco"` | Classe CSS |

## Détails

Effectue une recherche dynamique via `icons[name]` pour résoudre le composant icône, puis le rend avec `size` et les props restantes en spread.
