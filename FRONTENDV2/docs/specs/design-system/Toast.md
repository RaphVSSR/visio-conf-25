# Référence du composant Toast — VisioConf Design System

**Fichier source** : `FRONTENDV2/src/design-system/components/Toast/Toast.tsx`
**Styles** : `FRONTENDV2/src/design-system/components/Toast/Toast.scss`
**Type** : Composant React fonctionnel (FC) — Primitif UI

---

## 1. Description

`Toast` est le composant de notification du design system. Rendu comme un `motion.article` avec animations spring d'entrée/sortie. Supporte 4 variants visuels, des boutons d'action, un sous-titre, et un bouton de fermeture. Utilisé par `ToastContext` et `AuthToasts`.

---

## 2. Types

```typescript
type ToastVariant = "success" | "danger" | "warning" | "info"

type ToastAction = {
    label: string
    onClick: () => void
    variant?: "primary" | "ghost"
}

type ToastProps = {
    message: string
    variant?: ToastVariant      // défaut: "info"
    onDismiss?: () => void
    actions?: ToastAction[]
    subtitle?: string
}
```

---

## 3. Props

| Prop | Type | Required | Défaut | Description |
|------|------|----------|--------|-------------|
| `message` | `string` | oui | — | Message principal du toast |
| `variant` | `ToastVariant` | non | `"info"` | Variant visuel (couleur + icône) |
| `onDismiss` | `() => void` | non | — | Callback du bouton fermer (X). Si absent, pas de bouton |
| `actions` | `ToastAction[]` | non | — | Boutons d'action dans le toast |
| `subtitle` | `string` | non | — | Texte secondaire sous le message |

---

## 4. Icônes par variant

| Variant | Icône | Utilisation |
|---------|-------|-------------|
| `success` | `CheckCircle` | Opération réussie |
| `danger` | `XCircle` | Erreur |
| `warning` | `AlertTriangle` | Avertissement (ex: demande multi-session) |
| `info` | `Info` | Information (ex: expiration de session) |

---

## 5. Structure HTML sémantique

```html
<motion.article class="toast toast--{variant}">
    <span class="toast__icon">{icon}</span>
    <section class="toast__content">
        <p class="toast__message">{message}</p>
        {subtitle && <p class="toast__subtitle">{subtitle}</p>}
        {actions && (
            <footer class="toast__actions">
                <button class="toast__action toast__action--{variant}">
                    {label}
                </button>
            </footer>
        )}
    </section>
    {onDismiss && (
        <button class="toast__close" aria-label="Dismiss">
            <X size={14} />
        </button>
    )}
</motion.article>
```

---

## 6. Animations (framer-motion)

| Propriété | Valeur |
|-----------|--------|
| `initial` | `{ opacity: 0, x: 60, scale: 0.92 }` |
| `animate` | `{ opacity: 1, x: 0, scale: 1 }` |
| `exit` | `{ opacity: 0, x: 60, scale: 0.92 }` |
| `transition` | `{ type: "spring", stiffness: 500, damping: 35 }` |
| `layout` | `true` (repositionnement automatique) |

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `ToastContext` | ToastProvider rend des Toast | Provider global de notifications |
| `AuthToasts` | AuthToasts rend des Toast | Notifications d'auth |

---

## 8. Exemples

```tsx
<Toast message="Connexion réussie" variant="success" onDismiss={() => remove()} />

<Toast
    message="Nouvelle demande de connexion"
    variant="warning"
    subtitle="Chrome - Windows 11"
    actions={[
        { label: "Accepter", onClick: accept, variant: "primary" },
        { label: "Refuser", onClick: reject, variant: "ghost" },
    ]}
/>
```
