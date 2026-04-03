# SPECIFICATIONS FRONTEND - Page d'Accueil VisioConf

## Vue d'ensemble

La page d'accueil de VisioConf constitue le tableau de bord principal de l'application. Elle offre une vue d'ensemble des activités de l'utilisateur, affiche les statistiques importantes, et propose des actions rapides pour accéder aux fonctionnalités principales. La page comprend également une section de contacts avec recherche intégrée.

## Composants

### 1. HomePage

**Description**: Page principale d'accueil qui affiche le tableau de bord, les activités récentes et la liste des contacts avec recherche.

| Variable/Fonction                 | Type/Variables | Description                                                                                                     |
| --------------------------------- | :------------: | --------------------------------------------------------------------------------------------------------------- |
| nomDInstance                      |     string     | Identifiant du composant ("HomePage")                                                                           |
| verbose                           |    boolean     | Contrôle l'affichage des logs du composant                                                                      |
| listeMessageEmis                  |    string[]    | Messages émis: ["users_list_request", "messages_get_request", "calls_get_request", "discuss_list_request"]      |
| listeMessageRecus                 |    string[]    | Messages reçus: ["users_list_response", "messages_get_response", "calls_get_response", "discuss_list_response"] |
| [users, setUsers]                 |     User[]     | Liste complète des utilisateurs de la plateforme                                                                |
| [error, setError]                 |     string     | Messages d'erreur à afficher                                                                                    |
| [isLoading, setIsLoading]         |    boolean     | État de chargement des données                                                                                  |
| [messages, setMessages]           |   Message[]    | Tous les messages des discussions privées                                                                       |
| [calls, setCalls]                 |     Call[]     | Liste des appels de l'utilisateur                                                                               |
| [searchQuery, setSearchQuery]     |     string     | Terme de recherche pour filtrer les contacts                                                                    |
| [filteredUsers, setFilteredUsers] | ExtendedUser[] | Liste des utilisateurs filtrés avec statut étendu                                                               |
| [discussions, setDiscussions]     |     any[]      | Liste des discussions de l'utilisateur                                                                          |
| handler                           |     object     | Gestionnaire de messages pour la communication avec le contrôleur                                               |
| handler.traitementMessage(msg)    |    Function    | Traite tous les messages reçus du contrôleur                                                                    |
| fetchData()                       |    Function    | Déclenche toutes les requêtes pour obtenir les données                                                          |
| handleSearch(e)                   |    Function    | Gère la recherche de contacts en temps réel                                                                     |
| clearSearch()                     |    Function    | Efface la recherche et réinitialise la liste des contacts                                                       |
| assignStatus(email)               |    Function    | Assigne un statut simulé (online/away/offline) à un utilisateur                                                 |
| getUnreadReceivedMessagesCount()  |    Function    | Calcule le nombre de messages non lus reçus (exclut les messages envoyés)                                       |
| getMissedCallsCount()             |    Function    | Calcule le nombre d'appels manqués                                                                              |
| getActiveUsersCount()             |    Function    | Calcule le nombre d'utilisateurs actifs (simulation 60%)                                                        |
| getRecentActivities()             |    Function    | Génère la liste des activités récentes basée sur les discussions                                                |

**Dépendances**:

