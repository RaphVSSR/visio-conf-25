# SPECIFICATIONS FRONTEND - Page de Connexion VisioConf

## Vue d'ensemble

La page de connexion de VisioConf permet aux utilisateurs de s'authentifier dans l'application. Elle offre une interface sécurisée avec gestion des erreurs, validation des champs, et redirection automatique vers la page d'accueil après connexion réussie.

## Composants

### 1. LoginPage

**Description**: Page principale de connexion avec redirection automatique et gestion d'état utilisateur.

| Variable/Fonction | Type/Variables | Description                                           |
| ----------------- | :------------: | ----------------------------------------------------- |
| router            |   NextRouter   | Instance du routeur Next.js pour la navigation        |
| currentUser       |   User\|null   | Utilisateur actuellement connecté (depuis AppContext) |

**Dépendances**:

- AppContext (contexte de l'application)
- next/navigation (useRouter)
- js-cookie (gestion des cookies)
- next/image (composant Image)
- next/link (composant Link)
- LoginForm (composant de formulaire)

**Cycle de vie**:

1. Vérifie la présence d'un token au montage
2. Redirige vers l'accueil si l'utilisateur est déjà connecté
3. Affiche le formulaire de connexion si non connecté

### 2. LoginForm

**Description**: Composant de formulaire de connexion avec validation et gestion des erreurs.

| Variable/Fonction               | Type/Variables | Description                                                       |
| ------------------------------- | :------------: | ----------------------------------------------------------------- |
| nomDInstance                    |     string     | Identifiant du composant ("LoginForm")                            |
| verbose                         |    boolean     | Contrôle l'affichage des logs du composant                        |
| listeMessageEmis                |    string[]    | Messages émis: ["login_request"]                                  |
| listeMessageRecus               |    string[]    | Messages reçus: ["login_response"]                                |
| [email, setEmail]               |     string     | Email saisi par l'utilisateur                                     |
| [password, setPassword]         |     string     | Mot de passe saisi par l'utilisateur                              |
| [showPassword, setShowPassword] |    boolean     | État d'affichage du mot de passe (visible/masqué)                 |
| [error, setError]               |     string     | Message d'erreur générique                                        |
| [loading, setLoading]           |    boolean     | État de chargement pendant la connexion                           |
| [loginError, setLoginError]     |     string     | Message d'erreur spécifique à la connexion                        |
| handler                         |     object     | Gestionnaire de messages pour la communication avec le contrôleur |
| handler.traitementMessage(msg)  |    Function    | Traite les réponses de connexion du backend                       |
| handleSubmit(e)                 |    Function    | Gère la soumission du formulaire de connexion                     |

**Dépendances**:

- AppContext (contexte de l'application)
- lucide-react (icônes Eye, EyeOff)
- next/navigation (useRouter)
- js-cookie (gestion des cookies)

**Cycle de vie**:

1. S'inscrit auprès du contrôleur pour les messages de connexion
2. Redirige si l'utilisateur est déjà connecté
3. Gère la soumission du formulaire et les réponses
4. Se désinscrit du contrôleur lors du démontage

## Sections de la page

### 1. En-tête

**Fonctionnalités**:

- Logo de l'université (logo_Univ_grand.svg)
- Dimensions: 340x100 pixels
- Priorité de chargement activée

### 2. Formulaire de connexion

**Champs requis**:

| Champ        | Type     | Validation          | Placeholder/Label |
| ------------ | -------- | ------------------- | ----------------- |
| Email        | email    | Format email requis | "Email:"          |
| Mot de passe | password | Champ requis        | "Mot de passe:"   |

**Fonctionnalités**:

- Validation HTML5 native
- Bouton de révélation du mot de passe avec icônes Eye/EyeOff
- Gestion des états d'erreur avec styles visuels
- Bouton de soumission avec état de chargement
- Messages d'erreur contextuels

### 3. Lien d'inscription

**Fonctionnalités**:

- Lien vers la page d'inscription (/signup)
- Texte: "Pas encore de compte ?"

## Gestion de l'authentification

### 1. Processus de connexion

**Étapes**:

1. Validation des champs côté client
2. Envoi de la requête de connexion au backend
3. Réception de la réponse avec token
4. Stockage sécurisé du token (cookies + localStorage)
5. Redirection vers la page d'accueil

### 2. Stockage des tokens

**Configuration des cookies**:

```typescript
Cookies.set("token", token, {
  secure: window.location.protocol === "https:",
  sameSite: "lax",
  expires: 7, // 7 jours
  path: "/",
});
```

**Stockage de secours**:

- LocalStorage utilisé comme fallback
- Gestion d'erreur pour les environnements restreints

## Messages échangés

### Messages émis

| Message       | Format                              | Exemple de contenu                                       | Émetteur  | Récepteur              |
| ------------- | ----------------------------------- | -------------------------------------------------------- | --------- | ---------------------- |
| login_request | { email: string, password: string } | { email: "user@example.com", password: "motdepasse123" } | LoginForm | UsersService (backend) |

### Messages reçus

| Message        | Format                            | Exemple de contenu                                               | Émetteur     | Récepteur |
| -------------- | --------------------------------- | ---------------------------------------------------------------- | ------------ | --------- |
| login_response | { etat: boolean, token?: string } | { etat: true, token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." } | UsersService | LoginForm |
| login_response | { etat: boolean }                 | { etat: false }                                                  | UsersService | LoginForm |
