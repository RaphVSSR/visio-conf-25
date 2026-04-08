# Wizard — Vue d'ensemble

Assistant de configuration pour MMI-VisioConf. Script unique : `setup.sh` (Linux/macOS/Git Bash sous Windows).

Le wizard est écrit en POSIX sh strict (+ `local` autorisé) et tourne nativement sous dash, ash, bash.

## Distribution

```sh
# Côté dev — empaqueter
tar czf wizard-setup.tar.gz setup.sh wizard/

# Côté destinataire — extraire et lancer
tar xzf wizard-setup.tar.gz
./setup.sh
```

Nécessite Git Bash sous Windows. Natif sous Linux/macOS.

## Menu principal

Saisie numérotée `[1-N]` puis Entrée pour sélectionner. En-tête ASCII art.

| Option | Description |
|---|---|
| Docker Manager | Installation/lancement/arrêt des conteneurs via Docker Compose |
| Legacy Manager | Installation complète dev ou prod sans Docker |
| Generate .env | Générateur interactif de fichiers `.env` |
| Quit | Quitter l'assistant |

## Structure

```
setup.sh                  ← point d'entrée unique
wizard/
  core/
    colors.sh             ← write_color, constantes ANSI
    menu.sh               ← pick_menu, rendu + gestion input
    dependencies.sh       ← check_dep, installeurs, utilitaires partagés
  shared/
    generate-env.sh       ← generate_env
  docker/
    manager.sh            ← sélection dev/prod + health report
    dev.sh                ← flux Docker dev (compose.yaml)
    prod.sh               ← flux Docker prod (compose.prod.yaml)
  legacy/
    manager.sh            ← sélection OS + environnement
    dev/
      install.sh          ← pipeline d'installation dev
      launch.sh           ← démarrage services dev
      reload.sh           ← redémarrage services dev
      stop.sh             ← arrêt processus dev
      status.sh           ← vérification ponctuelle
      ssl.sh              ← gestion certificats mkcert
    prod/
      install.sh          ← pipeline d'installation prod
      launch.sh           ← démarrage pm2 + nginx
      reload.sh           ← rechargement zéro-downtime
      stop.sh             ← arrêt pm2 + nginx
      status.sh           ← tableau de bord temps réel (3s)
      ssl.sh              ← gestion certificats certbot
```

## Architecture shell

### Sourcing

`setup.sh` est le seul fichier exécuté. Il charge `core/` et `shared/` au démarrage, puis source dynamiquement le module choisi par l'utilisateur.

```
setup.sh
  → source core/ + shared/
  → menu principal
  → choix utilisateur
  → source le module (docker/manager.sh, legacy/manager.sh, etc.)
  → retour au menu
```

### Portée des variables

Tous les fichiers sourcés partagent la même session shell. Les utilitaires `core/` sont disponibles partout. Les fichiers spécifiques utilisent `local` pour éviter les collisions.

## Index des specs

| Spec | Contenu |
|---|---|
| [pipelines.md](pipelines.md) | Flux Docker + Legacy (dev + prod) |
| [functions.md](functions.md) | pick_menu, generate_env, write_color, check_dep, verify_clone |
| [os-matrix.md](os-matrix.md) | Correspondance des commandes par OS |
