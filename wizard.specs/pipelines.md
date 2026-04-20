# Pipelines

Tous les parcours utilisateur du menu principal jusqu'à l'application en fonctionnement.

---

## Docker Manager

### Sous-menu

Sélection dev ou prod, puis : Installation, Launch, Stop, Status, Back.

L'OS est détecté au boot du wizard (`setup_platform`), pas à l'entrée du Docker Manager.

### Installation

Install ne démarre plus les conteneurs — elle ne fait que le build, puis propose `prompt_launch` qui enchaîne vers `docker_*_launch`. Les conteneurs sont donc toujours créés par la phase Launch (voir ci-dessous), jamais par Install.

```
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│                    │   │                    │   │                    │   │                    │
│  clone si .git     │──▶│  verify_clone      │──▶│  ensure_dep docker │──▶│  generate_env      │
│  absent            │   │  ("docker")        │   │  + compose version │   │  Backend + Front   │
│                    │   │                    │   │  + docker access   │   │                    │
└────────────────────┘   └────────────────────┘   └────────────────────┘   └─────────┬──────────┘
                                                                                     │
                                                                          ┌──────────▼─────────┐
                                                                          │  Vérification      │
                                                                          │  config .env       │
                                                                          │  (dev: MONGO_URI   │
                                                                          │   + REACT_APP_*)   │
                                                                          │  (prod: MONGO_URI  │
                                                                          │   + PORT)          │
                                                                          └─────────┬──────────┘
                                                                                    │
                                                                          ┌─────────▼──────────┐
                                                                          │  SSL setup         │
                                                                          │  dev:  mkcert o/N  │
                                                                          │  prod: Let's       │
                                                                          │        Encrypt ou  │
                                                                          │        skip        │
                                                                          └─────────┬──────────┘
                                                                                    │
                                                                          ┌─────────▼──────────┐
                                                                          │  docker compose    │
                                                                          │  -f <file> build   │
                                                                          │  (ne démarre pas)  │
                                                                          └─────────┬──────────┘
                                                                                    │
                                                                          ┌─────────▼──────────┐
                                                                          │  prompt_launch     │
                                                                          │  → docker_*_launch │
                                                                          │  si O, sinon       │
                                                                          │  retour au menu    │
                                                                          └────────────────────┘
```

