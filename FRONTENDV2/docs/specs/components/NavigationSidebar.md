# NavigationSidebar

**Source**: `FRONTENDV2/src/components/NavigationSidebar/NavigationSidebar.tsx`

Barre latérale principale de l'application avec navigation repliable. S'agrandit au survol de la souris, se replie quand la souris quitte la zone. Filtre les éléments de navigation par rôles utilisateur et affiche un logo de marque, des liens de navigation, les informations utilisateur et un bouton de déconnexion.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| items | `NavigationItem[]` | `[{ label: "Equipes", path: "/equipes", icon: "Users" }]` | Éléments de navigation à afficher |
| logoSource | `string` | `"/logos/logo_univ_grand.svg"` | Chemin vers l'image du logo de marque |
| logoAltText | `string` | `"Logo Université de Toulon"` | Texte alternatif pour le logo |
| brandLabel | `string` | `"Université de Toulon"` | Label texte affiché à côté du logo quand la barre est agrandie |
| userData | `SidebarUserData` | `{ firstname: "John", lastname: "Doe", roles: ["admin"] }` | Informations de l'utilisateur courant pour l'avatar et le filtrage par rôle |
| onLogout | `() => void` | — | Appelé quand le bouton de déconnexion est cliqué |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| expanded | `boolean` | `false` | Indique si la barre latérale est en état agrandi |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| *(aucune)* | — | — | Aucune fonction handler nommée, handlers inline uniquement |

## Détails

- Exporte l'interface `NavigationItem` : `{ label: string, path: string, icon: keyof typeof icons, requiresRole?: string }`.
- Exporte l'interface `SidebarUserData` : `{ firstname: string, lastname: string, roles: string[] }`.
- Exporte la constante `NAVIGATION_ITEMS` avec 5 entrées : Discussions, Équipes, Drive, Annuaire, Admin (admin uniquement).
- Exporte la constante `SIDEBAR_BRAND` avec les valeurs par défaut de logo/alt/label.
- Les éléments avec `requiresRole` sont masqués sauf si `userData.roles` inclut ce rôle.
- Utilise `NavLink` de react-router-dom avec la classe `navItemActive` pour la route active.
- L'avatar utilisateur affiche les initiales (premier caractère de firstname + lastname).
- Utilise `framer-motion` pour l'animation initiale de glissement (`x: -20 -> 0`).
- Utilise `LucideIcons` de `design-system/components` pour le rendu dynamique des icônes.
