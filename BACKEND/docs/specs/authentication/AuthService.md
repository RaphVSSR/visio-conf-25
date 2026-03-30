# AuthService

**Source**: `BACKEND/src/models/services/authentication/AuthService.ts`

Gère toute l'authentification basée sur les sockets (login, register, reconnexion, déconnexion) via le pattern pub/sub du contrôleur. Délègue la gestion des sessions à `SessionManager` et le hashage des mots de passe à SHA256. N'étend pas `ControllerService` — gère sa propre référence `controleur`, son `nomDInstance`, et sa Map de handlers.

## Messages

| Nom | Direction | Payload (types) | Exemple | Description |
|-----|-----------|-----------------|---------|-------------|
| `login` | Client -> Server | `{ email: string, password: string }` | `{ email: "dev@visioconf.com", password: "a1b2c3..." }` | Authentification avec identifiants |
| `register` | Client -> Server | `{ password: string, firstname: string, lastname: string, email: string, phone: string }` | `{ password: "mdp", firstname: "John", ... }` | Création d'un nouveau compte |
| `authenticate` | Client -> Server | none (userId résolu depuis le cookie de session) | `{}` | Reconnexion via une session existante |
| `socket_disconnect` | Internal | `string` (socketId) | `"xK9mP2..."` | Émis lorsqu'un socket se déconnecte |
| `login_response` | Server -> Client | `{ status: "success", user: object, expiresAt: number }` ou `{ status: "failure", reason: "user_not_found" \| "wrong_password" }` | `{ status: "success", user: {...}, expiresAt: 1709312400000 }` | Résultat du login |
| `register_response` | Server -> Client | `{ status: "success", user: object, expiresAt: number }` ou `{ status: "failure", reason: "email_already_exists" \| string }` | `{ status: "failure", reason: "email_already_exists" }` | Résultat de l'inscription |
| `authenticate_response` | Server -> Client | `{ status: "success", user: object, expiresAt: number }` ou `{ status: "failure", reason: "session_expired" \| "user_not_found" }` | `{ status: "success", user: {...}, expiresAt: 1709312400000 }` | Résultat de la reconnexion |

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| `controleur` | `any` | — | Référence au contrôleur pour l'envoi/réception de messages |
| `nomDInstance` | `string` | `"AuthService"` | Nom d'instance pour l'enregistrement auprès du contrôleur |
| `handlers` | `Map<string, MessageHandler>` (private) | — | Associe les noms de messages à leurs fonctions de traitement |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| `constructor` | `controleur: any, name: string` | `AuthService` | Stocke la référence au contrôleur et le nom d'instance |
| `register` | — | `void` | Enregistre tous les handlers et appelle `controleur.inscription()` avec les listes de messages sortants/entrants |
| `traitementMessage` | `msg: any` | `void` | Dispatcheur : extrait la clé d'action du message, recherche le handler, l'exécute |
| `registerHandler` | `messageName: string, handler: MessageHandler` (private) | `void` | Ajoute un handler à la Map `handlers` |
| `send` | `socketIds: string \| string[], messageName: string, payload: unknown` (private) | `void` | Encapsule `controleur.envoie()`, normalise socketIds en tableau |
| `login` | `socketId: string, payload: { email: string, password: string }` (private async) | `Promise<void>` | Vérifie les identifiants via `User.getUser()` + `verifyPassword()`, lie la session, envoie `login_response` |
| `authenticate` | `socketId: string` (private async) | `Promise<void>` | Résout le userId depuis `SessionManager.getUserId()`, récupère l'utilisateur, lie la session, envoie `authenticate_response` |
| `handleRegister` | `socketId: string, payload: { password: string, firstname: string, lastname: string, email: string, phone: string }` (private async) | `Promise<void>` | Vérifie l'unicité de l'email, crée l'utilisateur avec mot de passe hashé, lie la session, envoie `register_response` |
| `socketDisconnect` | `socketId: string` (private) | `void` | Appelle `SessionManager.unbind()` |
| `bindSession` | `socketId: string, userId: string` (private static) | `number` | Appelle `SessionManager.bind()`, retourne le timestamp `expiresAt` |
| `sanitizeUser` | `user: Record<string, any>` (private static) | `object` | Retourne l'objet utilisateur sans le champ `password` |
| `hashPassword` | `password: string` (private static) | `string` | Retourne le hash SHA256 du mot de passe |
| `verifyPassword` | `password: string, hash: string` (private static) | `boolean` | Compare le SHA256 de l'entrée avec le hash stocké |

## Détails

La méthode `register()` construit sa liste de messages sortants depuis `getMessagesByDomain("auth").received` et `getMessagesByDomain("socket").received`. Les messages entrants sont dérivés de `[...this.handlers.keys()]`.

Le payload `login` dans le code source n'inclut pas `deviceInfo` — seulement `email` et `password`.

Les nouveaux comptes utilisateurs sont créés avec `roles: ["user"]` par défaut.

## Flux

Voir [auth-flows.md](../../flows/auth-flows.md)
