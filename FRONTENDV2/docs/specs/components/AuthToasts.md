# AuthToasts

**Source**: `FRONTENDV2/src/components/AuthToasts/AuthToasts.tsx`

Composant global de notification d'authentification qui affiche un toast d'avertissement d'expiration de session avec un compte à rebours en temps réel. Retourne null quand aucun avertissement n'est actif.

## Props

Aucune prop (rendu en tant que `FC` sans paramètres).

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| timeLeft | `string` | `"2:30"` | Chaîne de compte à rebours formatée "M:SS" jusqu'à l'expiration de session |
| showExpiryWarning | `boolean` (from useAuth) | `true` | Contrôle la visibilité du toast |
| expiresAt | `number` (from useAuth) | `1711814400000` | Timestamp utilisé pour calculer le temps restant |
| refreshSession | `() => void` (from useAuth) | -- | Appelé par le bouton d'action "Prolonger" |
| dismissExpiryWarning | `() => void` (from useAuth) | -- | Appelé par le bouton d'action "Ignorer" |

## Méthodes

Aucune méthode handler nommée. La logique du compte à rebours s'exécute dans un useEffect avec setInterval (tick de 1s).

## Détails

- Encapsulé dans un `<aside>` avec `aria-live="assertive"` pour les annonces aux lecteurs d'écran
- Utilise `AnimatePresence` (framer-motion) avec `mode="popLayout"` pour les animations d'entrée/sortie du toast
- Affiche un seul composant `Toast` (design-system) avec le variant `"info"`, deux actions : Prolonger (primary) et Ignorer (ghost)
- L'intervalle est effacé au démontage ou quand warning/expiresAt change

## Flux

Voir [auth-flows.md](../../flows/auth-flows.md)
