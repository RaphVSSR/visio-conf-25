# Référence du composant SignupForm — VisioConf

**Fichier source** : `FRONTENDV2/src/components/SignupForm/SignupForm.tsx`
**Styles** : `FRONTENDV2/src/components/SignupForm/SignupForm.scss`
**Type** : Composant React fonctionnel

---

## 1. Description

`SignupForm` est le formulaire d'inscription. Il collecte les informations utilisateur (prénom, nom, email, mot de passe, téléphone), utilise la validation HTML5 native (minLength 8 pour le mot de passe), et redirige vers `/home` après inscription réussie.

---

## 2. State local

| State | Type | Valeur initiale | Description |
|-------|------|-----------------|-------------|
| `showPwd` | `boolean` | `false` | Visibilité du mot de passe |

---

## 3. State depuis useAuth

| Propriété | Utilisation |
|-----------|-------------|
| `register` | Appelé à la soumission du formulaire |
| `isLoading` | Désactive le bouton submit, affiche "Inscription en cours..." |
| `isAuthenticated` | Auto-redirection vers /home si true |

---

## 4. Structure HTML sémantique

```html
<form id="signupForm" onSubmit={handleSubmit}>
    <img src="logos/logo_univ_grand.svg" />
    <h1>Créer son compte</h1>
    <fieldset id="inputWrapper">
        <input name="firstname" type="text" required />
        <input name="lastname" type="text" required />
        <input name="email" type="email" required />
        <div id="pwdWrapper">
            <input name="password" type="password" minLength={8} required />
            <Eye/EyeOff />
        </div>
        <input name="phone" type="tel" required />
    </fieldset>
    <footer id="signupFooter">
        <button type="submit" disabled={isLoading} />
        <Link to="/login">Déjà un compte ?</Link>
    </footer>
</form>
```

---

## 5. Champs du formulaire

| Champ | Type HTML | Name | Validation |
|-------|-----------|------|------------|
| Prénom | `text` | `firstname` | required |
| Nom | `text` | `lastname` | required |
| Email | `email` | `email` | required |
| Mot de passe | `password` | `password` | required, minLength 8 |
| Téléphone | `tel` | `phone` | required |

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `useAuth` | SignupForm utilise useAuth() | register, isLoading, isAuthenticated |
| `Signup` | Signup rend SignupForm | Page wrapper |
