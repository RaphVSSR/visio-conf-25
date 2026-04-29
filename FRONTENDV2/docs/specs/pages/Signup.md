# Référence de la page Signup — VisioConf

**Fichier source** : `FRONTENDV2/src/pages/Signup/Signup.tsx`
**Styles** : `FRONTENDV2/src/pages/Signup/Signup.scss`
**Type** : Composant React fonctionnel (FC) — Page

---

## 1. Description

`Signup` est la page d'inscription. Wrapper minimaliste qui affiche le composant `SignupForm` sur un fond d'image. Route publique (pas de garde).

---

## 2. Structure HTML sémantique

```html
<main id="signupPage" style="background-image: url('backgrounds/backLogin.jpg')">
    <SignupForm />
</main>
```

---

## 3. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `SignupForm` | `components/` | Formulaire d'inscription complet |

---

## 4. Route

| Path | Garde | Description |
|------|-------|-------------|
| `/signup` | aucune | Page publique |
