# User

**Source**: `BACKEND/src/models/User.ts`

Représente un utilisateur de la plateforme avec ses identifiants d'authentification, ses informations de profil et sa présence en ligne. N'étend pas Collection (classe autonome avec sa propre méthode save).

## Schema

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| socket_id | String | `"xK9_2mZqR..."` | ID de connexion socket actuel (défaut : "none") |
| firstname | String (required) | `"John"` | Prénom |
| lastname | String (required) | `"Doe"` | Nom de famille |
| email | String (required) | `"john@visioconf.com"` | Adresse email, utilisée comme clé de recherche principale |
| phone | String (required) | `"06 52 14 55 45"` | Numéro de téléphone |
| status | String (required, enum) | `"active"` | Statut du compte : "waiting" ou "active" (défaut : "waiting") |
| password | String (required) | `"e3b0c44..."` | Mot de passe hashé en SHA256 |
| job | String | `"Developer"` | Intitulé de poste |
| desc | String | `"A description"` | Description de l'utilisateur (défaut : "") |
| date_created | Date (required) | `2026-03-30T...` | Horodatage d'inscription (défaut : Date.now) |
| picture | String (required) | `"profile.png"` | Nom de fichier de la photo de profil (défaut : "default_profile_picture.png") |
| is_online | Boolean (required) | `true` | Statut en ligne (défaut : false) |
| disturb_status | String (required, enum) | `"available"` | Disponibilité : "available", "offline", "dnd" (défaut : "available") |
| last_connection | Date (required) | `2026-03-30T...` | Horodatage de dernière connexion (défaut : Date.now) |
| direct_manager | String (required) | `"admin"` | uuid utilisateur du responsable direct (défaut : "none") |
| roles | String[] | `["admin", "user"]` | Liste des chaînes uuid de rôles (défaut par entrée : "user") |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| constructor | dataToConstruct (UserType) | User | Crée une nouvelle instance User |
| save | -- | Promise\<void\> | Persiste l'instance, lance TracedError en cas d'échec |
| inject (static) | -- | Promise\<void\> | Injecte 5 utilisateurs de test (test1-test5) avec mots de passe hashés en SHA256 |
| getUser (static) | email (string) | Promise | Trouve un utilisateur par email, valide le format d'email d'abord (retourne undefined si invalide) |
| getUsers (static) | emails (string[]) | Promise | Trouve plusieurs utilisateurs par email, retire les formats invalides avant la requête |
| updateUser (static) | email (string), newData (Partial\<UserType\>) | Promise | Met à jour un utilisateur par email, valide le format d'abord |
| updateUsers (static) | emails (string[]), newData (Partial\<UserType\>) | Promise | Met à jour plusieurs utilisateurs par email, retire les formats invalides |
| deleteUser (static) | email (string) | Promise | Supprime un utilisateur par email, valide le format d'abord |
| deleteUsers (static) | emails (string[]) | Promise | Supprime plusieurs utilisateurs par email, retire les formats invalides |
| flushAll (static) | -- | Promise | Supprime tous les documents User |

## Détails

- UserType exporté pour usage externe (inclut _id optionnel)
- Toutes les méthodes statiques mono-utilisateur valident l'email via regex `/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/` avant la requête
- Mots de passe hashés avec SHA256 via la librairie js-sha256
- Les rôles sont stockés comme des uuid de type string, pas des références ObjectId (malgré le fait que UserType déclare string[])

## Flux

Voir [user-flows.md](../../flows/user-flows.md)