- UserListAmis (composant pour la liste des contacts)
- AppContext (contexte de l'application)
- framer-motion (animations)
- lucide-react (icônes)
- Types: User, Message, Call, ExtendedUser

**Cycle de vie**:

1. S'inscrit auprès du contrôleur pour tous les messages spécifiés
2. Déclenche fetchData() pour récupérer toutes les données nécessaires
3. Met à jour automatiquement les utilisateurs filtrés lors des changements
4. Se désinscrit du contrôleur lors du démontage

### 2. ExtendedUser (Interface)

**Description**: Interface étendue de User pour inclure le statut de connexion simulé.

| Propriété |              Type               | Description                                 |
| --------- | :-----------------------------: | ------------------------------------------- |
| ...User   |              User               | Toutes les propriétés de l'interface User   |
| status    | "online" \| "away" \| "offline" | Statut de connexion simulé de l'utilisateur |

## Sections de la page

### 1. Tableau de bord (Dashboard Summary)

**Fonctionnalités**:

- Affiche 3 cartes de statistiques principales
- Messages non lus (compteur dynamique)
- Appels manqués (compteur dynamique)
- Contacts actifs (simulation)
- Animations au survol des cartes
- Actions rapides vers les principales fonctionnalités

**Cartes de statistiques**:

| Carte            |     Icône     | Couleur | Calcul                                   |
| ---------------- | :-----------: | :-----: | ---------------------------------------- |
| Messages non lus | MessageSquare | #1E3664 | Messages reçus avec status "sent"        |
| Appels manqués   |   PhoneCall   | #F59E0B | Appels avec call_type "missed"           |
| Contacts actifs  |     Users     | #10B981 | 60% des utilisateurs totaux (simulation) |

**Actions rapides**:

- Nouvelle discussion → `/discussion`
- Démarrer un appel → `/discussion`
- Partager un fichier → `/files`
- Créer une équipe → `/equipes`

### 2. Activités récentes

**Fonctionnalités**:

- Affiche les derniers messages reçus des discussions privées
- Exclut les messages envoyés par l'utilisateur courant
- Tri par date décroissante
- Limite à 10 activités maximum
- Affichage des avatars utilisateurs
- Gestion des utilisateurs inconnus

**Structure d'une activité**:

```typescript
{
  type: "message",
  user: {
    firstname: string,
    lastname: string,
    picture: string
  },
  time: string, // Format français localisé
  content: string // Contenu du message ou texte par défaut
}
```

### 3. Section Contacts

**Fonctionnalités**:

- Recherche en temps réel par nom, prénom, email, téléphone
- Filtrage automatique (exclut l'utilisateur courant)
- Effacement de la recherche avec bouton X
- Affichage du nombre de résultats
- Statuts simulés (online/away/offline)
- États vides avec messages informatifs

**Critères de recherche**:

- Prénom (firstname)
- Nom (lastname)
- Email
- Numéro de téléphone (si présent)

## Messages échangés

### Messages émis

| Message              | Format             | Exemple de contenu            | Émetteur | Récepteur                 |
| -------------------- | ------------------ | ----------------------------- | -------- | ------------------------- |
| users_list_request   | { }                | { }                           | HomePage | UsersService (backend)    |
| messages_get_request | { convId: string } | { convId: "uuid-discussion" } | HomePage | MessagesService (backend) |
| calls_get_request    | { }                | { }                           | HomePage | CallsService (backend)    |
| discuss_list_request | string             | "user_id"                     | HomePage | MessagesService (backend) |

### Messages reçus

| Message               | Format                                                     | Exemple de contenu                                                                                          | Émetteur                  | Récepteur |
| --------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------- | --------- |
| users_list_response   | { etat: boolean, users?: User[], error?: string }          | { etat: true, users: [{ id: "123", firstname: "John", lastname: "Doe", email: "john@example.com", ... }] }  | UsersService (backend)    | HomePage  |
| messages_get_response | { etat: boolean, messages?: Message[], error?: string }    | { etat: true, messages: [{ message_uuid: "456", message_content: "Hello", message_status: "sent", ... }] }  | MessagesService (backend) | HomePage  |
| calls_get_response    | { etat: boolean, calls?: Call[], error?: string }          | { etat: true, calls: [{ call_id: "789", call_type: "missed", call_duration: 0, ... }] }                     | CallsService (backend)    | HomePage  |
| discuss_list_response | { etat: boolean, messages?: Discussion[], error?: string } | { etat: true, messages: [{ discussion_uuid: "abc", discussion_members: [...], last_message: {...}, ... }] } | MessagesService (backend) | HomePage  |
