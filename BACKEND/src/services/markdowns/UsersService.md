# Documentation de la classe UsersService

## Vue d'ensemble

La classe `UsersService` est responsable de la gestion des utilisateurs dans l'application Visioconf. Elle utilise un modèle de communication basé sur des messages pour interagir avec d'autres composants du système via un contrôleur central.

## Architecture

`UsersService` s'inscrit dans une architecture orientée messages où chaque service communique via un contrôleur central qui route les messages entre les différents composants. Cette approche permet un découplage fort entre les services.

## Propriétés

| Propriété      | Description                                           |
| -------------- | ----------------------------------------------------- |
| `controleur`   | Référence au contrôleur central qui gère les messages |
| `nomDInstance` | Identifiant unique de l'instance du service           |

## Messages gérés

### Messages reçus

| Message               | Format                                                                                                             | Exemple de contenu                                                                                                                                | Émetteur                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `login_request`       | { login: string, password: string }                                                                                | { login: "john_doe", password: "securepassword123" }                                                                                              | LoginPage (frontend)    |
| `signup_request`      | { login: string, password: string, firstname: string, lastname: string, phone: string, job: string, desc: string } | { login: "jane_doe", password: "mypassword", firstname: "Jane", lastname: "Doe", phone: "0102030405", job: "Designer", desc: "Graphic designer" } | SignupPage (frontend)   |
| `users_list_request`  | No data                                                                                                            | Aucun contenu                                                                                                                                     | AnnuairePage (frontend) |
| `update_user_request` | { id?: string, firstname?: string, lastname?: string, phone?: string, job?: string, desc?: string }                | { firstname: "Alice updated" }                                                                                                                    | ProfilePage (frontend)  |
| `user_info_request`   | { user_info_request: { userId: string } }                                                                          | { user_info_request: { userId: "u1" } }                                                                                                           | AppContext (frontend)   |

### Messages émis

| Message                | Format                                                                     | Exemple de contenu                                                                                                                                                                                                                                        | Récepteur               |
| ---------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `login_response`       | { etat: boolean, token?: string }                                          | { etat: true, token: "abc123JWTtoken" }                                                                                                                                                                                                                   | LoginPage (frontend)    |
| `signup_response`      | { etat: boolean, token?: string }                                          | { etat: true, token: "def456JWTtoken" }                                                                                                                                                                                                                   | LoginPage (frontend)    |
| `users_list_response`  | { etat: boolean, users?: User[], error?: string }                          | { etat: true, users: [ { id: "u1", firstname: "Alice", lastname: "Dupont" "phone: "0123456789", job: "Developer", desc: "Programmer" }, { id: "u2", firstname: "John", lastname: "Dupont" "phone: "0123456789", job: "Developer", desc: "Programmer"} ] } | AnnuairePage (frontend) |
| `update_user_response` | { etat: boolean, newUserInfo: User, error?: string }                       | { etat: true, newUserInfo: { id: "u1", firstname: "Alice updated", lastname: "Dupont" "phone: "0123456789", job: "Developer", desc: "Programmer" } }                                                                                                      | ProfilePage (frontend)  |
| `user_info_response`   | { user_info_response: { etat: boolean, userInfo?: User, error?: string } } | { user_info_response: { etat: true, userInfo: { firstname:"Alice" } } }                                                                                                                                                                                   | AppContext (frontend)   |

## Méthodes

### `constructor(c, nom)`

Initialise le service et l'inscrit auprès du contrôleur.

**Paramètres:**

-   `c`: Le contrôleur central
-   `nom`: Le nom d'instance du service

### `traitementMessage(mesg)`

Point d'entrée principal pour le traitement des messages reçus. Cette méthode agit comme un routeur qui délègue le traitement aux méthodes spécialisées.

**Paramètres:**

-   `mesg`: Le message à traiter

**Fonctionnement:**

1. Identifie le type de message en vérifiant la présence de propriétés spécifiques
2. Délègue le traitement à la méthode spécialisée correspondante:
    - `login_request` → `handleLogin`
    - `signup_request` → `handleSignup`
    - `users_list_request` → `getUsersList`
    - `update_user_request` → `updateUser`
    - `user_info_request` → `getUserInfo`

### `handleLogin(mesg)`

Traite les demandes de connexion en vérifiant les identifiants de l'utilisateur.

**Paramètres:**

-   `mesg`: Le message contenant la demande de connexion

### `handleSignup(mesg)`

Traite les demandes d'inscription en créant un nouvel utilisateur.

**Paramètres:**

-   `mesg`: Le message contenant la demande d'inscription

### `getUsersList(mesg)`

Récupère et renvoie la liste de tous les utilisateurs.

**Paramètres:**

-   `mesg`: Le message contenant la demande de liste d'utilisateurs

### `updateUser(mesg)`

Met à jour les informations d'un utilisateur existant.

**Paramètres:**

-   `mesg`: Le message contenant la demande de mise à jour d'utilisateur

### `getUserInfo(mesg)`

Récupère et renvoie les informations d'un utilisateur spécifique.

**Paramètres:**

-   `mesg`: Le message contenant la demande d'informations sur un utilisateur

### `sha256(text)`

Génère un hash SHA-256 d'une chaîne de texte pour sécuriser les mots de passe.

**Paramètres:**

-   `text`: Le texte à hacher (généralement un mot de passe)

## Flux de travail typiques

### Authentification

1. Le client envoie un message `login_request` avec login et mot de passe
2. Le service hache le mot de passe et vérifie les identifiants
3. Si valide, génère un token JWT et répond avec `login_response` (succès)
4. Si invalide, répond avec `login_response` (échec)

### Inscription

1. Le client envoie un message `signup_request` avec les informations utilisateur
2. Le service vérifie si le login existe déjà
3. Si non, crée un nouvel utilisateur avec mot de passe haché
4. Génère un token JWT et répond avec `signup_response` (succès)
5. Si échec, répond avec `signup_response` (échec)

### Récupération de la liste des utilisateurs

1. Le client envoie un message `users_list_request` (sans données)
2. Le service récupère tous les utilisateurs de la base de données
3. Formate les données et répond avec `users_list_response`

## Sécurité

-   Les mots de passe sont hachés avec SHA-256 avant stockage
-   L'authentification utilise des tokens JWT avec expiration
-   Les réponses ne contiennent que les informations nécessaires (pas de mot de passe)
