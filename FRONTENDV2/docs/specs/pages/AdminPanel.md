# Référence de la page AdminPanel — VisioConf

**Fichier source** : `FRONTENDV2/src/pages/AdminPanel/AdminPanel.tsx`
**Styles** : `FRONTENDV2/src/pages/AdminPanel/AdminPanel.scss`
**Type** : Composant React fonctionnel (FC) — Page

---

## 1. Description

`AdminPanel` est le panel d'administration. Il affiche des cartes d'information (utilisateurs connectés, appels en cours) et une navigation par onglets (Utilisateurs, Rôles, Permissions, Equipes). La sélection d'un onglet monte le composant `AdminTabPanel`.

**État actuel :** Les valeurs dynamiques sont hardcodées (4 utilisateurs, 6 appels). L'ancien code utilisant le controleur est commenté — à migrer vers le pattern `ControllerService`.

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

### Vue onglet (onglet sélectionné)

```html
<AdminTabPanel tabSelected={tabSelected} setTabSelected={setTabSelected} />
```

---

## 3. State

| State | Type | Description |
|-------|------|-------------|
| `tabSelected` | `string \| null` | Nom de l'onglet sélectionné (`null` = vue principale) |

---

## 4. Onglets

| Nom | Modifier CSS | Icône |
|-----|-------------|-------|
| Utilisateurs | `users` | `UsersRound` |
| Rôles | `roles` | `Drama` |
| Permissions | `permissions` | `ListChecks` |
| Equipes | `teams` | `MessagesSquare` |

---

## 5. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `AdminTabPanel` | `components/` | Panel détaillé d'un onglet avec sous-options |

---

## 6. Route

| Path | Garde | Description |
|------|-------|-------------|
| `/admin` | `UserAuth` + `AdminAuth` | Double protection (auth + rôle admin) |

---

## 7. Code commenté (à migrer)

L'ancien code contenait :
- Inscription manuelle au controleur (`controleur.inscription(handler, ...)`)
- Messages : `users_list_request`, `user_perms_request`, `users_list_response`, `user_perms_response`
- Vérification dynamique des permissions utilisateur
- Comptage des utilisateurs en ligne

Ce code doit être migré vers un `AdminService extends ControllerService` dédié.
