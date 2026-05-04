# Référence du Modèle User — VisioConf

**Fichier source** : `BACKEND/src/models/User.ts`
**Classe parente** : Aucune (classe autonome, n'étend pas Collection)
**Collection MongoDB** : `User`

---

## 1. Schema complet

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('67a1...')` |
| `socket_id` | `String` | non | `"none"` | — | ID du socket connecté | `"xK9_2mZqR..."` |
| `firstname` | `String` | oui | — | — | Prénom | `"John"` |
| `lastname` | `String` | oui | — | — | Nom de famille | `"Doe"` |
| `email` | `String` | oui | — | — | Adresse email | `"john.doe@example.com"` |
| `phone` | `String` | oui | — | — | Numéro de téléphone | `"06 12 34 56 78"` |
| `status` | `String` | oui | `"waiting"` | — | Statut du compte. Enum: `"waiting"`, `"active"` | `"active"` |
| `password` | `String` | oui | — | — | Mot de passe hashé en SHA256 | `"2cf24dba5fb0a30e..."` |
| `job` | `String` | non | — | — | Job description | `"Responsable RH"` |
| `desc` | `String` | non | `""` | — | User description | `"Passionné de tech"` |
| `date_created` | `Date` | oui | `Date.now` | — | Date de création du compte | `2026-03-01T10:00:00Z` |
| `picture` | `String` | oui | `"default_profile_picture.png"` | — | Nom du fichier de la photo de profil | `"default_profile_picture.png"` |
| `is_online` | `Boolean` | oui | `false` | — | Indique si l'utilisateur est en ligne | `false` |
| `disturb_status` | `String` | oui | `"available"` | — | Statut de disponibilité. Enum: `"available"`, `"offline"`, `"dnd"` | `"available"` |
| `last_connection` | `Date` | oui | `Date.now` | — | Date de la dernière connexion | `2026-03-01T10:00:00Z` |
| `direct_manager` | `String` | oui | `"none"` | — | User uuid of the direct manager | `"none"` |
| `roles` | `ObjectId[]` | non | `"user"` | `Role` | List of roles id created by admin in the roles collection | `[ObjectId('...')]` |

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<UserType>` | `protected static` | Schéma Mongoose de la collection |
| `model` | `Model<UserType>` | `static` | Modèle Mongoose (singleton via `mongoose.models`) |
| `modelInstance` | `Document<UserType>` | `public` | Instance du document Mongoose pour les opérations d'écriture |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description |
|-----|------|--------|-------------|
| `models` | `object` | `mongoose.models` | Cache des modèles Mongoose enregistrés |
| Regex email | `RegExp` | `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` | Validation email utilisée dans toutes les méthodes CRUD |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: UserType` | `User` | instance | Crée une instance avec un nouveau document Mongoose |
| `save` | — | `Promise<void>` | instance | Sauvegarde le `modelInstance` en base de données |
| `inject` | — | `Promise<void>` | static | **[DEV]** Injecte 5 utilisateurs de test (test1–test5, password partagé: sha256("12345678")). En production, les utilisateurs sont créés via `register` (formulaire d'inscription) avec un mot de passe unique par utilisateur |
| `getUser` | `email: string` | `Promise<Document \| null \| undefined>` | static | Trouve un utilisateur par email. Valide le format email avant requête |
| `getUsers` | `emails: string[]` | `Promise<Document[]>` | static | Trouve plusieurs utilisateurs par emails. Filtre les emails invalides |
| `updateUser` | `email: string, newData: Partial<UserType>` | `Promise<UpdateResult \| undefined>` | static | Met à jour un utilisateur par email. Valide le format email |
| `updateUsers` | `emails: string[], newData: Partial<UserType>` | `Promise<UpdateResult>` | static | Met à jour plusieurs utilisateurs par emails |
| `deleteUser` | `email: string` | `Promise<DeleteResult \| undefined>` | static | Supprime un utilisateur par email. Valide le format email |
| `deleteUsers` | `emails: string[]` | `Promise<DeleteResult>` | static | Supprime plusieurs utilisateurs par emails |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime tous les utilisateurs |

---

## 5. Catalogue des messages associés

### Client → Serveur (4 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `users_list_request` | `{}` | Demande la liste de tous les utilisateurs |
| `user_info_request` | `{ userId: string }` | Demande les informations d'un utilisateur |
| `update_user_request` | `{ userId: string, data: Partial<UserType> }` | Mise à jour d'un utilisateur |
| `update_user_status_request` | `{ userId: string, status: string }` | Mise à jour du statut d'un utilisateur |
| `update_user_roles_request` | `{ userId: string, roles: string[] }` | Mise à jour des rôles d'un utilisateur |

### Serveur → Client (5 messages)

| Message | Payload | Description |
|---------|---------|-------------|
| `users_list_response` | `{ users: User[] }` | Réponse avec la liste des utilisateurs |
| `user_info_response` | `{ user: User }` | Réponse avec les informations de l'utilisateur |
| `update_user_response` | `{ success: boolean }` | Confirmation de la mise à jour |
| `update_user_status_response` | `{ success: boolean }` | Confirmation de la mise à jour du statut |
| `update_user_roles_response` | `{ success: boolean }` | Confirmation de la mise à jour des rôles |

**Total : 5 client→serveur + 5 serveur→client = 10 messages**

---

## 6. Types TypeScript

```typescript
type UserType = {
    _id?: Types.ObjectId,
    socket_id?: string,
    firstname: string,
    lastname: string,
    email: string,
    phone: string,
    status?: "waiting" | "active",
    password: string,
    job?: string,
    desc: string,
    date_created?: Date,
    picture?: string,
    is_online?: boolean,
    disturb_status?: string,
    last_connection?: Date,
    direct_manager?: string,
    roles?: Types.ObjectId,
}
```

---

## 7. Relations avec autres modèles

| Modèle | Relation | Description |
|--------|----------|-------------|
| `Role` | User.roles[] → Role | Chaque utilisateur référence un tableau de rôles |
| `Discussion` | User ← Discussion.members[], Discussion.creator, Discussion.messages[].sender | Les discussions référencent les utilisateurs |
| `Team` | User ← Team.createdBy | Les équipes sont créées par un utilisateur |
| `TeamMember` | User ← TeamMember.id | Les membres d'équipe référencent un utilisateur |
| `Channel` | User ← Channel.createdBy | Les canaux sont créés par un utilisateur |
| `ChannelMember` | User ← ChannelMember.userId | Les membres de canal référencent un utilisateur |
| `ChannelPost` | User ← ChannelPost.authorId | Les posts référencent un auteur |
| `ChannelPostResponse` | User ← ChannelPostResponse.authorId | Les réponses référencent un auteur |
| `Session` | User ← Session.userId | Les sessions sont liées à un utilisateur |
| `File/Folder` | User ← File.ownerId, Folder.ownerId | Les fichiers/dossiers appartiennent à un utilisateur |

---

## 8. Index et contraintes

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |

Aucun index personnalisé défini. La validation email est faite côté application (regex) et non côté schéma.

---

## 9. Exemples

### Créer et sauvegarder un utilisateur

```typescript
import { sha256 } from "js-sha256";

const user = new User({
    firstname: "Alice",
    lastname: "Dupont",
    email: "alice.dupont@example.com",
    phone: "06 12 34 56 78",
    password: sha256("monMotDePasse"),
    desc: "Développeuse fullstack",
    job: "Développeuse",
});
await user.save();
```

### Requêter un utilisateur

```typescript
const user = await User.getUser("alice.dupont@example.com");
// → { _id: ObjectId("..."), firstname: "Alice", lastname: "Dupont", status: "waiting", is_online: false, ... }

// Email invalide → retourne undefined (pas de requête DB)
const nope = await User.getUser("not-an-email");
// → undefined
```

### Mettre à jour un utilisateur

```typescript
await User.updateUser("alice.dupont@example.com", { status: "active", is_online: true });
```

### Document MongoDB

```json
{
    "_id": "ObjectId('67a1...')",
    "socket_id": "none",
    "firstname": "Alice",
    "lastname": "Dupont",
    "email": "alice.dupont@example.com",
    "phone": "06 12 34 56 78",
    "status": "waiting",
    "password": "2cf24dba5fb0a30e26e83b2ac5b9e29e...",
    "job": "Développeuse",
    "desc": "Développeuse fullstack",
    "picture": "default_profile_picture.png",
    "is_online": false,
    "disturb_status": "available",
    "direct_manager": "none",
    "roles": ["ObjectId('...')"],
    "date_created": "2026-03-01T10:00:00.000Z",
    "last_connection": "2026-03-01T10:00:00.000Z"
}
```

### Message Socket.io — lister les utilisateurs

```typescript
// Client
{ id: socketId, users_list_request: {} }

// Serveur
{ id: socketId, users_list_response: { users: [
    { firstname: "Alice", lastname: "Dupont", email: "alice.dupont@example.com", status: "active", ... },
    { firstname: "test1", lastname: "testlast1", email: "test1@visioconf.com", ... }
]}}
```
