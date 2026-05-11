# Référence du composant TeamForm — VisioConf

**Fichier source** : `FRONTENDV2/src/components/TeamForm/TeamForm.tsx`
**Styles** : `FRONTENDV2/src/components/TeamForm/TeamForm.scss`
**Type** : Composant React fonctionnel (FC) — formulaire overlay

---

## 1. Description

Formulaire de création / édition d'une équipe. En mode création, l'utilisateur saisit nom, description, photo (upload local en data-URL), et sélectionne au moins un membre. En mode édition, les modifications de membres sont émises directement (`team_member` add/remove) et la suppression de l'équipe est possible.

---

## 2. Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onTeamCreated` | `(team: any) => void` | oui | Callback succès (création / mise à jour / suppression) |
| `onCancel` | `() => void` | oui | Ferme l'overlay |
| `teamToEdit` | `any` | non | Équipe à éditer ; absent ⇒ mode création |
| `forceAllowManage` | `boolean` | non | Force l'autorisation de gestion membres (cas admin global) ; défaut `false` |

---

## 3. State

| State | Type | Description |
|-------|------|-------------|
| `name` | `string` | Nom |
| `description` | `string` | Description |
| `isLoading` | `boolean` | Submit en cours |
| `error` | `string` | Message d'erreur visible |
| `members` | `Member[]` | Liste utilisateurs avec flag `isSelected` |
| `teamMembers` | `any[]` | Membres actuels (mode édition) |
| `isLoadingUsers` | `boolean` | Attente `user_get_response` `list` |
| `isLoadingMembers` | `boolean` | Attente `team_member_response` `list` |
| `isEditing` | `boolean` | Mode édition |
| `successMessage` | `string` | Toast inline |
| `isDeleting` | `boolean` | Suppression en cours |
| `teamPicture` | `string` | Data-URL ou URL stockée |
| `picturePreview` | `string` | Aperçu local avant submit |

Refs sur `onTeamCreated`, `teamToEdit`, `userId`, `socket` — pour stabilité dans les listeners.

---

## 4. Méthodes

| Méthode | Paramètres | Description |
|---------|------------|-------------|
| `loadUsers` | — | Émet `user_get` `{ type: "list" }` |
| `loadTeamMembers` | `teamId: string` | Émet `team_member` `{ type: "list", teamId }` |
| `handleSubmit` | `e: FormEvent` | Émet `team_action` `create` ou `update` |
| `handleDeleteTeam` | — | Émet `team_action` `{ type: "delete", teamId }` |
| `handleAddMember` | `userId: string` | Émet `team_member` `{ type: "add", teamId, userId }` |
| `handleRemoveMember` | `userId: string` | Émet `team_member` `{ type: "remove", teamId, userId }` ; bloque si dernier admin |
| `handleMemberToggle` | `member: Member` | En édition → add/remove direct ; en création → toggle local |
| `handleSelectAll` | — | Toggle global ; en édition envoie un `add` par utilisateur non sélectionné |
| `handleTeamPictureUpload` | `event: ChangeEvent<HTMLInputElement>` | Vérifie type/poids (≤ 5 MB), génère data-URL via `FileReader` |
| `handleRemoveTeamPicture` | — | Reset photo + reset input file |
| `handleCancel` | — | Appelle `onCancel` |

---

## 5. Messages — émis

| Message | Variants | Contexte |
|---------|----------|----------|
| `user_get` | `list` | Charge la liste utilisateurs sélectionnables |
| `team_member` | `list` / `add` / `remove` | Édition uniquement |
| `team_action` | `create` / `update` / `delete` | Submit ou suppression |

## 6. Messages — écoutés

| Message | Comportement |
|---------|--------------|
| `team_action_response` | Dispatch sur `data.type` (`create`/`update` ⇒ `onTeamCreated(team)` ; `delete` ⇒ `onTeamCreated({ ...edit, deleted: true })`) |
| `user_get_response` `list` | Convertit users → `Member[]` (filtre l'utilisateur courant) |
| `team_member_response` | `list` ⇒ marque `isSelected` selon membres actuels ; `add`/`remove` ⇒ recharge la liste membres + toast |

---

## 7. Sélecteurs

| Nom | Calcul | Description |
|-----|--------|-------------|
| `isUserAdmin` | `teamMembers.some(m => m.userId === user._id && m.role === "admin")` | Admin de l'équipe |
| `isCreator` | `teamToEdit?.createdBy === user._id` | Créateur |
| `canManageMembers` | `forceAllowManage \|\| isUserAdmin \|\| isCreator \|\| !isEditing` | Affiche les contrôles |

---

## 8. Validation

- Nom requis (trim).
- Mode création : au moins un membre sélectionné.
- Photo : type `image/*`, taille ≤ 5 MB.
- Suppression de soi-même bloquée si dernier admin (test côté UI ; le serveur applique la même règle).

---

## 9. Composants utilisés

| Composant | Rôle |
|-----------|------|
| `MemberSelector` | Sélection multi-utilisateurs (recherche + sections sélectionnés/disponibles) |
