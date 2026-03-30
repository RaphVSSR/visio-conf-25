# Toast

**Source**: `FRONTENDV2/src/design-system/components/Toast/Toast.tsx`

Composant de notification rendu en tant que `motion.article` avec des animations d'entrée/sortie à ressort. Supporte 4 variants visuels avec sélection automatique d'icône, des boutons d'action, un sous-titre et un bouton de fermeture.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `message` | `string` | `"Connection successful"` | Message principal du toast |
| `variant` | `ToastVariant` | `"success"` | Variant visuel. Valeur par défaut `"info"` |
| `onDismiss` | `() => void` | `() => remove(id)` | Callback de fermeture. Si absent, aucun bouton de fermeture n'est affiché |
| `actions` | `ToastAction[]` | voir ci-dessous | Boutons d'action affichés dans le pied du toast |
| `subtitle` | `string` | `"Chrome - Windows 11"` | Texte secondaire sous le message |

## Types

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `ToastVariant` | `"success" \| "danger" \| "warning" \| "info"` | `"warning"` | Variants visuels disponibles |
| `ToastAction` | `{ label: string, onClick: () => void, variant?: "primary" \| "ghost" }` | `{ label: "Accept", onClick: fn }` | Définition d'un bouton d'action. `variant` par défaut `"primary"` |

## Détails

Chaque variant correspond à une icône lucide-react : `success` -> `CheckCircle`, `danger` -> `XCircle`, `warning` -> `AlertTriangle`, `info` -> `Info` (toutes en taille 18). L'animation utilise une transition à ressort avec stiffness 500 et damping 35. La prop `layout` active le repositionnement automatique quand des toasts sont ajoutés/supprimés.
