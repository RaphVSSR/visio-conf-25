# Controller Layer

**Source**: `BACKEND/src/controller/controleur.js`, `BACKEND/src/controller/canalsocketio.js`

La couche contrôleur implémente un pattern de bus de messages pub/sub. `Controleur` agit comme le routeur central de messages : les services enregistrent leurs noms de messages émis et reçus, puis communiquent exclusivement via `envoie()`. `CanalSocketIO` fait le pont entre les connexions Socket.io et le contrôleur, traduisant les messages socket en messages contrôleur et inversement. Tous les services suivent la même interface implicite (`nomDInstance`, `traitementMessage`, `register`) sans classe de base partagée.

---

## Controleur

### Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| listeEmission | Object | `{ "login_response": { "AuthService": <ref> } }` | Registre associant les noms de messages émis à leurs instances de service émettrices |
| listeAbonnement | Object | `{ "login": { "AuthService": <ref> } }` | Registre associant les noms de messages souscrits à leurs instances de service abonnées |
| verbose | boolean | `false` | Flag de logging verbeux au niveau de l'instance |
| verboseall | boolean | `true` | Flag de logging verbeux global (surcharge verbose) |

### Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| inscription | emetteur (subscriber), liste_emission (string[]), liste_abonnement (string[]) | void | Enregistre les noms de messages émis et souscrits d'un service dans les deux registres |
| desincription | emetteur (subscriber), liste_emission (string[]), liste_abonnement (string[]) | void | Retire les noms de messages émis et souscrits d'un service des deux registres |
| envoie | emetteur (subscriber), t (object) | void | Route un objet message vers tous les abonnés ; itère les clés non-`id`, recherche les abonnés dans listeAbonnement, appelle leur `traitementMessage` |

---

## CanalSocketIO

### Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| controleur | Controleur | - | Référence à l'instance du contrôleur |
| nomDInstance | string | `"canalsocketio"` | Identité du service pour l'enregistrement auprès du contrôleur |
| socket | Server (socket.io) | - | Instance du serveur Socket.io |
| listeDesMessagesEmis | string[] | `["login", "register", ...]` | Tous les noms de messages émettables, provenant de ListeMessagesEmis |
| listeDesMessagesRecus | string[] | `["login_response", ...]` | Tous les noms de messages recevables, provenant de ListeMessagesRecus |
| verbose | boolean | `false` | Flag de logging verbeux au niveau de l'instance |

### Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| constructor | s (Server), c (Controleur), nom (string) | CanalSocketIO | S'enregistre auprès du contrôleur, configure les listeners socket `message`, `demande_liste`, et `disconnect` |
| traitementMessage | mesg (object) | void | Envoie le message aux sockets cibles ; si `mesg.id` est undefined diffuse à tous, sinon émet vers chaque socket ID du tableau `mesg.id` |

### Gestionnaires d'événements socket (dans le constructeur)

| Événement | Comportement |
|-----------|-------------|
| `message` | Parse le JSON, injecte `socket.id` comme `mesg.id`, transmet au contrôleur via `envoie` |
| `demande_liste` | Répond avec `donne_liste` contenant les listes d'émission et de souscription |
| `disconnect` | Met le `disturb_status` de l'utilisateur à `"offline"` via la recherche SessionManager, puis émet `socket_disconnect` à travers le contrôleur |

---

## Interface Subscriber (implicite)

Chaque service enregistré auprès du contrôleur doit satisfaire cette forme. Il n'y a pas de type TypeScript ou de classe abstraite pour l'imposer.

| Nom | Type | Description |
|-----|------|-------------|
| nomDInstance | string | Identité unique du service utilisée comme clé dans les registres du contrôleur |
| traitementMessage | (mesg: object) => void | Gestionnaire de messages appelé par le contrôleur quand un message souscrit arrive |

---

## Détails

- `controleur.js` et `canalsocketio.js` sont des fichiers JavaScript pur, pas TypeScript.
- Les objets message utilisent toujours `id` comme clé d'identifiant de socket ; toutes les autres clés sont des noms de messages avec leurs payloads.
- `envoie` ne route que les messages dont les noms apparaissent dans `listeEmission` pour l'expéditeur et `listeAbonnement` pour les récepteurs.
- CanalSocketIO s'enregistre pour TOUS les noms de messages définis dans `ListeMessages.ts` (via `ListeMessagesEmis` / `ListeMessagesRecus`), agissant comme le pont universel entre les sockets et les services.
