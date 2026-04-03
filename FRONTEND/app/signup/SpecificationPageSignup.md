# SPECIFICATIONS FRONTEND - Page d'Inscription VisioConf

## Vue d'ensemble

La page d'inscription de VisioConf permet aux nouveaux utilisateurs de créer un compte dans l'application. Elle offre un formulaire complet de collecte d'informations utilisateur avec validation, gestion des erreurs, et authentification automatique après inscription réussie.

## Composants

### 1. SignupPage

**Description**: Page principale d'inscription avec redirection automatique et gestion d'état utilisateur, encapsulée dans AppContextProvider.

| Variable/Fonction | Type/Variables | Description                                    |
| ----------------- | :------------: | ---------------------------------------------- |
| router            |   NextRouter   | Instance du routeur Next.js pour la navigation |

**Dépendances**:

- AppContext (contexte de l'application via AppContextProvider)
- next/navigation (useRouter)
- js-cookie (gestion des cookies)
- next/image (composant Image)
- next/link (composant Link)
- SignupForm (composant de formulaire)

**Cycle de vie**:

1. Vérifie la présence du cookie loggedIn au montage
2. Redirige vers l'accueil si l'utilisateur est déjà connecté
3. Affiche le formulaire d'inscription si non connecté

### 2. SignupForm

**Description**: Composant de formulaire d'inscription complet avec validation et gestion des erreurs.

| Variable/Fonction               | Type/Variables | Description                                                       |
| ------------------------------- | :------------: | ----------------------------------------------------------------- |
| nomDInstance                    |     string     | Identifiant du composant ("SignupForm")                           |
| verbose                         |    boolean     | Contrôle l'affichage des logs du composant                        |
| listeMessageEmis                |    string[]    | Messages émis: ["signup_request"]                                 |
| listeMessageRecus               |    string[]    | Messages reçus: ["signup_response"]                               |
| [email, setEmail]               |     string     | Email saisi par l'utilisateur                                     |
| [password, setPassword]         |     string     | Mot de passe saisi par l'utilisateur                              |
| [firstname, setFirstname]       |     string     | Prénom saisi par l'utilisateur                                    |
| [lastname, setLastname]         |     string     | Nom de famille saisi par l'utilisateur                            |
| [phone, setPhone]               |     string     | Numéro de téléphone saisi par l'utilisateur                       |
| [job, setJob]                   |     string     | Poste/métier saisi par l'utilisateur                              |
| [desc, setDesc]                 |     string     | Description personnelle saisie par l'utilisateur                  |
| [showPassword, setShowPassword] |    boolean     | État d'affichage du mot de passe (visible/masqué)                 |
| [error, setError]               |     string     | Message d'erreur générique                                        |
| [loading, setLoading]           |    boolean     | État de chargement pendant l'inscription                          |
| [signupError, setSignupError]   |     string     | Message d'erreur spécifique à l'inscription                       |
| handler                         |     object     | Gestionnaire de messages pour la communication avec le contrôleur |
| handler.traitementMessage(msg)  |    Function    | Traite les réponses d'inscription du backend                      |
| handleSubmit(e)                 |    Function    | Gère la soumission du formulaire d'inscription                    |

**Dépendances**:

- AppContext (contexte de l'application)
- lucide-react (icônes Eye, EyeOff)
- next/navigation (useRouter)
- js-cookie (gestion des cookies)

**Cycle de vie**:

1. S'inscrit auprès du contrôleur pour les messages d'inscription
2. Redirige si l'utilisateur est déjà connecté
3. Gère la soumission du formulaire et les réponses
4. Se désinscrit du contrôleur lors du démontage

## Sections de la page

### 1. En-tête

**Fonctionnalités**:

- Logo de l'université (logo_Univ_grand.svg)
- Dimensions: 340x100 pixels
- Priorité de chargement activée

### 2. Formulaire d'inscription

**Champs requis**:

| Champ        | Type     | Validation          | Layout        | Placeholder/Label |
| ------------ | -------- | ------------------- | ------------- | ----------------- |
| Prénom       | text     | Champ requis        | Ligne 1 (1/2) | "Prénom:"         |
| Nom          | text     | Champ requis        | Ligne 1 (2/2) | "Nom:"            |
| Email        | email    | Format email requis | Ligne 2       | "Email:"          |
| Mot de passe | password | Champ requis        | Ligne 3       | "Mot de passe:"   |
| Téléphone    | text     | Champ requis        | Ligne 4 (1/2) | "Téléphone:"      |
| Job          | text     | Champ requis        | Ligne 4 (2/2) | "Job:"            |
| Description  | text     | Champ requis        | Ligne 5       | "Description:"    |

**Fonctionnalités**:

- Layout en grille avec champs groupés par ligne
- Validation HTML5 native
- Bouton de révélation du mot de passe avec icônes Eye/EyeOff
- Gestion des états d'erreur avec styles visuels
- Bouton de soumission avec état de chargement
- Messages d'erreur contextuels

### 3. Lien de connexion

**Fonctionnalités**:

- Lien vers la page de connexion (/login)
- Texte: "Déjà un compte ?"

## Gestion de l'inscription

### 1. Processus d'inscription

**Étapes**:

1. Validation des champs côté client
2. Envoi de la requête d'inscription au backend
3. Réception de la réponse avec token
4. Stockage sécurisé du token (cookies + localStorage)
5. Redirection automatique vers la page d'accueil

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

| Message        | Format                                                                                                             | Exemple de contenu                                                                                                                                                  | Émetteur   | Récepteur              |
| -------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------- |
| signup_request | { email: string, password: string, firstname: string, lastname: string, phone: string, job: string, desc: string } | { email: "user@example.com", password: "motdepasse123", firstname: "Jean", lastname: "Dupont", phone: "0123456789", job: "Développeur", desc: "Passionné de tech" } | SignupForm | UsersService (backend) |

### Messages reçus

| Message         | Format                            | Exemple de contenu                                               | Émetteur     | Récepteur  |
| --------------- | --------------------------------- | ---------------------------------------------------------------- | ------------ | ---------- |
| signup_response | { etat: boolean, token?: string } | { etat: true, token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." } | UsersService | SignupForm |
| signup_response | { etat: boolean }                 | { etat: false }                                                  | UsersService | SignupForm |
