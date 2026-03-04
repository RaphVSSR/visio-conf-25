# Référence du Modèle Role — VisioConf

**Fichier source** : `BACKEND/src/models/Role.ts`
**Classe parente** : `Collection` (abstract)
**Collection MongoDB** : `Role`

---

## 1. Schema complet

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('67a1...')` |
| `uuid` | `String` | oui | — | — | Identifiant unique du rôle | `"admin"` |
| `label` | `String` | oui | — | — | Nom du rôle | `"Administrateur"` |
| `permissions` | `ObjectId[]` | non | `[]` | `Permission` | Liste des permissions associées | `[ObjectId('aaa...'), ObjectId('bbb...')]` |
| `default` | `Boolean` | oui | `false` | — | Indique si le rôle est par défaut | `true` |

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<RoleType>` | `protected static` | Schéma Mongoose de la collection |
| `model` | `Model<RoleType>` | `static` | Modèle Mongoose (singleton via `mongoose.models`) |
| `modelInstance` | `Document<RoleType>` | `public` | Instance du document Mongoose pour les opérations d'écriture |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description |
|-----|------|--------|-------------|
| `models` | `object` | `mongoose.models` | Cache des modèles Mongoose enregistrés |
| `VERBOSE` | `env` | `process.env.VERBOSE` | Active les logs d'injection |
| `VERBOSE_LVL` | `env` | `process.env.VERBOSE_LVL` | Niveau de verbosité (3 = détaillé) |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: RoleType` | `Role` | instance | Crée une instance avec un nouveau document Mongoose |
| `save` | — | `Promise<void>` | instance | Sauvegarde le `modelInstance` en base de données |
| `inject` | — | `Promise<void>` | static | **[DEV+PROD]** Injecte les rôles par défaut (Administrateur + Utilisateur). Nécessaire au premier démarrage en production aussi (seeding initial). Requiert que les permissions soient déjà injectées |
| `getRole` | `label: string` | `Promise<Document \| null>` | static | Trouve un rôle par son label |
| `getRoles` | `labels: string[]` | `Promise<Document[]>` | static | Trouve plusieurs rôles par leurs labels |
| `updateRole` | `label: string, newData: Partial<RoleType>` | `Promise<UpdateResult>` | static | Met à jour un rôle (note: filtre par `email` — bug potentiel) |
| `updateRoles` | `labels: string[], newData: Partial<RoleType>` | `Promise<UpdateResult>` | static | Met à jour plusieurs rôles (note: filtre par `email` — bug potentiel) |
| `deleteRole` | `label: string` | `Promise<DeleteResult>` | static | Supprime un rôle par son label |
| `deleteRoles` | `labels: string[]` | `Promise<DeleteResult>` | static | Supprime plusieurs rôles par leurs labels |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime tous les rôles |

---

## 5. Catalogue des messages associés

### Client → Serveur (5 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `roles_list_request` | `{}` | Demande la liste de tous les rôles |
| `one_role_request` | `{ roleId: string }` | Demande les détails d'un rôle |
| `create_role_request` | `{ data: RoleType }` | Création d'un nouveau rôle |
| `update_role_request` | `{ roleId: string, data: Partial<RoleType> }` | Mise à jour d'un rôle |
| `delete_role_request` | `{ roleId: string }` | Suppression d'un rôle |

### Serveur → Client (5 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `roles_list_response` | `{ roles: Role[] }` | Réponse avec la liste des rôles |
| `one_role_response` | `{ role: Role }` | Réponse avec les détails du rôle |
| `created_role` | `{ role: Role }` | Confirmation de création |
| `role_already_exists` | `{ reason: string }` | Le rôle existe déjà |
| `updated_role` | `{ role: Role }` | Confirmation de mise à jour |
| `deleted_role` | `{ roleId: string }` | Confirmation de suppression |

**Total : 5 client→serveur + 6 serveur→client = 11 messages**

---

## 6. Types TypeScript

```typescript
type RoleType = {
    uuid: string,
    label: string,
    permissions?: Types.ObjectId[],
    default: boolean,
}
```

---

## 7. Relations avec autres modèles

| Modèle | Relation | Description |
|--------|----------|-------------|
| `Permission` | Role.permissions[] → Permission | Chaque rôle référence un tableau de permissions |
| `User` | Role ← User.roles[] | Les utilisateurs référencent des rôles via un tableau d'ObjectId |

---

## 8. Index et contraintes

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |

Aucun index personnalisé défini.

---

## Rôles injectés par défaut (inject)

| uuid | label | permissions | default |
|------|-------|-------------|---------|
| `admin` | Administrateur | Toutes les permissions existantes | `true` |
| `user` | Utilisateur | Uniquement les permissions avec `default: true` | `true` |

L'injection vérifie que la collection Permission est non vide avant de créer les rôles.

---

## 9. Exemples

### Créer et sauvegarder un rôle

```typescript
const role = new Role({
    uuid: "moderator",
    label: "Modérateur",
    permissions: [permId1, permId2],
    default: false,
});
await role.save();
```

### Requêter un rôle

```typescript
const admin = await Role.getRole("Administrateur");
// → { uuid: "admin", label: "Administrateur", permissions: [ObjectId(...), ...], default: true }
```

### Document MongoDB

```json
{
    "_id": "ObjectId('67a1...')",
    "uuid": "admin",
    "label": "Administrateur",
    "permissions": ["ObjectId('aaa...')", "ObjectId('bbb...')"],
    "default": true
}
```

### Message Socket.io — créer un rôle

```typescript
// Client
{ id: socketId, create_role_request: { data: { uuid: "mod", label: "Modérateur", permissions: [...], default: false } } }

// Serveur (succès)
{ id: socketId, created_role: { role: { uuid: "mod", label: "Modérateur", ... } } }

// Serveur (échec)
{ id: socketId, role_already_exists: { reason: "Le rôle existe déjà" } }
```
