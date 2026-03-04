# Référence du composant Card — VisioConf Design System

**Fichier source** : `FRONTENDV2/src/design-system/components/Card/Card.tsx`
**Styles** : `FRONTENDV2/src/design-system/components/Card/Card.scss`
**Type** : Composant React fonctionnel (FC) — Primitif UI

---

## 1. Description

`Card` est le composant carte du design system. Rendu comme un `motion.div` avec animation hover (scale 1.02). Supporte une icône optionnelle, une couleur de bordure personnalisable via CSS custom property, et du contenu enfant libre.

---

## 2. Props

```typescript
type CardProps = PropsWithChildren<(
    | { icon: keyof typeof icons, iconPosition: "left" | "right", iconSize: number }
    | { icon?: undefined, iconPosition?: undefined, iconSize?: undefined }
) & {
    borderColor?: string
}> & Omit<HTMLMotionProps<"div">, "style">
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | oui | Contenu de la carte |
| `icon` | `keyof typeof icons` | non | Nom de l'icône lucide-react |
| `iconPosition` | `"left" \| "right"` | si icon | Position de l'icône |
| `iconSize` | `number` | si icon | Taille de l'icône |
| `borderColor` | `string` | non | Couleur CSS passée via `--card-border-color` |
| `...props` | `Omit<HTMLMotionProps<"div">, "style">` | non | Props motion/HTML (sauf style) |

---

## 3. Structure HTML

```html
<motion.div
    class="card"
    whileHover={{ scale: 1.02 }}
    style={{ "--card-border-color": borderColor }}
>
    {icon && iconPosition === "left" && <LucideIcons />}
    {children}
    {icon && iconPosition === "right" && <LucideIcons />}
</motion.div>
```

---

## 4. CSS Custom Property

| Variable | Source | Utilisation |
|----------|--------|-------------|
| `--card-border-color` | `borderColor` prop | Couleur de la bordure latérale de la carte |

---

## 5. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `LucideIcons` | Card rend LucideIcons | Wrapper d'icône dynamique |
| `framer-motion` | Card = motion.div | Animation hover |
| `Dashboard` | Dashboard rend des Card | Cartes de résumé |

---

## 6. Exemples

```tsx
<Card icon="MessageSquare" iconPosition="left" iconSize={20} borderColor="#1E3664">
    <h3>Messages non lus</h3>
    <p>12</p>
</Card>

<Card>
    <p>Carte simple sans icône</p>
</Card>
```
