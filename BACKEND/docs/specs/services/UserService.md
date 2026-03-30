# Référence de la classe UserService — VisioConf

**Fichier source** : `BACKEND/src/models/services/UserService.ts`
**nomDInstance** : `"UserService"`

---

## 1. Description

`UserService` gère les opérations de consultation et de mise à jour des utilisateurs. Distinct de `AuthService` (qui gère login/inscription/session), ce service couvre le CRUD utilisateur et la recherche. Utilise le pattern de messages consolidé avec une Map de handlers via `register()` et un dispatcher.

---

## 2. Messages

### Reçus (2 consolidés)

| Message | Valeurs du champ type | Description |
|---------|----------------------|-------------|
| `user_get` | `list`, `info`, `search` | Opérations de lecture sur les utilisateurs |
| `user_update` | `profile`, `status`, `roles` | Opérations d'écriture sur les utilisateurs |

### Émis (2 réponses consolidées)

| Message | Valeurs du champ type | Description |
|---------|----------------------|-------------|
| `user_get_response` | `list`, `info`, `search` | Réponse à la requête, contient `etat: boolean` |
| `user_update_response` | `profile`, `status`, `roles` | Réponse à la mise à jour, contient `etat: boolean` |

---

## 3. Méthodes privées

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `resolveUserId` | `socketId: string` | `string \| null` | Résout le socketId en userId via SessionManager |
| `registerHandler` | `messageName: string, handler: MessageHandler` | `void` | Enregistre un handler dans la Map interne |
| `send` | `socketIds: string \| string[], messageName: string, payload: unknown` | `void` | Envoie un message via le controleur |

---

## 4. Dispatchers

| Dispatcher | Message entrant | Types dispatchés | Description |
|------------|-----------------|------------------|-------------|
| `handleUserQuery` | `user_get` | `list`, `info`, `search` | Route vers les handlers de lecture selon le `type` |
| `handleUserUpdate` | `user_update` | `profile`, `status`, `roles` | Route vers les handlers d'écriture selon le `type` |

---

## 5. Handlers

| Handler | Type | Payload reçu | Payload de réponse | Description |
|---------|------|--------------|--------------------|-------------|
| `getUsersList` | `list` | `{}` | `{ type: "list", etat, users[] }` | Retourne tous les utilisateurs actifs (id, firstname, lastname, email, picture, isOnline, job) |
| `getUserInfo` | `info` | `{ userId }` | `{ type: "info", etat, user }` | Retourne les informations complètes d'un utilisateur (+ desc, phone, dateCreated) |
| `searchUsers` | `search` | `{ query }` | `{ type: "search", etat, users[] }` | Recherche insensible à la casse par regex sur firstname, lastname, email. Limité à 20 résultats |
| `updateUser` | `profile` | `{ firstname?, lastname?, phone?, job?, desc?, picture? }` | `{ type: "profile", etat }` | Met à jour le profil de l'utilisateur connecté (résolu via socketId) |
| `updateUserStatus` | `status` | `{ userId, status }` | `{ type: "status", etat, userId, status }` | Rôle admin requis via AccessRoleGuard. Met à jour le statut d'un utilisateur |
| `updateUserRoles` | `roles` | `{ userId, roles[] }` | `{ type: "roles", etat, userId, roles }` | Rôle admin requis via AccessRoleGuard. Met à jour les rôles d'un utilisateur |

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `User` | CRUD via `User.model` | Modèle Mongoose utilisateur |
| `SessionManager` | Auth via méthodes statiques | Résout le socketId en userId |
| `AccessRoleGuard` | Autorisation | Vérifie le rôle admin pour les mises à jour de statut/rôles |
| `ListeMessages` | Config messages via `getMessagesByDomain("user")` | Fournit la liste des messages reçus pour l'inscription |
