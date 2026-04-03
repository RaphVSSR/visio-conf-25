# Pipelines

Tous les parcours utilisateur depuis le menu principal jusqu'à l'application en fonctionnement.

---

## Docker Manager

### Sous-menu

```
╔══════════════════════════════════════╗
║       Docker Manager                ║
╚══════════════════════════════════════╝

  ▶ Installation

    Launch

    Stop

    Status

    Back

  ↑/↓ Naviguer  ⏎ Sélectionner
```

### Installation

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ Demander chemin  │──▶│ git clone repo   │──▶│ verify_clone     │
│ défaut: ./       │   │ dans le chemin   │   │ ("docker")       │
└──────────────────┘   └──────────────────┘   └────────┬─────────┘
                                                       │
                                                ┌──────▼─────────┐
                                                │ Verif. deps    │
                                                │ docker+compose │
                                                └──────┬─────────┘
                                                       │
                                                ┌──────▼─────────┐
                                                │ Générer .env   │
                                                │ deux projets   │
                                                └──────┬─────────┘
                                                       │
                                                ┌──────▼─────────┐
                                                │ docker compose │
                                                │ up --build     │
                                                └──────┬─────────┘
                                                       │
                                                ┌──────▼─────────┐
                                                │ Verif. ports   │
                                                │ (depuis config) │
                                                └────────────────┘
```

| Étape | Action | En cas d'échec |
|---|---|---|
| Demander le chemin | Demande du répertoire d'installation (défaut : ./) | — |
| Clone | `git clone <repo_url>` dans le chemin choisi | Abandon avec message |
| verify_clone | Vérification de `.git/`, dossiers, `compose.yaml`, les deux `Dockerfile`s | Abandon avec message |
| Vérifier Docker | `docker --version` | Abandon, afficher le lien d'installation |
| Vérifier Compose | `docker compose version` | Abandon, afficher le lien d'installation |
| Générer .env | Par projet : si `.env.local` manquant → générer depuis le template. Si existant → demander écraser/garder, pas de réponse → garder. Pas de surcharges spécifiques à l'environnement (valeurs par défaut du template brut) | Abandon |
| Build + Démarrage | `docker compose up --build -d` | Abandon avec sortie d'erreur |
| Vérifier les ports | Vérification HTTP/TCP sur les ports définis dans `compose.yaml` / `.env` | Avertissement |

### Launch

Pré-vérification : vérifier que les conteneurs existent (`docker compose ps`). Sinon → informer l'utilisateur : "Aucun conteneur trouvé. Lancez d'abord Installation."

| Commande | Description |
|---|---|
| `docker compose up -d` | Démarrer tous les conteneurs en arrière-plan |

Sortie :
```
── Launch (Docker) ────────────────────
  [✓] MongoDB démarré sur :<port_mongo>
  [✓] Backend démarré sur :<port_back>
  [✓] Frontend démarré sur :<port_front>
───────────────────────────────────────
```

### Stop

Pré-vérification : vérifier que les conteneurs existent (`docker compose ps`). Sinon → informer l'utilisateur : "Aucun conteneur en cours d'exécution."

| Commande | Description |
|---|---|
| `docker compose down` | Arrêter et supprimer les conteneurs |

### Status

Pré-vérification : vérifier que les conteneurs existent (`docker compose ps`). Sinon → informer l'utilisateur : "Aucun conteneur trouvé. Lancez d'abord Installation."

```
── Status (Docker) ─────────────────────

  Conteneurs
  ├─ visioconf-mongo    ● running   :<port_mongo>
  ├─ visioconf-backend  ● running   :<port_back>
  └─ visioconf-frontend ● running   :<port_front>

  Ports
  ├─ :<port_front>  ● responding  (http 200)
  ├─ :<port_back>   ● responding  (http 200)
  └─ :<port_mongo>  ● open

  Environnement
  └─ .env:  backend ✓  frontend ✓

──────────────────────────────────────
```

Vérification ponctuelle, retour au sous-menu.

---

## Legacy Manager — Flux d'entrée

### Étape 1 : Sélection de l'OS

```
╔══════════════════════════════════════╗
║       Legacy Manager                ║
╚══════════════════════════════════════╝

  Sélectionnez votre plateforme :

  ▶ Linux

    Windows

    macOS

    Back

  ↑/↓ Naviguer  ⏎ Sélectionner
