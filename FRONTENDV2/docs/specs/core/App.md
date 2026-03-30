# App

**Source**: `FRONTENDV2/src/core/App.tsx`

Composant racine de l'application. Monte la hiérarchie de fournisseurs (AuthProvider > ToastProvider), configure le routage via BrowserRouter, définit toutes les routes avec leurs gardes, et affiche l'overlay global AuthToasts.

## Routes

| Chemin | Composant | Garde | Description |
|--------|-----------|-------|-------------|
| `/` | `Navigate` | `UserAuth` | Redirige vers `/home` |
| `/home` | `Home` | `UserAuth` | Tableau de bord principal |
| `/discussions` | `Home` | `UserAuth` | Discussions (placeholder) |
| `/equipes` | `TeamsPage` | `UserAuth` | Gestion des équipes |
| `/drive` | `Home` | `UserAuth` | Drive (placeholder) |
| `/annuaire` | `Home` | `UserAuth` | Annuaire (placeholder) |
| `/admin` | `AdminPanel` | `UserAuth` + `AdminAuth` | Panneau d'administration |
| `/login` | `Login` | aucune | Page de connexion |
| `/signup` | `Signup` | aucune | Page d'inscription |

## Détails

L'ordre des fournisseurs est important : AuthProvider encapsule tout car ToastProvider et AuthToasts dépendent du contexte d'authentification. AuthToasts se situe en dehors de BrowserRouter en tant qu'overlay global non lié à une route.
