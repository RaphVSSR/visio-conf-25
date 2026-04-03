# Card

**Source**: `FRONTENDV2/src/design-system/components/Card/Card.tsx`

Conteneur carte rendu en tant que `motion.div` avec une animation de mise à l'échelle au survol (1.02). Supporte une icône optionnelle, une couleur de bordure personnalisée via la propriété CSS custom `--card-border-color`, et du contenu enfant libre. Étend toutes les props framer-motion/HTML div sauf `style`.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `children` | `ReactNode` | `<p>Content</p>` | Contenu de la carte |
| `icon` | `keyof typeof icons` | `"MessageSquare"` | Nom de l'icône Lucide. Si fourni, `iconPosition` et `iconSize` sont requis |
| `iconPosition` | `"left" \| "right"` | `"left"` | Placement de l'icône. Requis quand `icon` est défini |
| `iconSize` | `number` | `20` | Taille de l'icône en pixels. Requis quand `icon` est défini |
| `borderColor` | `string` | `"#1E3664"` | Définit la propriété CSS custom `--card-border-color`. Appliquée via style inline |
| `...props` | `Omit<HTMLMotionProps<"div">, "style">` | `className="x"` | Toutes les props framer-motion/HTML div sauf `style` |

## Détails

Utilise une union discriminée pour les props d'icône (même patron que Button). La prop `style` est omise du type spread car `borderColor` contrôle le style inline en interne via la propriété CSS custom.