```

Le choix de l'OS est stocké globalement — détermine toutes les commandes spécifiques à l'OS (voir [os-matrix.md](os-matrix.md)).

### Étape 2 : Sélection de l'environnement

```
╔══════════════════════════════════════╗
║       Legacy Manager                ║
╚══════════════════════════════════════╝

  Sélectionnez votre environnement :

  ▶ Development

    Production

    Back

  ↑/↓ Naviguer  ⏎ Sélectionner
```

### Étape 3 : Sous-menu

Redirige vers le sous-menu dev ou prod ci-dessous.

### Flux

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Legacy      │────▶│ Choix OS    │────▶│ Choix Env   │
│ Manager     │     │ Lin/Win/Mac │     │ Dev / Prod  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │ Sous-menu   │
                                        │ selon env   │
                                        └─────────────┘
```

---

## Legacy Manager — Pipeline Dev

### Sous-menu

```
╔══════════════════════════════════════╗
║       Legacy Manager — Dev          ║
╚══════════════════════════════════════╝

  ▶ Installation

    Launch

    Reload

    Stop

    Status

    Back

  ↑/↓ Naviguer  ⏎ Sélectionner
```

---

### Installation

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Chemin +     │──▶│ Verif. clone │──▶│ Verif. deps  │──▶│ Générer .env  │
│ git clone    │   │ ("legacy")   │   │ Node + Mongo │   │ verbose=true  │
└──────────────┘   └──────────────┘   └──────────────┘   └──────┬───────┘
                                                                │
  ┌─────────────────────────────────────────────────────────────┘
  ▼
┌──────────────┐   ┌──────────────┐
│ npm install  │──▶│ Lancement    │
│ back + front │   │ npm run dev  │
└──────────────┘   └──────────────┘
```

### Détails des étapes

| Étape | Action | En cas d'échec |
|---|---|---|
| Demander le chemin | Demande du répertoire d'installation (défaut : ./) | — |
| Clone | `git clone <repo_url>` dans le chemin choisi | Abandon avec message |
| verify_clone | `verify_clone("legacy")` — dossiers de base + `index.ts`, `index.tsx`, les deux `tsconfig.json` | Abandon avec message |
| Vérifier Node.js | `node --version` | Abandon, afficher le lien de téléchargement |
| Vérifier MongoDB | Local ou Atlas. Si local : `mongosh --eval 'db.stats()'` ou fallback `mongo`. Si Atlas : vérifier la connexion via `MONGO_URI` du `.env.local` | Abandon, suggérer l'alternative Docker |
| Générer .env | Fonction partagée (voir [functions.md](functions.md)). Si `.env.local` existe → demander écraser/garder, pas de réponse → garder. Valeurs par défaut dev : `VERBOSE=true`, `FLUSH_DB_ON_START=true` | Abandon |
| npm install | Exécuter dans `BACKEND/` puis `FRONTENDV2/` | Abandon avec sortie d'erreur |
| Launch | Démarrer les deux via le lancement terminal spécifique à l'OS (voir [os-matrix.md](os-matrix.md)) | Afficher l'erreur |

### SSL (optionnel)

```
┌──────────────┐
│ HTTPS local  │
│ nécessaire?  │
└──────┬───────┘
       │
  ┌────┴────┐
  ▼         ▼
┌──────┐ ┌──────────┐
│ Non  │ │ Oui:     │
│ HTTP │ │ mkcert   │
│(dflt)│ │ installe?│
└──────┘ └────┬─────┘
          ┌───┴───┐
          ▼       ▼
       ┌─────┐┌────────┐
       │ Oui ││ Non:   │
       │ gen ││install?│
       └─────┘└───┬────┘
              ┌───┴───┐
              ▼       ▼
           ┌─────┐┌──────┐
           │inst.││passer│
           │+gen ││ HTTP │
           └─────┘└──────┘
```

Par défaut : Non (HTTP). `mkcert` est gratuit, open source, génère des certificats localhost de confiance.

---

### Launch

Pré-vérification : vérifier que `node_modules/` existe dans les deux projets et que les fichiers `.env.local` sont présents. Sinon → informer l'utilisateur : "Lancez d'abord Installation."

Démarrer les services dans des terminaux séparés via les commandes spécifiques à l'OS.

| Composant | Commande |
|---|---|
| Backend | `npm run dev` (dans BACKEND/) |
| Frontend | `npm start` (dans FRONTENDV2/) |

Sortie après le lancement :
```
── Launch (Dev) ───────────────────────
  [✓] Backend démarré sur :<port_back>
  [✓] Frontend démarré sur :<port_front>
  Identifiants : dev@visioconf.com | d3vV1s10C0nf
