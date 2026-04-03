# TracedError

**Source**: `BACKEND/src/models/core/TracedError.ts`

Classe d'erreur personnalisée étendant `Error`. Fournit des messages d'erreur typés et catalogués avec des identifiants uniques, des chaînes de raison optionnelles, et des stack traces améliorées via `Error.captureStackTrace`. Utilisée dans tout le backend pour une gestion cohérente des erreurs.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| id | `ErrorsType[keyof ErrorsType]["id"]` | `"dbConnect"` | Identifiant correspondant à la clé du type d'erreur |
| reason | `string` (optional) | `"connection refused"` | Message complémentaire provenant du contexte d'émission |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| constructor | `type: keyof ErrorsType`, `reason?: string` | `TracedError` | Crée une erreur typée avec un message prédéfini du catalogue ErrorsType, configure la chaîne de prototypes et capture la stack trace |
| errorHandler | `error: any` | `void` | Statique. Affiche message + raison + stack pour les instances TracedError, ou se rabat sur `console.trace` pour les erreurs inconnues |

## Détails

La constante `ErrorsType` définit 16 entrées d'erreur utilisées comme paramètre `type` du constructeur :

| Clé | Message |
|-----|---------|
| dbConnect | Erreur lors du processus de connexion MongoDB |
| dbClose | Erreur lors du processus de fermeture MongoDB |
| dbFlushing | Erreur lors du flush MongoDB |
| uploadsIntegrity | Intégrité de l'environnement d'uploads compromise |
| collectionIntegrity | Intégrité de l'environnement de la collection compromise |
| collectionSaving | La sauvegarde de la collection a échoué |
| testFilesCopying | Erreur lors de la copie d'un fichier de test |
| getFileSize | Erreur lors de la récupération de la taille du fichier |
| restCorsDef | Erreur lors de la définition du CORS REST |
| restRoutesDef | Erreur lors de la définition des routes REST |
| injectingCollection | Erreur lors de l'injection d'une collection |
| roleNotFound | Erreur un rôle n'existe pas |
| adminCredentialsNotReferenced | Erreur les identifiants admin ne sont pas référencés dans un fichier .env |
| noTeamsFound | Erreur la collection des équipes est vide |
| noChannelsFound | Erreur la collection des channels est vide |
| injectAdmin | Erreur lors de l'injection de l'utilisateur admin |
