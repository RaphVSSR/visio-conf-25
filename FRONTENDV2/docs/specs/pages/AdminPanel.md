# Référence de la page AdminPanel — VisioConf

**Fichier source** : `FRONTENDV2/src/pages/AdminPanel/AdminPanel.tsx`
**Styles** : `FRONTENDV2/src/pages/AdminPanel/AdminPanel.scss`
**Type** : Composant React fonctionnel (FC) — Page

---

## 1. Description

`AdminPanel` est le panel d'administration. Il affiche des cartes d'information (utilisateurs connectés, appels en cours) et une navigation par onglets (Utilisateurs, Rôles, Permissions, Equipes). La sélection d'un onglet monte le composant `AdminTabPanel`.

**État actuel :** Les valeurs dynamiques sont hardcodées (4 utilisateurs, 6 appels). L'ancien code est commenté — à migrer vers le pattern `MessageClientAdapter` + `socket.send`.

---

## 2. Structure HTML sémantique

### Vue principale (pas d'onglet sélectionné)

```html
<main id="adminPanel">
    <h1>Administration</h1>
    <section id="infosWrapper">
        <article class="info info--users">      ← Utilisateurs connectés
        <article class="info info--calls">       ← Appels en cours
    </section>
    <nav id="tabsWrapper">
        <button class="tab tab--users">          ← Onglet Utilisateurs
        <button class="tab tab--roles">          ← Onglet Rôles
        <button class="tab tab--permissions">    ← Onglet Permissions
        <button class="tab tab--teams">          ← Onglet Equipes
    </nav>
</main>
```

---

## 3. State

| State | Type | Description |
|-------|------|-------------|
| `tabSelected` | `string \| null` | Nom de l'onglet sélectionné (`null` = vue principale) |

---

## 4. Route

| Path | Garde | Description |
|------|-------|-------------|
| `/admin` | `UserAuth` + `AdminAuth` | Double protection (auth + rôle admin) |

---

## 5. Code commenté (à migrer)

L'ancien code utilisait l'inscription manuelle au controleur. Migration vers le nouveau pattern :

| Ancien message | Nouveau message | Description |
|---|---|---|
| `users_list_request` | `user_get { type: "list" }` | Récupérer la liste des utilisateurs |
| `users_list_response` | `user_get_response { type: "list" }` | Réponse avec la liste |
| `user_perms_request` | *(à implémenter)* | Vérification des permissions |
| `update_user_roles_response` | `user_update_response { type: "roles" }` | Réponse mise à jour des rôles |

Ce code doit être migré vers `socket.send()` / `socket.on()` via `useAuth().socket`.
