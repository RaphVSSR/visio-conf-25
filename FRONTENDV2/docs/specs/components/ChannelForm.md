# Référence du composant ChannelForm — VisioConf

**Fichier source** : `FRONTENDV2/src/components/ChannelForm/ChannelForm.tsx`
**Styles** : `FRONTENDV2/src/components/ChannelForm/ChannelForm.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`ChannelForm` est le formulaire de création et d'édition de canal au sein d'une équipe. Gère la visibilité (public/privé) et la sélection de membres pour les canaux privés.

---

## 2. Props

```typescript
interface ChannelFormProps {
    onChannelCreated: (channel: any) => void
    onCancel: () => void
    channelToEdit?: any
    team: Team
}
```

---

## 3. State local

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | `""` / channelToEdit.name | Nom du canal |
| `isPublic` | `boolean` | `true` / channelToEdit.isPublic | Visibilité du canal |
| `isLoading` | `boolean` | `false` | État de soumission |
| `error` | `string` | `""` | Message d'erreur |
| `members` | `Member[]` | `[]` | Membres sélectionnables |
| `isEditing` | `boolean` | — | Mode création ou édition |
| `isLoadingMembers` | `boolean` | `true` | Chargement des membres |
| `isDeleting` | `boolean` | `false` | État de suppression |

---

## 4. Comportement clé

- **Canal public** : Pas de sélection de membres (tous les membres de l'équipe sont ajoutés automatiquement)
- **Canal privé** : Affiche le `MemberSelector`, au moins 1 membre requis
- **Édition** : Charge les membres actuels du canal et les pré-sélectionne
- **Validation** : Nom requis, membres requis si privé

---

## 6. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `MemberSelector` | `components/` | Sélection des membres (canaux privés) |
| `Button` | `design-system/` | Actions du formulaire |

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `TeamsPage` | TeamsPage rend ChannelForm | Composant parent |
| `MemberSelector` | ChannelForm rend MemberSelector | Sous-composant de sélection |
| `useAuth` | ChannelForm utilise useAuth() | Controleur et userId |
