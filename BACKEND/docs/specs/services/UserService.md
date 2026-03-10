# Référence du UserService — VisioConf

**Fichier source** : `BACKEND/src/models/services/UserService.ts`
**Classe parente** : `ControllerService` (abstract)
**nomDInstance** : `"UserService"`

---

## 1. Description

`UserService` gère les opérations de consultation et mise à jour des utilisateurs. Distinct de `AuthService` (qui gère login/register/session), ce service couvre le CRUD utilisateur et la recherche.

---

## 2. Messages

### Émis (6)

`users_list_response`, `user_info_response`, `users_search_response`, `update_user_response`, `update_user_status_response`, `update_user_roles_response`

### Reçus (6)

`users_list_request`, `user_info_request`, `users_search_request`, `update_user_request`, `update_user_status_request`, `update_user_roles_request`

---

## 3. Méthodes privées

| Méthode | Paramètres | Retour | Description |
|---------|------------|--------|-------------|
| `resolveUserId` | `socketId: string` | `Promise<string \| null>` | Résout le socketId vers l'userId via Session |

---

## 4. Handlers

| Handler | Payload reçu | Réponse | Description |
|---------|--------------|---------|-------------|
| `getUsersList` | `{}` | `{ etat, users[] }` | Retourne tous les utilisateurs actifs (id, firstname, lastname, email, picture, isOnline, job) |
| `getUserInfo` | `{ userId }` | `{ etat, user }` | Retourne les infos complètes (+ desc, phone, dateCreated) |
| `searchUsers` | `{ query }` | `{ etat, users[] }` | Recherche case-insensitive par regex sur firstname, lastname, email. Limité à 20 résultats |
| `updateUser` | `{ firstname?, lastname?, phone?, job?, desc?, picture? }` | `{ etat }` | Met à jour le profil de l'utilisateur connecté (résolu via socketId) |
| `updateUserStatus` | `{ userId, status }` | `{ etat, userId, status }` | Met à jour le statut d'un utilisateur |
| `updateUserRoles` | `{ userId, roles[] }` | `{ etat, userId, roles }` | Met à jour les rôles d'un utilisateur |

---

## 5. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `User` | CRUD via `User.model` | Modèle Mongoose des utilisateurs |
| `Session` | Auth via `Session.model` | Résolution socketId → userId |
