# SearchBar

**Source**: `FRONTENDV2/src/design-system/components/SearchBar/SearchBar.tsx`

Champ de recherche générique avec une icône `Search` de lucide-react. Supporte deux modes via union discriminée : avec une liste déroulante de suggestions typée, ou sans. Le composant est générique sur le type d'élément de la liste de suggestions. Étend les attributs HTML div.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `placeholder` | `string` | `"Search..."` | Texte placeholder du champ de saisie |
| `dDownNeeded` | `"true" \| "false"` | `"false"` | Active la liste déroulante de suggestions. Chaîne, pas booléen |
| `suggestingList` | `suggestingType[]` | `[user1, user2]` | Liste de suggestions typée. Requise quand `dDownNeeded` est `"true"` |
| `...props` | `HTMLAttributes<HTMLDivElement>` | `className="x"` | Attributs HTML appliqués en spread sur le div conteneur |

## Détails

Utilise des chaînes `"true"/"false"` pour `dDownNeeded` au lieu de booléens pour la discrimination d'union. Le conteneur de la liste déroulante de suggestions est rendu quand `dDownNeeded` est `"true"` mais son contenu n'est pas encore implémenté (TODO).