| Étape | Action | Échec |
|---|---|---|
| Clone | `git clone <repo>` si `$PROJECT_DIR/.git` absent | Abandon |
| verify_clone | `.git/`, `BACKEND/`, `FRONTENDV2/`, `compose.yaml` (dev) ou `compose.prod.yaml` (prod), Dockerfiles | Abandon |
| Dépendances | `ensure_dep docker` + `docker compose version` + `ensure_docker_access` | Abandon |
| Générer .env | `generate_env` Backend puis Frontend | — |
| Vérif config | Champs critiques remplis | Abandon si incomplet |
| SSL | `dev_ssl_setup` (dev) ou `_prod_ssl_detect` (prod, Let's Encrypt ou skip) | — |
| Build | `docker compose build` uniquement (ne démarre pas les conteneurs) | Abandon |
| Launch | `prompt_launch` enchaîne vers `docker_*_launch` si l'utilisateur répond O | — |

**Dev** : `compose.yaml`, ports directs (3000, 3220, 27017).
**Prod** : `compose.prod.yaml`, reverse proxy nginx dans le conteneur frontend (80/443). Exige également `BACKEND/Dockerfile.prod`, `FRONTENDV2/Dockerfile.prod`, `nginx/default.prod.conf` dans le clone.

### Launch

Garde unique : `locate_project`. Puis `docker compose -f <compose> up -d` directement — la commande est idempotente (crée les conteneurs s'ils n'existent pas, les redémarre sinon), donc couvre autant le premier lancement après build qu'une relance après stop. Pas de pré-vérification de conteneurs existants : cette garde bloquait le premier lancement après install sur une machine vierge (bug historique corrigé).

Ensuite `sleep 5` puis `docker_health_report`.

### Stop

`locate_project` + garde `docker_has_containers` (abandon si rien à arrêter) + `docker compose -f <compose> down`.

### Status

`locate_project` + `docker_health_report` (un seul cliché, pas de boucle). Rapport : état conteneurs, ping MongoDB, réponse HTTP Backend/Frontend, fichiers `.env` présents, dernières lignes de logs backend.

---

## Legacy Manager

### Flux d'entrée

```
┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
│                    │      │                    │      │                    │
│  Legacy            │─────▶│  Choix OS          │─────▶│  Choix Env         │
│  Manager           │      │  Lin / Win / macOS │      │  Dev / Prod        │
│                    │      │                    │      │                    │
└────────────────────┘      └────────────────────┘      └─────────┬──────────┘
                                                                  │
                                                       ┌──────────▼─────────┐
                                                       │                    │
                                                       │  Sous-menu         │
                                                       │  selon env         │
                                                       │                    │
                                                       └────────────────────┘
```

---

### Pipeline Dev

Sous-menu : Installation, Launch, Reload, Stop, Status, Back.

#### Installation

```
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│                    │   │                    │   │                    │   │                    │
│  Chemin +          │──▶│  verify_clone      │──▶│  Vérif. deps      │──▶│  Générer .env      │
│  git clone         │   │  ("legacy")        │   │  Node.js + Mongo  │   │  verbose=true      │
│                    │   │                    │   │                    │   │                    │
└────────────────────┘   └────────────────────┘   └────────────────────┘   └─────────┬──────────┘
                                                                                     │
  ┌──────────────────────────────────────────────────────────────────────────────────┘
  ▼
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│                    │   │                    │   │                    │
│  npm install       │──▶│  SSL mkcert        │──▶│  Lancement         │
│  back + front      │   │  (optionnel)       │   │  terminaux par OS  │
│                    │   │                    │   │                    │
└────────────────────┘   └────────────────────┘   └────────────────────┘
```

| Étape | Action | Échec |
|---|---|---|
| Chemin + clone | git clone dans le répertoire choisi | Abandon |
| verify_clone | Vérification structure ("legacy") | Abandon |
| Dépendances | Node.js + MongoDB | Abandon |
| Générer .env | Surcharges dev (VERBOSE=true) | Abandon |
| npm install | Backend + Frontend | Abandon |
| SSL (optionnel) | mkcert si souhaité, sinon HTTP | — |
| Lancement | Terminaux séparés par OS | Erreur affichée |

#### SSL Dev (optionnel)

```
          ┌────────────────────┐
          │                    │
          │  HTTPS local       │
          │  nécessaire ?      │
          │                    │
          └─────────┬──────────┘
               ┌────┴────┐
               ▼         ▼
     ┌──────────────┐ ┌──────────────────┐
     │              │ │                  │
     │  Non         │ │  mkcert          │
     │  (défaut)    │ │  installé ?      │
     │              │ │                  │
     └──────────────┘ └────────┬─────────┘
                          ┌────┴────┐
                          ▼         ▼
               ┌──────────────┐ ┌──────────────────┐
               │              │ │                  │
               │  Oui :       │ │  Non :           │
               │  générer     │ │  installer ?     │
               │              │ │                  │
               └──────────────┘ └────────┬─────────┘
                                    ┌────┴────┐
                                    ▼         ▼
                         ┌──────────────┐ ┌──────────────┐
                         │              │ │              │
                         │  Installer   │ │  Passer      │
                         │  + générer   │ │  HTTP seul   │
                         │              │ │              │
                         └──────────────┘ └──────────────┘
```

#### Launch

Pré-vérification : `node_modules/` + fichiers `.env`. Démarre backend (`npm run dev`) et frontend (`npm start`) dans des terminaux séparés.

#### Reload

Tue les processus en cours, relance les mêmes commandes.

#### Stop

Tue les processus par port.

#### Status

Rapport ponctuel : MongoDB, Backend, Frontend (ports + PID), environnement, fichiers `.env`.

---

### Pipeline Prod

Sous-menu : Installation, Launch, Reload, Stop, Status, Back.

#### Installation

```
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│                    │   │                    │   │                    │   │                    │
│  Chemin +          │──▶│  verify_clone      │──▶│  Vérif. deps      │──▶│  Générer .env      │
│  git clone         │   │  ("legacy")        │   │  Node + Mongo     │   │  défauts prod      │
│                    │   │                    │   │  + pm2 + nginx    │   │                    │
└────────────────────┘   └────────────────────┘   └────────────────────┘   └─────────┬──────────┘
                                                                                     │
  ┌──────────────────────────────────────────────────────────────────────────────────┘
  ▼
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│                    │   │                    │   │                    │
│  npm install       │──▶│  npm run build     │──▶│  Config SSL        │
│  back + front      │   │  back + front      │   │  certbot           │
│                    │   │                    │   │                    │
└────────────────────┘   └────────────────────┘   └─────────┬──────────┘
                                                            │
                                                 ┌──────────▼─────────┐
                                                 │                    │
                                                 │  Démarrage         │
                                                 │  pm2 + nginx       │
                                                 │                    │
                                                 └──────────┬─────────┘
                                                            │
                                                 ┌──────────▼─────────┐
                                                 │                    │
                                                 │  Vérification      │
                                                 │  ports             │
                                                 │                    │
                                                 └────────────────────┘
```

| Étape | Action | Échec |
|---|---|---|
| Chemin + clone | git clone | Abandon |
| verify_clone | Vérification structure ("legacy") | Abandon |
| Dépendances | Node.js + MongoDB + pm2 + nginx | Abandon |
| Générer .env | Surcharges prod (VERBOSE=false) | Abandon |
| npm install | Backend + Frontend | Abandon |
| Build | `npm run build` les deux projets | Abandon |
| SSL | certbot si disponible, sinon HTTP + alerte | Avertissement |
| Démarrage | pm2 + nginx | Erreur affichée |
| Vérification ports | HTTP/TCP sur les ports configurés | Avertissement |

#### SSL Prod

```
          ┌────────────────────┐
          │                    │
          │  Certificat SSL    │
          │  existant ?        │
          │                    │
          └─────────┬──────────┘
               ┌────┴────┐
               ▼         ▼
     ┌──────────────┐ ┌──────────────────┐
     │              │ │                  │
     │  Oui :       │ │  Pas de          │
     │  utiliser    │ │  certificat      │
     │              │ │                  │
     └──────────────┘ └────────┬─────────┘
                               │
                    ┌──────────▼─────────┐
                    │                    │
                    │  certbot           │
                    │  installé ?        │
                    │                    │
                    └──────────┬─────────┘
                          ┌────┴────┐
                          ▼         ▼
               ┌──────────────┐ ┌──────────────────┐
               │              │ │                  │
               │  Oui :       │ │  Non :           │
               │  générer     │ │  installer       │
               │  auto        │ │  certbot ?       │
               │              │ │                  │
               └──────────────┘ └────────┬─────────┘
                                    ┌────┴────┐
                                    ▼         ▼
                         ┌──────────────┐ ┌──────────────┐
                         │              │ │              │
                         │  Installer   │ │  HTTP seul   │
                         │  + générer   │ │  + alerte    │
                         │              │ │              │
                         └──────────────┘ └──────────────┘
```

#### Launch

Pré-vérification : dossier `dist/` + fichiers `.env`. Démarre pm2 + nginx.

#### Reload

`pm2 reload visioconf-backend` (zéro-downtime) + `nginx -s reload`.

#### Stop

`pm2 stop visioconf-backend` + arrêt nginx (demande confirmation).

#### Status

Tableau de bord temps réel (rafraîchissement 3s, Ctrl+C pour quitter) : MongoDB, pm2 (cpu/mem/restarts), nginx, SSL, ports, environnement, logs pm2.
