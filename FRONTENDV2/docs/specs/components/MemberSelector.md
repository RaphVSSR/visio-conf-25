# Référence du composant MemberSelector — VisioConf

**Fichier source** : `FRONTENDV2/src/components/MemberSelector/MemberSelector.tsx`
**Styles** : `FRONTENDV2/src/components/MemberSelector/MemberSelector.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`MemberSelector` est un composant réutilisable pour la sélection de membres. Utilisé par `TeamForm` et `ChannelForm` pour gérer les membres d'une équipe ou d'un canal. Offre recherche, sélection individuelle et "tout sélectionner".

---

## 2. Props

```typescript
export interface MemberSelectorProps {
    members: Member[]
    onMemberToggle: (member: Member) => void
    onSelectAll?: () => void
    isLoading?: boolean
    searchPlaceholder?: string
    canManageMembers?: boolean
    currentUserId?: string
    selectedMembersTitle?: string
    availableMembersTitle?: string
    memberFilter?: (member: Member) => boolean
    showSelectedSection?: boolean
}

export interface Member {
    id: string
    userId?: string
    firstname: string
    lastname: string
    picture?: string
    role?: string
    isSelected: boolean
}
```

---

## 3. State local

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `searchTerm` | `string` | `""` | Terme de recherche |
| `filteredMembers` | `Member[]` | — | Membres filtrés par recherche |

---

## 4. Comportement

- **Recherche** : Filtrage en temps réel par prénom/nom (case-insensitive)
- **Deux sections** : Membres sélectionnés (en haut) et disponibles (en bas)
- **Tout sélectionner** : Toggle qui sélectionne/désélectionne tous les membres
- **Badge "You"** : Affiché pour l'utilisateur courant
- **Rôle** : Affiché optionnellement à côté du nom
- **Boutons** : Add (UserPlus) / Remove (UserMinus) selon l'état de sélection

---

## 5. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `TeamForm` | TeamForm rend MemberSelector | Composant parent (gestion membres équipe) |
| `ChannelForm` | ChannelForm rend MemberSelector | Composant parent (gestion membres canal) |
