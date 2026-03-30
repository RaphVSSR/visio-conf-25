# Référence du composant LoginForm — VisioConf

**Fichier source** : `FRONTENDV2/src/components/LoginForm/LoginForm.tsx`
**Styles** : `FRONTENDV2/src/components/LoginForm/LoginForm.scss`
**Type** : Composant React fonctionnel

---

## 1. Description

`LoginForm` est le formulaire de connexion. Utilise la validation HTML5 native et redirige automatiquement vers `/home` si l'utilisateur est deja authentifie. Affiche un message d'erreur si le login echoue.

---

## 2. State local

| State | Type | Valeur initiale | Description |
|-------|------|-----------------|-------------|
| `pwdStatus` | `"shown" \| "hidden"` | `"hidden"` | Visibilité du mot de passe |
| `error` | `string` | `""` | Message d'erreur local |

---

## 3. State depuis useAuth

| Propriété | Utilisation |
|-----------|-------------|
| `login` | Appelé à la soumission du formulaire |
| `isLoading` | Désactive le bouton submit, affiche "Connexion en cours..." |
| `isAuthenticated` | Auto-redirection vers /home si true |
| `loginRejected` | Affiche un message d'erreur si le login a echoue |

---

## 4. Structure HTML sémantique

### Mode formulaire

```html
<form id="loginForm" onSubmit={handleSubmit}>
    <img src="logos/logo_univ_grand.svg" />
    <h1>Se connecter</h1>
    {loginRejected && <p class="rejectedMessage">...</p>}
    <fieldset id="inputWrapper">
        <input type="email" name="email" required />
        <div id="pwdWrapper">
            <input type="password" name="password" required />
            <Eye/EyeOff />                    ← Toggle visibilité
        </div>
    </fieldset>
    <footer id="footerForm">
        <button type="submit" disabled={isLoading} />
        <Link to="/signup">Créer son compte</Link>
    </footer>
</form>
```

---

## 5. Soumission

```
handleSubmit(event)
    ├─ event.preventDefault()
    ├─ form.checkValidity() → form.reportValidity() si invalide
    ├─ FormData → email, password
    ├─ setError("")
    └─ login(email, password)
```

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `useAuth` | LoginForm utilise useAuth() | login, isLoading, isAuthenticated, loginRejected |
| `Login` | Login rend LoginForm | Page wrapper |
