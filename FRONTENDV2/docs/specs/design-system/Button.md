# Button

**Source**: `FRONTENDV2/src/design-system/components/Button/Button.tsx`

Bouton réutilisable rendu en tant que `motion.button` (framer-motion). Supporte un label texte et une icône optionnelle positionnée à gauche ou à droite via `LucideIcons`. Étend toutes les props framer-motion/HTML button.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `text` | `string` | `"Disconnect"` | Texte du label du bouton |
| `icon` | `keyof typeof icons` | `"LogOut"` | Nom de l'icône Lucide. Si fourni, `iconPosition` et `iconSize` sont requis |
| `iconPosition` | `"left" \| "right"` | `"left"` | Placement de l'icône par rapport au texte. Requis quand `icon` est défini |
| `iconSize` | `number` | `16` | Taille de l'icône en pixels. Requis quand `icon` est défini |
| `...props` | `HTMLMotionProps<"button">` | `onClick={fn}` | Toutes les props framer-motion et HTML button |

## Détails

Utilise une union discriminée : quand `icon` est fourni, `iconPosition` et `iconSize` deviennent obligatoires. Quand `icon` est undefined, les deux doivent aussi être undefined.
