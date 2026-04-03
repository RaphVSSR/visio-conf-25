# SignupForm

**Source**: `FRONTENDV2/src/components/SignupForm/SignupForm.tsx`

Composant de formulaire d'inscription avec validation native HTML5. Collecte firstname, lastname, email, password (min 8 caractères) et phone. Redirige vers `/home` quand déjà authentifié.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| *(aucun)* | — | — | Aucune prop, utilise le hook `useAuth` |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| showPwd | `boolean` | `false` | Bascule le champ mot de passe entre type text et password |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| handleSubmit | event (`FormEvent<HTMLFormElement>`) | void | Valide le formulaire, extrait tous les champs depuis FormData, appelle `register()` |

## Détails

- Consomme `register`, `isLoading`, `isAuthenticated` depuis `useAuth()`.
- Un `useEffect` redirige vers `/home` avec `replace: true` quand `isAuthenticated` devient vrai.
- `register` est appelé avec un objet : `{ email, password, firstname, lastname, phone }`.
- Le champ mot de passe impose `minLength={8}` via l'attribut HTML.
- Le bouton de soumission est désactivé pendant le chargement, affiche le texte "Inscription en cours...".
- Lien vers `/login` via `Link` de `react-router-dom`.

## Flux

Voir [auth-flows.md](../../flows/auth-flows.md)