───────────────────────────────────────
```

### Reload

Pré-vérification : vérifier que les services tournent (vérification des ports). Sinon → informer l'utilisateur : "Aucun service en cours d'exécution trouvé."

Tuer les processus en cours, relancer les mêmes commandes. Arrêt des processus spécifique à l'OS (voir [os-matrix.md](os-matrix.md)).

### Stop

Pré-vérification : vérifier que les services tournent (vérification des ports). Sinon → informer l'utilisateur : "Aucun service en cours d'exécution trouvé."

Tuer les processus lancés. Retour au sous-menu.

### Status (ponctuel)

```
── Status (Dev) ────────────────────────

  Services
  ├─ Backend  (<port_back>)  ● running   pid: 12450
  ├─ Frontend (<port_front>) ● running   pid: 12467
  └─ MongoDB  (<port_mongo>) ● connected

  Ports
  ├─ :<port_front>  ● responding  (http 200)
  ├─ :<port_back>   ● responding  (http 200)
  └─ :<port_mongo>  ● open

  Environnement
  ├─ Mode:     development
  ├─ Verbose:  enabled
  ├─ Node:     v22.1.0
  └─ .env:     backend ✓  frontend ✓

  Logs (5 dernières lignes — backend)
  ├─ [14:02:31] Server started on port <port_back>
  ├─ [14:02:31] MongoDB connected
  ├─ [14:02:32] Socket.io ready
  ├─ [14:02:33] Controleur initialized
  └─ [14:02:33] 0 errors

────────────────────────────────────────
```

Exécution unique, affiche le résultat, retour au sous-menu.

---

## Legacy Manager — Pipeline Prod

### Sous-menu

```
╔══════════════════════════════════════╗
║       Legacy Manager — Prod         ║
╚══════════════════════════════════════╝

  ▶ Installation

    Launch

    Reload

    Stop

    Status

    Back

  ↑/↓ Naviguer  ⏎ Sélectionner
```

---

### Installation

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Chemin +     │──▶│ Verif. clone │──▶│ Verif. deps  │──▶│ Générer .env  │
│ git clone    │   │ ("legacy")   │   │ Node + Mongo │   │ défauts prod  │
└──────────────┘   └──────────────┘   │ + pm2 + nginx│   └──────┬───────┘
                                      └──────────────┘          │
  ┌─────────────────────────────────────────────────────────────┘
  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ npm install  │──▶│ Cmd de test? │──▶│ Lancer tests │
│ back + front │   │ chemin/passer│   │ passer si 0  │
└──────────────┘   └──────────────┘   └──────┬───────┘
                                              │
  ┌───────────────────────────────────────────┘
  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Build les 2  │──▶│ Config SSL   │──▶│ Démarrage    │
│ npm run build│   │ (voir plus   │   │ pm2 + nginx  │
└──────────────┘   │  bas)        │   └──────┬───────┘
                   └──────────────┘          │
                                       ┌──────▼───────┐
                                       │ Verif. ports │
                                       │ (depuis conf)│
                                       └──────────────┘
```

### Détails des étapes

| Étape | Action | En cas d'échec |
|---|---|---|
| Demander le chemin | Demande du répertoire d'installation (défaut : ./) | — |
| Clone | `git clone <repo_url>` dans le chemin choisi | Abandon avec message |
| verify_clone | `verify_clone("legacy")` — dossiers de base + `index.ts`, `index.tsx`, les deux `tsconfig.json` | Abandon avec message |
| Vérifier Node.js | `node --version` | Abandon, afficher le lien de téléchargement |
| Vérifier MongoDB | Local uniquement (Atlas non autorisé en prod). `mongosh --eval 'db.stats()'` ou fallback `mongo` | Abandon |
| Vérifier pm2 | `pm2 --version` | Abandon, afficher `npm install -g pm2` |
| Vérifier nginx | `nginx -v` | Abandon, afficher les instructions d'installation par OS |
| Générer .env | Fonction partagée. Sortie : `.env` (pas `.env.local`). Si `.env` existe → demander écraser/garder, pas de réponse → garder. Valeurs par défaut prod : `VERBOSE=false`, `FLUSH_DB_ON_START=false` | Abandon |
| npm install | Les deux projets | Abandon |
| Demander la commande de test | Demande de la commande/chemin de test, Entrée pour passer | — |
| Exécuter les tests | Exécuter la commande donnée. Passer silencieusement si aucun script trouvé | Abandon en cas d'échec |
| Build | `npm run build` dans les deux projets | Abandon |
| Configuration SSL | Voir ci-dessous | Avertissement, repli sur HTTP |
| Démarrage | pm2 + nginx | Afficher l'erreur |
| Vérifier les ports | Vérification HTTP/TCP sur les ports définis dans `.env` / config nginx | Avertissement |

