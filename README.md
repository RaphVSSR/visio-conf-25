# VisioConf Setup Wizard

Assistant de configuration multi-plateforme pour l'application MMI-VisioConf. Gère l'installation des dépendances, la configuration d'environnement, les certificats SSL et la gestion des services sous Linux, macOS et Windows (Git Bash).

## Démarrage rapide

```bash
chmod +x setup.sh
./setup.sh
```

Utilisateurs Windows : lancer depuis **Git Bash**.

## Fonctionnalités

- **Docker Manager** — Environnements dev et prod via Docker Compose (build, lancement, arrêt, statut)
- **Legacy Manager** — Installation bare-metal avec Node.js, MongoDB, pm2, nginx
- **Générateur d'environnement** — Création interactive de fichiers `.env` pour le backend et le frontend
- **Gestion SSL** — mkcert pour le dev, certbot (Let's Encrypt) pour la prod
- **Support multi-OS** — Linux (apt), macOS (brew), Windows (winget/choco)
- **Saisie numérotée** — Tous les menus utilisent la sélection `[1-N]`
- **POSIX sh strict** — Tourne nativement sous dash, ash, bash. Suite de tests sous `wizard/tests/` (`./wizard/tests/run.sh`)

## Structure

```
setup.sh                  ← point d'entrée
wizard/
  core/
    colors.sh             ← helpers d'affichage ANSI
    menu.sh               ← rendu pick_menu + gestion input
    dependencies.sh       ← vérification des dépendances, installeurs, utilitaires partagés
  shared/
    generate-env.sh       ← générateur interactif de .env
  docker/
    manager.sh            ← sélection d'environnement Docker + rapport de santé
    dev.sh                ← flux Docker dev (compose.yaml)
    prod.sh               ← flux Docker prod (compose.prod.yaml)
  legacy/
    manager.sh            ← sélection OS + environnement
    dev/
      install.sh          ← installation des dépendances dev + setup npm
      launch.sh           ← lancement des services dans des terminaux
      reload.sh           ← redémarrage des services dev
      stop.sh             ← arrêt des processus dev
      status.sh           ← vérification ponctuelle
      ssl.sh              ← gestion des certificats mkcert
    prod/
      install.sh          ← pipeline prod complet (build + pm2 + nginx)
      launch.sh           ← démarrage pm2 + nginx
      reload.sh           ← rechargement zéro-downtime
      stop.sh             ← arrêt pm2 + nginx
      status.sh           ← tableau de bord temps réel (rafraîchissement 3s)
      ssl.sh              ← gestion des certificats certbot
wizard.specs/             ← spécifications et documentation
```

## Flux

### Docker Manager

Gestion des environnements conteneurisés. Sélection dev ou prod, puis : Installation, Lancement, Arrêt, Statut.

- **Dev** : utilise `compose.yaml`, mapping de ports direct (3000, 3220, 27017)
- **Prod** : utilise `compose.prod.yaml`, reverse proxy nginx sur 80/443

### Legacy Manager

Installation bare-metal. Sélection de l'OS (Linux/Windows/macOS), puis de l'environnement (Dev/Prod).

- **Dev** : Node.js + MongoDB, services dans des terminaux séparés, SSL mkcert optionnel
- **Prod** : Node.js + MongoDB + pm2 + nginx, SSL certbot, builds de production

### Générateur .env

Générateur interactif autonome, accessible depuis le menu principal sans entrer dans un flux.

## Spécifications

Spécifications complètes dans `wizard.specs/` :

| Fichier | Contenu |
|---|---|
| [overview.md](wizard.specs/overview.md) | Architecture, structure des fichiers, modèle de sourcing |
| [pipelines.md](wizard.specs/pipelines.md) | Tous les flux utilisateur avec diagrammes |
| [functions.md](wizard.specs/functions.md) | Signatures et comportements des fonctions principales |
| [os-matrix.md](wizard.specs/os-matrix.md) | Correspondance des commandes par OS |

## Distribution

```bash
tar czf wizard-setup.tar.gz setup.sh wizard/
```

Les destinataires décompressent et lancent `./setup.sh`. Nécessite Git Bash sous Windows.
