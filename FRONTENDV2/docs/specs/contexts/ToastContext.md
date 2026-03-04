# Référence du ToastContext — VisioConf

**Fichier source** : `FRONTENDV2/src/contexts/ToastContext.tsx`
**Type** : React Context Provider

---

## 1. Description

`ToastContext` est le système de notifications toast global de l'application. Il gère une file de toasts avec auto-dismiss, animations via `framer-motion`, et accessibilité via `aria-live="polite"`.

---

## 2. Exports

| Export | Type | Description |
|--------|------|-------------|
| `ToastProvider` | `FC<PropsWithChildren>` | Le composant provider |
| `useToast` | `() => ToastContextType` | Hook d'accès au context |

---

## 3. Types

```typescript
type ToastItem = {
    id: string              // Auto-généré ("toast-1", "toast-2", ...)
    message: string
    variant: ToastVariant   // "success" | "danger" | "warning" | "info"
    subtitle?: string
    actions?: ToastAction[]
}

type ToastContextType = {
    addToast: (toast: Omit<ToastItem, "id"> & { duration?: number }) => string
    removeToast: (id: string) => void
}
```

---

## 4. API

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `addToast` | `{ message, variant, subtitle?, actions?, duration? }` | `string` (id) | Ajoute un toast. Auto-dismiss après `duration` ms (défaut 5000). `duration: 0` = pas d'auto-dismiss |
| `removeToast` | `id: string` | `void` | Retire un toast immédiatement |

---

## 5. Rendu

```tsx
<ToastContext.Provider value={{ addToast, removeToast }}>
    {children}
    <aside className="globalToastContainer" aria-live="polite">
        <AnimatePresence mode="popLayout">
            {toasts.map(toast => <Toast ... />)}
        </AnimatePresence>
    </aside>
</ToastContext.Provider>
```

- Le conteneur `<aside>` est rendu en dehors des `children` pour être toujours visible
- `aria-live="polite"` annonce les toasts aux screen readers sans interrompre
- `AnimatePresence mode="popLayout"` gère les animations d'entrée/sortie avec repositionnement automatique

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `Toast` | ToastProvider rend des composants Toast | Design system component |
| `AuthToasts` | Utilise `useToast` indirectement (même pattern) | Composant de notifications auth |
| `App` | App monte ToastProvider | Provider global |

---

## 7. Exemples

### Ajouter un toast depuis un composant

```typescript
const { addToast } = useToast()

addToast({
    message: "Connexion réussie",
    variant: "success",
    duration: 3000,
})
```

### Toast avec actions

```typescript
addToast({
    message: "Nouvelle demande de connexion",
    variant: "warning",
    actions: [
        { label: "Accepter", onClick: () => accept(), variant: "primary" },
        { label: "Refuser", onClick: () => reject(), variant: "ghost" },
    ],
    duration: 0, // Pas d'auto-dismiss
})
```
