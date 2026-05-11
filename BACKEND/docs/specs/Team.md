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

Pattern consolidé : 3 messages C→S (`team_get`, `team_action`, `team_member`) avec champ `type` discriminant — 3 réponses S→C (`team_get_response`, `team_action_response`, `team_member_response`) avec `type` (opération) + `etat` (`true`/`false`) + `error?` en cas d'échec.

Service : `BACKEND/src/models/services/TeamService.ts`. Domaine déclaré dans `ListeMessages.ts` sous la clé `team`.

### Client → Serveur

| Message | `type` | Payload | Handler | Description |
|---------|--------|---------|---------|-------------|
| `team_get` | `list` | `{}` | `getTeamsList` | Équipes dont l'utilisateur courant est membre |
| `team_get` | `all` | `{}` | `getAllTeams` | Toutes les équipes (admin panel) — inclut `memberCount` |
| `team_action` | `create` | `{ name, description?, picture?, members: string[] }` | `createTeam` | Crée l'équipe + un membre admin (créateur) + N membres |
| `team_action` | `update` | `{ teamId, name?, description?, picture? }` | `updateTeam` | Admin/createur uniquement |
| `team_action` | `delete` | `{ teamId }` | `deleteTeam` | Cascade : channels, posts, responses, members. Admin uniquement |
| `team_action` | `leave` | `{ teamId }` | `leaveTeam` | Bloqué si dernier admin (`last_admin_cannot_leave`) |
| `team_member` | `list` | `{ teamId }` | `getTeamMembers` | Membres populés avec `firstname/lastname/email/picture` |
| `team_member` | `add` | `{ teamId, userId }` | `addTeamMember` | Admin uniquement |
| `team_member` | `remove` | `{ teamId, userId }` | `removeTeamMember` | Admin uniquement, bloqué si cible admin (`cannot_remove_admin`) |

### Serveur → Client

| Message | `type` | Payload (succès) | Payload (échec) | Diffusion |
|---------|--------|------------------|-----------------|-----------|
| `team_get_response` | `list` | `{ etat: true, teams: FormattedTeam[] }` | `{ etat: false, error }` | demandeur |
| `team_get_response` | `all` | `{ etat: true, teams: FormattedTeam[] }` (avec `memberCount`) | `{ etat: false, error }` | demandeur |
| `team_action_response` | `create` | `{ etat: true, team: FormattedTeam }` | `{ etat: false, error }` | tous les membres de l'équipe |
| `team_action_response` | `update` | `{ etat: true, team: FormattedTeam }` | `{ etat: false, error }` | tous les membres |
| `team_action_response` | `delete` | `{ etat: true, teamId }` | `{ etat: false, error }` | tous les membres au moment de la suppression |
| `team_action_response` | `leave` | `{ etat: true, teamId, userId }` | `{ etat: false, error }` | membres restants + sockets de l'utilisateur partant |
| `team_member_response` | `list` | `{ etat: true, teamId, members: FormattedMember[] }` | `{ etat: false, error }` | demandeur |
| `team_member_response` | `add` | `{ etat: true, teamId, userId }` | `{ etat: false, error }` | tous les membres |
| `team_member_response` | `remove` | `{ etat: true, teamId, userId }` | `{ etat: false, error }` | membres restants + sockets de la cible |

### Codes d'erreur

`not_authenticated`, `team_not_found`, `not_a_member`, `already_a_member`, `admin_required`, `cannot_remove_admin`, `last_admin_cannot_leave`.

### Formats normalisés

```ts
type FormattedTeam = {
    id: string,
    name: string,
    description?: string,
    picture?: string,
    createdBy: string,
    createdAt: Date,
    updatedAt: Date,
    role?: "admin" | "member",
    memberCount?: number,
}

type FormattedMember = {
    id: string,
    userId: string,
    firstname?: string,
    lastname?: string,
    picture?: string,
    role: "admin" | "member",
    joinedAt: Date,
}
```

**Total : 3 messages C→S × 9 dispatches + 3 messages S→C × 9 dispatches**

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
{ id: socketId, team_action: { type: "create", name: "Projet Web", description: "Mon équipe", members: ["u2", "u3"] } }

// Serveur (broadcast à tous les membres)
{ id: [s1, s2, s3], team_action_response: { type: "create", etat: true, team: { id, name, role: "admin", ... } } }
```
