# Référence du Modèle Team — VisioConf

**Fichiers sources** : `BACKEND/src/models/Team.ts` + `BACKEND/src/models/TeamMember.ts`
**Classe parente** : `Collection` (abstract) — les deux classes
**Collections MongoDB** : `Team`, `TeamMember`

---

## 1. Schema complet

### Team

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('67a1...')` |
| `name` | `String` | oui | — | — | Nom de l'équipe | `"Département MMI"` |
| `description` | `String` | non | `""` | — | Description de l'équipe | `"Équipe pédagogique"` |
| `picture` | `String` | non | `null` | — | Filename of the team picture stored | `null` |
| `createdBy` | `ObjectId` | oui | — | `User` | Créateur de l'équipe | `ObjectId('u1...')` |
| `createdAt` | `Date` | non | `Date.now` | — | Date de création | `2026-03-01T10:00:00Z` |
| `updatedAt` | `Date` | non | `Date.now` | — | Date de dernière modification | `2026-03-01T10:00:00Z` |
| `members` | `ObjectId[]` | non | `[]` | `Teammember` | Liste des membres de l'équipe | `[ObjectId('m1...')]` |

### TeamMember

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('m1...')` |
| `id` | `ObjectId` | oui | — | `User` | Référence vers l'utilisateur | `ObjectId('u1...')` |
| `role` | `String` | non | `"member"` | — | Rôle dans l'équipe. Enum: `"admin"`, `"member"` | `"admin"` |
| `joinedAt` | `Date` | non | `Date.now` | — | Date d'arrivée dans l'équipe | `2026-03-01T10:00:00Z` |
| `teamId` | `ObjectId` | oui | — | `Team` | Référence vers l'équipe | `ObjectId('67a1...')` |

---

## 2. Propriétés de la classe

### Team

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<TeamType>` | `protected static` | Schéma Mongoose |
| `model` | `Model<TeamType>` | `static` | Modèle Mongoose |
| `modelInstance` | `Document<TeamType>` | `public` | Instance du document |

### TeamMember

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<TeamMemberType>` | `static` | Schéma Mongoose (note: pas `protected`) |
| `model` | `Model<TeamMemberType>` | `static` | Modèle Mongoose |
| `modelInstance` | `Document<TeamMemberType>` | `public` | Instance du document |
| `areIndexesInitialized` | `void` | `private static` | IIFE qui initialise les index au chargement de la classe |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description |
|-----|------|--------|-------------|
| `models` | `object` | `mongoose.models` | Cache des modèles Mongoose enregistrés |
| `VERBOSE` | `env` | `process.env.VERBOSE` | Active les logs d'injection |
| `VERBOSE_LVL` | `env` | `process.env.VERBOSE_LVL` | Niveau de verbosité (3 = détaillé) |

---

## 4. Méthodes

### Team

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: TeamType` | `Team` | instance | Crée une instance avec un nouveau document Mongoose |
| `save` | — | `Promise<void>` | instance | Sauvegarde le `modelInstance` en base de données |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime toutes les équipes |
| `injectTest` | — | `Promise<void>` | static | **[DEV]** Injecte 3 équipes de test avec leurs membres (Département MMI, Projet Web Avancé, Administration). En production, les équipes sont créées via `team_create_request` |

### TeamMember

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: TeamMemberType` | `TeamMember` | instance | Crée une instance avec un nouveau document Mongoose |
| `save` | — | `Promise<void>` | instance | Sauvegarde le `modelInstance` en base de données |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime tous les membres d'équipe |

---

## 5. Catalogue des messages associés

### Client → Serveur (8 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `teams_list_request` | `{}` | Demande les équipes de l'utilisateur courant |
| `all_teams_request` | `{}` | Demande toutes les équipes (admin) |
| `team_create_request` | `{ name: string, description?: string }` | Création d'une nouvelle équipe |
| `team_update_request` | `{ teamId: string, data: Partial<TeamType> }` | Mise à jour d'une équipe |
| `team_delete_request` | `{ teamId: string }` | Suppression d'une équipe |
| `team_leave_request` | `{ teamId: string }` | Quitter une équipe |
| `team_members_request` | `{ teamId: string }` | Demande la liste des membres d'une équipe |
| `team_add_member_request` | `{ teamId: string, userId: string }` | Ajouter un membre à une équipe |
| `team_remove_member_request` | `{ teamId: string, userId: string }` | Retirer un membre d'une équipe |

### Serveur → Client (8 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `teams_list_response` | `{ teams: Team[] }` | Réponse avec les équipes de l'utilisateur |
| `all_teams_response` | `{ teams: Team[] }` | Réponse avec toutes les équipes |
| `team_create_response` | `{ team: Team }` | Confirmation de création |
| `team_update_response` | `{ team: Team }` | Confirmation de mise à jour |
| `team_delete_response` | `{ success: boolean }` | Confirmation de suppression |
| `team_leave_response` | `{ success: boolean }` | Confirmation de départ |
| `team_members_response` | `{ members: TeamMember[] }` | Réponse avec les membres |
| `team_add_member_response` | `{ member: TeamMember }` | Confirmation d'ajout d'un membre |
| `team_remove_member_response` | `{ success: boolean }` | Confirmation de retrait d'un membre |

**Total : 9 client→serveur + 9 serveur→client = 18 messages**

---

## 6. Types TypeScript

```typescript
type TeamType = {
    name: string,
    description?: string,
    picture?: string,
    createdBy: Types.ObjectId,
    createdAt?: Date,
    updatedAt?: Date,
    members?: Types.ObjectId[],
}

type TeamMemberType = {
    id: Types.ObjectId,
    role?: string,
    joinedAt?: Date,
    teamId: Types.ObjectId,
}
```

---

## 7. Relations avec autres modèles

| Modèle | Relation | Description |
|--------|----------|-------------|
| `User` | Team.createdBy → User | Le créateur de l'équipe |
| `User` | TeamMember.id → User | L'utilisateur membre |
| `TeamMember` | Team.members[] → TeamMember | Liste des membres de l'équipe |
| `Team` | TeamMember.teamId → Team | L'équipe du membre |
| `Channel` | Channel.teamId → Team (implicite) | Les canaux sont liés à une équipe |

---

## 8. Index et contraintes

### Team

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |

### TeamMember

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |
| `teamId_id` | `{ teamId: 1, id: 1 }` | unique | Empêche les doublons de membres dans une même équipe |

---

## 9. Exemples

### Créer une équipe avec un membre

```typescript
const team = new Team({
    name: "Projet Web",
    description: "Équipe du projet web avancé",
    createdBy: userId,
});
await team.save();

const member = new TeamMember({
    id: userId,
    role: "admin",
    teamId: team.modelInstance._id,
});
await member.save();
```

### Documents MongoDB

```json
// Team
{
    "_id": "ObjectId('67a1...')",
    "name": "Projet Web",
    "description": "Équipe du projet web avancé",
    "createdBy": "ObjectId('abc...')",
    "members": ["ObjectId('def...')"],
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-03-01T10:00:00.000Z"
}

// TeamMember
{
    "_id": "ObjectId('def...')",
    "id": "ObjectId('abc...')",
    "role": "admin",
    "teamId": "ObjectId('67a1...')",
    "joinedAt": "2026-03-01T10:00:00.000Z"
}
```

### Message Socket.io — créer une équipe

```typescript
// Client
{ id: socketId, team_create_request: { name: "Projet Web", description: "Mon équipe" } }

// Serveur
{ id: socketId, team_create_response: { team: { name: "Projet Web", members: [...], ... } } }
```
