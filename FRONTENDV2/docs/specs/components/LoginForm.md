# LoginForm

**Source**: `FRONTENDV2/src/components/LoginForm/LoginForm.tsx`

Composant de formulaire de connexion utilisant la validation native HTML5. Redirige vers `/home` quand déjà authentifié. Affiche un message de rejet en cas d'échec de connexion et bascule la visibilité du mot de passe.

## Props

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| *(aucun)* | — | — | Aucune prop, utilise le hook `useAuth` |

## State

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| pwdStatus | `"shown" \| "hidden"` | `"hidden"` | Contrôle la visibilité du champ mot de passe |
| error | `string` | `""` | Message d'erreur local (actuellement défini mais seulement affiché) |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| handleSubmit | event (`FormEvent<HTMLFormElement>`) | void | Valide le formulaire, extrait email/password depuis FormData, appelle `login()` |

## Détails

- Consomme `login`, `isLoading`, `isAuthenticated`, `loginRejected` depuis `useAuth()`.
- Un `useEffect` redirige vers `/home` avec `replace: true` quand `isAuthenticated` devient vrai.
- Le bouton de soumission est désactivé pendant le chargement et affiche le texte "Connexion en cours...".
- `loginRejected` affiche un message statique "Email ou mot de passe incorrect."
- Lien vers `/signup` via `Link` de `react-router-dom`.

## Flux

Voir [auth-flows.md](../../flows/auth-flows.md)
