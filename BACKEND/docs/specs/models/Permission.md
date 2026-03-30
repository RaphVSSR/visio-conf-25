# Permission

**Source**: `BACKEND/src/models/Permission.ts`

Représente une permission granulaire pouvant être assignée à des rôles. Chaque permission correspond à une action système spécifique (navigation, opérations admin, messagerie, appels). Étend Collection.

## Schema

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| uuid | String (required) | `"envoie_message"` | Identifiant unique de la permission |
| label | String (required) | `"Envoyer un message"` | Nom lisible de la permission |
| desc | String | `"Allows sending"` | Description optionnelle |
| default | Boolean (required) | `true` | Si assignée par défaut aux rôles de base |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| constructor | dataToConstruct (PermType) | Permission | Crée une nouvelle instance Permission |
| save | -- | Promise\<void\> | Persiste l'instance, lance TracedError en cas d'échec |
| inject (static) | -- | Promise\<void\> | Injecte les 45 permissions prédéfinies |
| getPerm (static) | label (string) | Promise | Trouve une permission par label |
| getPerms (static) | labels (string[]) | Promise | Trouve les permissions correspondant aux labels fournis |
| updatePerm (static) | label (string), newData (Partial\<PermType\>) | Promise | Met à jour une permission par label |
| updatePerms (static) | labels (string[]), newData (Partial\<PermType\>) | Promise | Met à jour plusieurs permissions par labels |
| deletePerm (static) | label (string) | Promise | Supprime une permission par label |
| deletePerms (static) | labels (string[]) | Promise | Supprime plusieurs permissions par labels |
| flushAll (static) | -- | Promise | Supprime tous les documents Permission |

## Détails

- PermType exporté pour usage externe (inclut _id optionnel)
- Les permissions injectées couvrent : navigation, gestion admin des utilisateurs/rôles/permissions/équipes, messagerie, discussions, profil, notifications et opérations d'appel WebRTC
- Permissions avec `default: true` : naviguer_vers et toutes les permissions liées aux appels (new_call, send_ice_candidate, send_offer, send_answer, reject_offer, hang_up, receive_offer, receive_answer, receive_ice_candidate, offer_rejected, call_created, hung_up, call_connected_users)
- updatePerm et updatePerms requêtent par champ `email` au lieu de `label` -- c'est un bug dans le code source
