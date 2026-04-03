# AdminTabPanel

**Source**: `FRONTENDV2/src/components/AdminTabPanel/AdminTabPanel.tsx`

Panneau de détail d'administration qui affiche l'en-tête (icône, titre, bouton fermer) et la liste des sous-options pour un onglet d'administration sélectionné. Retourne null si aucun onglet correspondant n'est trouvé dans les données internes.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| tabSelected | `string` | `"Utilisateurs"` | Nom de l'onglet actuellement sélectionné |
| setTabSelected | `Dispatch<SetStateAction<string \| null>>` | `setTabSelected(null)` | Setter pour changer ou fermer l'onglet sélectionné (null ferme) |

## State

Aucun useState ou hook de contexte utilisé.

## Méthodes

Aucune méthode handler définie (flèche inline sur le bouton fermer appelle `setTabSelected(null)`).

## Détails

- Le tableau interne `tabsData` définit 4 onglets : Utilisateurs (UsersRound), Rôles (Drama), Permissions (ListChecks), Équipes (MessagesSquare)
- Chaque onglet a une liste statique de labels de sous-options rendus en éléments `<li>`
- Le type exporté `AdminTabType` inclut une `condition: boolean` sur les sous-options mais elle n'est pas utilisée dans l'implémentation actuelle du composant
- Utilise des éléments sémantiques `<section>` pour la mise en page
