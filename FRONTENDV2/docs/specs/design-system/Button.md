# Référence du composant Button — VisioConf Design System

**Fichier source** : `FRONTENDV2/src/design-system/components/Button/Button.tsx`
**Styles** : `FRONTENDV2/src/design-system/components/Button/Button.scss`
**Type** : Composant React fonctionnel (FC) — Primitif UI

---

## 1. Description

`Button` est le bouton réutilisable du design system. Rendu comme un `motion.button` (framer-motion), il supporte un texte, une icône optionnelle positionnée à gauche ou à droite, et toutes les props HTML/motion d'un bouton.

---

## 2. Props

```typescript
type ButtonProps = {
    text: string
} & (
    | { icon: keyof typeof icons, iconPosition: "left" | "right", iconSize: number }
    | { icon?: undefined, iconPosition?: undefined, iconSize?: undefined }
) & HTMLMotionProps<"button">
```

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `text` | `string` | oui | Texte du bouton |
| `icon` | `keyof typeof icons` | non | Nom de l'icône lucide-react |
| `iconPosition` | `"left" \| "right"` | si icon | Position de l'icône par rapport au texte |
| `iconSize` | `number` | si icon | Taille de l'icône en pixels |
| `...props` | `HTMLMotionProps<"button">` | non | Toutes les props framer-motion/HTML (onClick, className, etc.) |

**Union discriminée :** Si `icon` est fourni, `iconPosition` et `iconSize` sont obligatoires. Si `icon` est `undefined`, les deux autres doivent l'être aussi.

---

## 3. Structure HTML

```html
<motion.button class="btn" {...props}>
    {icon && iconPosition === "left" && <LucideIcons />}
    <span>{text}</span>
    {icon && iconPosition === "right" && <LucideIcons />}
</motion.button>
```

---

## 4. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `LucideIcons` | Button rend LucideIcons | Wrapper d'icône dynamique |
| `framer-motion` | Button = motion.button | Animations déclaratives |

---

## 5. Exemples

```tsx
<Button text="Déconnexion" icon="LogOut" iconPosition="left" iconSize={16} onClick={logout} />
<Button text="Nouvelle Discussion" icon="MessageSquare" iconPosition="left" iconSize={16} />
<Button text="Simple" />
```
