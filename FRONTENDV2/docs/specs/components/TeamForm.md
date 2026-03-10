# Référence du composant TeamForm — VisioConf

**Fichier source** : `FRONTENDV2/src/components/TeamForm/TeamForm.tsx`
**Styles** : `FRONTENDV2/src/components/TeamForm/TeamForm.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`TeamForm` est le formulaire de création et d'édition d'équipe. Gère l'upload d'image, la sélection de membres, et la suppression. En mode édition, l'ajout/retrait de membres est immédiat (via socket) au lieu d'être groupé à la soumission.

---

## 2. Props

```typescript
interface TeamFormProps {
    onTeamCreated: (team: any) => void
    onCancel: () => void
    teamToEdit?: any
}
```

---

## 3. State local

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | `""` / teamToEdit.name | Nom de l'équipe |
| `description` | `string` | `""` / teamToEdit.description | Description |
| `isLoading` | `boolean` | `false` | État de chargement de la soumission |
| `error` | `string` | `""` | Message d'erreur |
| `members` | `Member[]` | `[]` | Membres disponibles/sélectionnés |
| `teamMembers` | `any[]` | `[]` | Membres actuels de l'équipe (mode édition) |
| `isLoadingUsers` | `boolean` | `true` | Chargement de la liste des utilisateurs |
| `isLoadingMembers` | `boolean` | `false` | Chargement des membres de l'équipe |
| `isEditing` | `boolean` | — | Mode création ou édition |
| `successMessage` | `string` | `""` | Message de succès temporaire |
| `isDeleting` | `boolean` | `false` | État de suppression |
| `teamPicture` | `string` | `""` | Image base64 |
| `picturePreview` | `string` | `""` | Prévisualisation de l'image |

---

## 4. Comportement clé

- **Upload image** : Validation taille max 5MB, conversion base64, prévisualisation
- **Mode édition** : Ajout/retrait de membres envoyé immédiatement via socket (pas groupé)
- **Vérification admin** : Empêche le retrait du dernier admin
- **Validation** : Nom d'équipe requis

---

## 6. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `MemberSelector` | `components/` | Sélection des membres de l'équipe |
| `Button` | `design-system/` | Actions (soumettre, annuler, supprimer) |
| `LucideIcons` | `design-system/` | Icônes du formulaire |

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `TeamsPage` | TeamsPage rend TeamForm | Composant parent |
| `MemberSelector` | TeamForm rend MemberSelector | Sous-composant de sélection |
| `useAuth` | TeamForm utilise useAuth() | Controleur et userId |
