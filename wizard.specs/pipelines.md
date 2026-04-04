# Pipelines

Tous les parcours utilisateur du menu principal jusqu'à l'application en fonctionnement.

---

## Docker Manager

### Sous-menu

Sélection dev ou prod, puis : Installation, Launch, Stop, Status, Back.

### Installation

```
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│                    │   │                    │   │                    │   │                    │
│  Chemin +          │──▶│  verify_clone      │──▶│  Vérif. deps      │──▶│  Générer .env      │
│  git clone         │   │  ("docker")        │   │  docker + compose │   │  deux projets      │
│                    │   │                    │   │                    │   │                    │
└────────────────────┘   └────────────────────┘   └────────────────────┘   └─────────┬──────────┘
                                                                                     │
                                                                          ┌──────────▼─────────┐
                                                                          │                    │
                                                                          │  docker compose    │
                                                                          │  up --build -d     │
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
| Chemin | Demande du répertoire (défaut : ./) | — |
| Clone | `git clone <repo>` | Abandon |
| verify_clone | Vérification structure ("docker") | Abandon |
| Dépendances | docker + docker compose | Abandon |
| Générer .env | Deux projets | Abandon |
| Build + démarrage | `docker compose up --build -d` | Abandon |
| Vérification ports | HTTP/TCP sur les ports configurés | Avertissement |

**Dev** : `compose.yaml`, ports directs (3000, 3220, 27017)
**Prod** : `compose.prod.yaml`, reverse proxy nginx sur 80/443

### Launch

Pré-vérification des conteneurs existants. `docker compose up -d`.

### Stop

Pré-vérification des conteneurs actifs. `docker compose down`.

### Status

Rapport ponctuel : état conteneurs, réponse services (MongoDB, Backend, Frontend), fichiers `.env`.

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
