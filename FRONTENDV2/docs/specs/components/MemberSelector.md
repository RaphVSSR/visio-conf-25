# MemberSelector

**Source**: `FRONTENDV2/src/components/MemberSelector/MemberSelector.tsx`

Composant réutilisable de sélection de membres avec recherche, basculement tout sélectionner, et affichage séparé entre les membres sélectionnés et disponibles. Utilisé dans TeamForm pour gérer l'appartenance à l'équipe.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| members | `Member[]` | `[{ id: "1", firstname: "John", lastname: "Doe", isSelected: false }]` | Liste complète des membres à afficher |
| onMemberToggle | `(member: Member) => void` | — | Appelé quand un membre est ajouté ou retiré |
| onSelectAll | `(() => void) \| undefined` | — | Appelé quand le bouton tout sélectionner est cliqué |
| isLoading | `boolean` | `false` | Affiche un état de chargement au lieu de la liste des membres disponibles |
| searchPlaceholder | `string` | `"Rechercher des utilisateurs..."` | Texte placeholder pour le champ de recherche |
| canManageMembers | `boolean` | `true` | Contrôle si les boutons de suppression apparaissent sur les membres sélectionnés |
| currentUserId | `string \| undefined` | `"abc123"` | Utilisé pour afficher le badge "Vous" et empêcher l'auto-suppression |
| selectedMembersTitle | `string \| undefined` | `"Membres actuels (3)"` | Titre personnalisé pour la section des sélectionnés |
| availableMembersTitle | `string \| undefined` | `"Ajouter des membres"` | Titre personnalisé pour la section des disponibles |
| memberFilter | `((member: Member) => boolean) \| undefined` | — | Filtre supplémentaire appliqué après la recherche |
| showSelectedSection | `boolean` | `true` | Indique si la section des membres sélectionnés doit être rendue |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| searchTerm | `string` | `""` | Valeur courante du champ de recherche |
| filteredMembers | `Member[]` | `[]` | Membres filtrés par le terme de recherche et memberFilter |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| renderMemberAvatar | member (`Member`) | JSX | Affiche l'image avatar ou les initiales en repli |
| renderMemberInfo | member (`Member`), showRole (`boolean`) | JSX | Affiche le nom, le badge "Vous" et le label de rôle optionnel |

## Détails

- Interface `Member` : `{ id: string, userId?: string, firstname: string, lastname: string, picture?: string, role?: string, isSelected: boolean }`.
- La recherche filtre par `firstname + lastname` sans sensibilité à la casse, puis applique le `memberFilter` optionnel.
- Les membres sélectionnés ne peuvent pas se retirer eux-mêmes (vérifie `member.id` et `member.userId` contre `currentUserId`).
- Le bouton tout sélectionner bascule entre "Sélectionner tout" / "Désélectionner tout" selon `areAllAvailableSelected`.
- Export par défaut (pas d'export nommé).