### Demander le nom de domaine

Avant la configuration SSL, demander le domaine :

```
  Nom de domaine (ex. visioconf.example.com) : _
```

Stocké et utilisé pour certbot et la génération de la configuration nginx.

### Configuration SSL

```
┌──────────────┐
│ Cert SSL     │
│ existant?    │
└──────┬───────┘
       │
  ┌────┴────┐
  ▼         ▼
┌──────┐ ┌──────────┐
│ Oui: │ │ Pas de   │
│utili.│ │ cert     │
└──────┘ └────┬─────┘
              │
        ┌─────▼──────┐
        │ certbot    │
        │ installe?  │
        └──────┬─────┘
          ┌────┴────┐
          ▼         ▼
    ┌──────────┐ ┌──────────┐
    │ Oui:     │ │ Non:     │
    │ générer  │ │ installer│
    │ auto     │ │ certbot? │
    └──────────┘ └────┬─────┘
                 ┌────┴────┐
                 ▼         ▼
          ┌──────────┐ ┌──────────┐
          │ Oui:     │ │ Non:     │
          │ install  │ │ HTTP seul│
          │ + gen    │ │ + alerte │
          └──────────┘ └──────────┘
```

- Chemin de vérification du certificat : `/etc/letsencrypt/live/<domain>/` (Linux/macOS) ou répertoire de conf nginx (Windows)
- certbot : gratuit, génère automatiquement des certificats Let's Encrypt
- Installation de certbot par OS : `apt install certbot` / `brew install certbot` / `choco install certbot`
- Génération : `certbot --nginx -d <domain>`
- Dernier recours : poursuivre en HTTP uniquement avec un avertissement clair

---

### Launch

Pré-vérification : vérifier que le build `dist/` existe dans les deux projets et que les fichiers `.env` sont présents. Sinon → informer l'utilisateur : "Lancez d'abord Installation."

| Composant | Commande |
|---|---|
| Backend | `pm2 start dist/index.js --name visioconf-backend` |
| Frontend | nginx sert `FRONTENDV2/build/` en fichiers statiques |
| nginx | Démarrer/activer via le gestionnaire de services de l'OS |

Sortie :
```
── Launch (Prod) ──────────────────────
  [✓] pm2: visioconf-backend en ligne
  [✓] nginx: actif, sert sur :<port_http>/:<port_https>
  [✓] Ports vérifiés
───────────────────────────────────────
```

### Reload

Pré-vérification : vérifier que le processus pm2 et nginx tournent. Sinon → informer l'utilisateur : "Aucun service en cours d'exécution trouvé."

| Composant | Commande |
|---|---|
| Backend | `pm2 reload visioconf-backend` (zero-downtime) |
| nginx | `nginx -s reload` |

### Stop

Pré-vérification : vérifier que le processus pm2 et nginx tournent. Sinon → informer l'utilisateur : "Aucun service en cours d'exécution trouvé."

| Composant | Commande |
|---|---|
| Backend | `pm2 stop visioconf-backend` |
| nginx | `nginx -s stop` (demander : arrêter nginx ou le laisser tourner ?) |

### Status (temps réel, rafraîchissement 3s)

```
── Status (Prod) ── rafraîchissement : 3s ────────

  Services
  ├─ nginx    (<port_http>/<port_https>) ● active   uptime: 2h 14m
  ├─ pm2      backend  ● online      cpu: 2% | mem: 85MB | restarts: 0
  └─ MongoDB  (<port_mongo>)  ● connected

  Ports
  ├─ :<port_http>   ● responding  (http 301 → https)
  ├─ :<port_https>  ● responding  (http 200)
  ├─ :<port_back>   ● responding  (proxied)
  └─ :<port_mongo>  ● open

  Environnement
  ├─ Mode:     production
  ├─ Node:     v22.1.0
  ├─ pm2:      v5.3.0
  ├─ nginx:    v1.24.0
  └─ .env:     backend ✓  frontend ✓

  Logs (5 dernières lignes — pm2)
  ├─ [14:02:31] App online, pid: 8832
  ├─ [14:02:31] MongoDB connected
  ├─ [14:02:32] Socket.io ready
  ├─ [14:02:33] Controleur initialized
  └─ [14:02:33] 0 errors

  Ctrl+C pour quitter

────────────────────────────────────────
```

Rafraîchissement en temps réel toutes les 3 secondes. Ctrl+C retourne au sous-menu.
