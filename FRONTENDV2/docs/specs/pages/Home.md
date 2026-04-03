# Home

**Source**: `FRONTENDV2/src/pages/Home/Home.tsx`

Page d'accueil authentifiée affichant un message de bienvenue avec le prénom de l'utilisateur, le composant `Dashboard` et une barre latérale de contacts avec une barre de recherche. Utilise framer-motion pour les animations d'entrée.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| — | — | — | Aucune prop (FC sans générique) |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| user | `User \| null` | `{ firstname: "John" }` | Depuis `useAuth()`, utilisé pour afficher le message de bienvenue |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| — | — | — | Aucune méthode handler définie |

## Détails

- L'en-tête de bienvenue s'anime avec un fondu + glissement vers le bas (y: -10 à 0, 0.3s).
- La barre latérale de contacts s'anime avec un fondu + glissement vers la gauche (x: 20 à 0, 0.5s, délai de 0.3s).
- `SearchBar` reçoit `dDownNeeded="false"` pour désactiver la liste déroulante.
- La section contacts est un placeholder statique ("Aucun contact") sans données dynamiques pour le moment.
- Route : protégée par la garde `UserAuth`.
