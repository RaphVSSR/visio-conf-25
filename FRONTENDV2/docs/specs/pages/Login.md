# Référence de la page Login — VisioConf

**Fichier source** : `FRONTENDV2/src/pages/Login/Login.tsx`
**Styles** : `FRONTENDV2/src/pages/Login/Login.scss`
**Type** : Composant React fonctionnel (FC) — Page

---

## 1. Description

`Login` est la page de connexion. C'est un wrapper minimaliste qui affiche le composant `LoginForm` sur un fond d'image. Route publique (pas de garde).

---

## 2. Structure HTML sémantique

```html
<main id="loginPage" style="background-image: url('backgrounds/backLogin.jpg')">
    <LoginForm />
</main>
```

---

## 3. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `LoginForm` | `components/` | Formulaire de connexion complet |

---

## 4. Route

| Path | Garde | Description |
|------|-------|-------------|
| `/login` | aucune | Page publique |
