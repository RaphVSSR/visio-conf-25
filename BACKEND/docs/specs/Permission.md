# Référence du Modèle Permission — VisioConf

**Fichier source** : `BACKEND/src/models/Permission.ts`
**Classe parente** : `Collection` (abstract)
**Collection MongoDB** : `Permission`

---

## 1. Schema complet

| Champ | Type | Required | Default | Ref | Description | Exemple |
|-------|------|----------|---------|-----|-------------|---------|
| `_id` | `ObjectId` | auto | auto | — | Identifiant MongoDB | `ObjectId('67a1b2c3...')` |
| `uuid` | `String` | oui | — | — | Message identifier | `"naviguer_vers"` |
| `label` | `String` | oui | — | — | Name of the permission | `"Naviguer vers"` |
| `desc` | `String` | non | — | — | Permission's description | `"Permet de naviguer"` |
| `default` | `Boolean` | oui | — | — | Does this permission needs to be by default affected ? | `true` |

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `schema` | `Schema<PermType>` | `protected static` | Schéma Mongoose de la collection |
| `model` | `Model<PermType>` | `static` | Modèle Mongoose (singleton via `mongoose.models`) |
| `modelInstance` | `Document<PermType>` | `public` | Instance du document Mongoose pour les opérations d'écriture |

---

## 3. Variables et constantes

| Nom | Type | Valeur | Description |
|-----|------|--------|-------------|
| `models` | `object` | `mongoose.models` | Cache des modèles Mongoose enregistrés |

---

## 4. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `constructor` | `dataToConstruct: PermType` | `Permission` | instance | Crée une instance avec un nouveau document Mongoose |
| `save` | — | `Promise<void>` | instance | Sauvegarde le `modelInstance` en base de données |
| `inject` | — | `Promise<void>` | static | **[DEV+PROD]** Injecte les 45 permissions prédéfinies. Nécessaire au premier démarrage en production aussi (seeding initial) |
| `getPerm` | `label: string` | `Promise<Document \| null>` | static | Trouve une permission par son label |
| `getPerms` | `labels: string[]` | `Promise<Document[]>` | static | Trouve plusieurs permissions par leurs labels |
| `updatePerm` | `label: string, newData: Partial<PermType>` | `Promise<UpdateResult>` | static | Met à jour une permission (note: filtre par `email` — bug potentiel) |
| `updatePerms` | `labels: string[], newData: Partial<PermType>` | `Promise<UpdateResult>` | static | Met à jour plusieurs permissions (note: filtre par `email` — bug potentiel) |
| `deletePerm` | `label: string` | `Promise<DeleteResult>` | static | Supprime une permission par son label |
| `deletePerms` | `labels: string[]` | `Promise<DeleteResult>` | static | Supprime plusieurs permissions par leurs labels |
| `flushAll` | — | `Promise<DeleteResult>` | static | **[DEV]** Supprime toutes les permissions |

---

## 5. Catalogue des messages associés

### Client → Serveur (4 messages)

| Message | Payload | Description | Exemple |
|---------|---------|-------------|---------|
| `perms_list_request` | `{}` | Demande la liste de toutes les permissions | `{ id: "xK9...", perms_list_request: {} }` |
| `user_perms_request` | `{ userId: string }` | Demande les permissions d'un utilisateur | `{ id: "xK9...", user_perms_request: { userId: "u1..." } }` |
| `update_perm_request` | `{ permId: string, data: Partial<PermType> }` | Mise à jour d'une permission | `{ ..., update_perm_request: { permId: "p1...", data: { default: true } } }` |
| `add_perm_request` | `{ data: PermType }` | Ajout d'une nouvelle permission | `{ ..., add_perm_request: { data: { uuid: "new_perm", label: "New", default: false } } }` |

### Serveur → Client (4 messages)

| Message | Payload | Description | Exemple |
|---------|---------|-------------|---------|
| `perms_list_response` | `{ perms: Permission[] }` | Réponse avec la liste des permissions | `{ perms: [{ uuid: "naviguer_vers", label: "Naviguer vers", default: true }] }` |
| `user_perms_response` | `{ perms: Permission[] }` | Réponse avec les permissions de l'utilisateur | `{ perms: [{ uuid: "naviguer_vers", ... }] }` |
| `update_perm_response` | `{ success: boolean }` | Confirmation de la mise à jour | `{ success: true }` |
| `add_perm_response` | `{ success: boolean }` | Confirmation de l'ajout | `{ success: true }` |

**Total : 4 client→serveur + 4 serveur→client = 8 messages**

---

## 6. Types TypeScript

```typescript
type PermType = {
    _id?: Types.ObjectId,
    uuid: string,
    label: string,
    desc?: string,
    default: boolean,
}
```

---

## 7. Relations avec autres modèles

| Modèle | Relation | Description |
|--------|----------|-------------|
| `Role` | Permission ← Role.permissions[] | Les rôles référencent des permissions via un tableau d'ObjectId |

---

## 8. Index et contraintes

| Index | Champs | Type | Description |
|-------|--------|------|-------------|
| `_id` | `_id` | unique (auto) | Index par défaut MongoDB |

Aucun index personnalisé défini.

---

## Permissions injectées par défaut (inject)

45 permissions prédéfinies couvrant :
- Navigation (`naviguer_vers`)
- Administration utilisateurs (`admin_demande_liste_utilisateurs`, `admin_ajouter_utilisateur`, etc.)
- Administration rôles (`admin_demande_liste_roles`, `admin_modifier_role`, etc.)
- Administration permissions (`admin_demande_liste_permissions`, `admin_ajouter_permission`, etc.)
- Administration équipes (`admin_demande_liste_equipes`, `admin_ajouter_equipe`, etc.)
- Utilisateur standard (`demande_liste_utilisateurs`, `demande_annuaire`, `demande_info_utilisateur`, etc.)
- Messagerie (`envoie_message`, `demande_liste_discussions`, `demande_historique_discussion`)
- Notifications (`demande_notifications`, `update_notifications`)
- Profil (`update_profil`, `update_picture`)
- Appels WebRTC (`new_call`, `send_ice_candidate`, `send_offer`, `send_answer`, `reject_offer`, `hang_up`, `receive_offer`, `receive_answer`, `receive_ice_candidate`, `offer_rejected`, `call_created`, `hung_up`, `call_connected_users`)

---

## 9. Exemples

### Créer et sauvegarder une permission

```typescript
const perm = new Permission({ uuid: "voir_statistiques", label: "Voir les statistiques", default: false });
await perm.save();
```

### Requêter / supprimer

```typescript
await Permission.getPerm("Voir les statistiques");
await Permission.getPerms(["Naviguer vers", "Envoyer un message"]);
await Permission.deletePerm("Voir les statistiques");
await Permission.flushAll();
```
