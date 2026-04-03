# AdminPanel

**Source**: `FRONTENDV2/src/pages/AdminPanel/AdminPanel.tsx`

Page de tableau de bord d'administration affichant des cartes d'information (utilisateurs connectés, appels en cours) et une navigation par onglets (Utilisateurs, Rôles, Permissions, Équipes). La sélection d'un onglet affiche le composant `AdminTabPanel` à la place de la vue principale. Les valeurs d'information sont actuellement codées en dur.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| — | — | — | Aucune prop (FC sans générique) |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| tabSelected | `string \| null` | `"Utilisateurs"` | Nom de l'onglet actuellement sélectionné, `null` affiche la vue principale du tableau de bord |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| tabs[n].click | — | `void` | Définit `tabSelected` au nom de l'onglet correspondant |

## Détails

- Quand `tabSelected` est non-null, affiche `<AdminTabPanel tabSelected={tabSelected} setTabSelected={setTabSelected} />` en remplacement de toute la vue principale.
- Les définitions d'onglets sont un tableau local avec `name`, `icon` (composant Lucide), `modifier` (suffixe de classe CSS), et handler `click`.
- Route : `/admin` avec double garde (UserAuth + AdminAuth).
