# Dashboard

**Source**: `FRONTENDV2/src/components/Dashboard/Dashboard.tsx`

Composant de tableau de bord statique affiché sur la page d'accueil. Affiche des cartes de résumé (messages non lus, appels manqués, contacts actifs), des boutons d'action rapide et une section d'activité récente. Toutes les valeurs sont actuellement des placeholders codés en dur (0 / vide).

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| *(aucun)* | — | — | FC sans état, aucune prop |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| *(aucun)* | — | — | Aucun état local |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| *(aucune)* | — | — | Aucune fonction handler |

## Détails

- Utilise `framer-motion` pour les animations de fondu + glissement vers le haut sur la section principale (sans délai) et la section d'activité récente (délai de 0.3s).
- Les cartes de résumé utilisent le composant `Card` de `design-system/components` avec des bordures colorées : bleu `#1E3664` (messages), ambre `#F59E0B` (appels), vert `#10B981` (contacts).
- Les actions rapides incluent 4 éléments : 2 boutons (Nouvelle discussion, Démarrer un appel) et 2 liens (`/files`, `/equipes`).
- Le conteneur d'actions rapides utilise un élément `nav`.
