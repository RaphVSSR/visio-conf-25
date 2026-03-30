# Role

**Source**: `BACKEND/src/models/Role.ts`

Représente un rôle utilisateur regroupant des permissions. Les rôles sont référencés par leur chaîne uuid dans les documents User. Étend Collection.

## Schema

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| uuid | String (required) | `"admin"` | Identifiant unique du rôle |
| label | String (required) | `"Administrateur"` | Nom lisible du rôle |
| permissions | ObjectId[] (ref: Permission) | `[ObjectId("...")]` | Tableau de références aux documents Permission |
| default | Boolean (required) | `false` | Si ce rôle est un rôle système par défaut (défaut : false) |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| constructor | dataToConstruct (RoleType) | Role | Crée une nouvelle instance Role |
| save | -- | Promise\<void\> | Persiste l'instance, lance TracedError en cas d'échec |
| inject (static) | -- | Promise\<void\> | Injecte les rôles par défaut : "admin" (toutes les permissions) et "user" (permissions par défaut uniquement) |
| getRole (static) | label (string) | Promise | Trouve un rôle par label |
| getRoles (static) | labels (string[]) | Promise | Trouve les rôles correspondant aux labels fournis |
| updateRole (static) | label (string), newData (Partial\<RoleType\>) | Promise | Met à jour un rôle par label |
| updateRoles (static) | labels (string[]), newData (Partial\<RoleType\>) | Promise | Met à jour plusieurs rôles par labels |
| deleteRole (static) | label (string) | Promise | Supprime un rôle par label |
| deleteRoles (static) | labels (string[]) | Promise | Supprime plusieurs rôles par labels |
| flushAll (static) | -- | Promise | Supprime tous les documents Role |

## Détails

- RoleType exporté pour usage externe
- inject nécessite que la collection Permission soit peuplée au préalable (lance une erreur si vide)
- Le rôle Admin reçoit toutes les permissions ; le rôle User ne reçoit que les permissions où default=true
- inject est idempotent : ignore les rôles existants par label
