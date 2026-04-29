# TeamForm

**Source**: `FRONTENDV2/src/components/TeamForm/TeamForm.tsx`

Composant de formulaire pour la création et l'édition d'équipes. Gère le nom de l'équipe, la description, le téléchargement d'image et la gestion des membres via `MemberSelector`. Communique avec le backend par messages socket (`team_action`, `team_member`, `user_get`).

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| onTeamCreated | `(team: any) => void` | — | Appelé en cas de création, mise à jour ou suppression réussie |
| onCancel | `() => void` | — | Appelé quand le bouton annuler ou fermer est cliqué |
| teamToEdit | `any \| undefined` | `{ id: "t1", name: "Dev", description: "..." }` | Quand fourni, bascule en mode édition |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| name | `string` | `""` | Valeur du champ de saisie du nom de l'équipe |
| description | `string` | `""` | Valeur du textarea de description de l'équipe |
| isLoading | `boolean` | `false` | État de chargement de soumission/action |
| error | `string` | `""` | Message d'erreur affiché dans le formulaire |
| members | `Member[]` | `[]` | Tous les utilisateurs disponibles en tant qu'objets Member |
| teamMembers | `any[]` | `[]` | Membres actuels de l'équipe (depuis la réponse team_member list) |
| isLoadingUsers | `boolean` | `false` | État de chargement pour la récupération de la liste des utilisateurs |
| isLoadingMembers | `boolean` | `false` | État de chargement pour la récupération des membres de l'équipe |
| isEditing | `boolean` | `false` | Indique si le formulaire est en mode édition |
| successMessage | `string` | `""` | Message de succès temporaire (effacé automatiquement après 3s) |
| isDeleting | `boolean` | `false` | État de chargement de l'opération de suppression |
| teamPicture | `string` | `""` | URL data base64 de l'image de l'équipe |
| picturePreview | `string` | `""` | URL de prévisualisation pour l'image nouvellement téléchargée |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| handleTeamActionResponse | data (`any`) | void | Callback socket pour `team_action_response` (création/mise à jour/suppression) |
| handleUserQueryResponse | data (`any`) | void | Callback socket pour `user_get_response`, remplit la liste des membres |
| handleTeamMemberResponse | data (`any`) | void | Callback socket pour `team_member_response` (list/add/remove) |
| loadUsers | — | void | Envoie `user_get` avec type "list" |
| loadTeamMembers | teamId (`string`) | void | Envoie `team_member` avec type "list" |
| handleSubmit | e (`FormEvent`) | void | Valide et envoie `team_action` création ou mise à jour |
| handleDeleteTeam | — | void | Envoie `team_action` avec type "delete" |
| handleCancel | — | void | Appelle la prop `onCancel` |
| handleAddMember | userId (`string`) | void | Envoie `team_member` avec type "add" (mode édition uniquement) |
| handleRemoveMember | userId (`string`) | void | Envoie `team_member` avec type "remove", bloque si dernier admin |
| handleMemberToggle | member (`Member`) | void | En mode édition : ajout/suppression via socket. En mode création : bascule la sélection locale |
| handleSelectAll | — | void | En mode édition : ajoute tous les membres non sélectionnés. En mode création : bascule tout |
| handleTeamPictureUpload | event (`ChangeEvent<HTMLInputElement>`) | void | Valide le type/taille du fichier (max 5Mo), lit en URL data base64 |
| handleRemoveTeamPicture | — | void | Efface l'état de l'image et réinitialise le champ fichier |

## Détails

- Utilise `useAuth()` pour `socket` et `user`.
- En mode création, au moins un membre doit être sélectionné avant soumission.
- En mode édition, l'ajout/suppression de membre déclenche des messages socket immédiats (pas groupés à la soumission).
- `canManageMembers` dérivé de : l'utilisateur est admin de l'équipe, l'utilisateur est créateur, ou le formulaire est en mode création.
- Le dernier admin ne peut pas se retirer lui-même d'une équipe.
- Validation de l'image : doit être de type image, max 5Mo.
- Les listeners socket sont enregistrés/désenregistrés dans le cleanup du useEffect.
- Export par défaut.

## Flux

Voir [team-flows.md](../../flows/team-flows.md)
