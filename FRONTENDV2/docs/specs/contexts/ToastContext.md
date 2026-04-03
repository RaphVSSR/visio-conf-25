# ToastContext

**Source**: `FRONTENDV2/src/contexts/ToastContext.tsx`

Système global de notifications toast. Gère une file d'éléments toast avec fermeture automatique, transitions animées via `framer-motion` (`AnimatePresence mode="popLayout"`), et accessibilité via `aria-live="polite"`. Affiche les toasts dans un conteneur `<aside>` en dehors des enfants.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `ToastItem.id` | `string` | `"toast-3"` | ID auto-généré incrémentiel |
| `ToastItem.message` | `string` | `"Login successful"` | Texte principal du toast |
| `ToastItem.variant` | `ToastVariant` | `"success"` | Style visuel du toast |
| `ToastItem.subtitle` | `string?` | `"Welcome back"` | Texte secondaire optionnel |
| `ToastItem.actions` | `ToastAction[]?` | `[{ label: "Undo", onClick: fn }]` | Boutons d'action optionnels |

## Méthodes / Actions / Valeurs retournées

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `addToast` | `toast: { message: string, variant: ToastVariant, subtitle?: string, actions?: ToastAction[], duration?: number }` | `string` (id) | Ajoute un toast. Fermeture automatique après `duration` ms (défaut 5000). Définir `duration: 0` pour désactiver la fermeture automatique |
| `removeToast` | `id: string` | `void` | Supprime un toast immédiatement |
| `useToast` | — | `{ addToast, removeToast }` | Hook pour accéder au contexte. Lance une erreur si utilisé en dehors de `ToastProvider` |

## Exports

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `ToastProvider` | `FC<PropsWithChildren>` | `<ToastProvider>{children}</ToastProvider>` | Le composant fournisseur |
| `useToast` | `() => ToastContextType` | `const { addToast } = useToast()` | Hook pour consommer le contexte |
