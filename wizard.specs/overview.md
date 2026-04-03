# MMI-VisioConf Wizard — Vue d'ensemble

Assistant de configuration pour MMI-VisioConf. Script unique : `setup.sh` (Linux/macOS/Git Bash sous Windows).

## Distribution

Distribué sous forme d'archive `.tar.gz` via FTP.

```sh
# Dev side — pack for distribution
tar czf wizard-setup.tar.gz setup.sh wizard/

# Recipient side — unpack and run
tar xzf wizard-setup.tar.gz
./setup.sh
```

Nécessite Git Bash sous Windows (fournit `bash` et `tar`). Natif sous Linux/macOS.

## Menu Principal

Navigation par flèches, Entrée pour sélectionner. En-tête en ASCII art.

```
  ███╗   ███╗███╗   ███╗██╗
  ████╗ ████║████╗ ████║██║
  ██╔████╔██║██╔████╔██║██║
  ██║╚██╔╝██║██║╚██╔╝██║██║
  ██║ ╚═╝ ██║██║ ╚═╝ ██║██║
  ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝ VisioConf


  ┌────────────────────────────────────────┐
  │                                        │
  │  ▶ Docker Manager (recommended)        │
  │                                        │
  └────────────────────────────────────────┘

  ┌────────────────────────────────────────┐
  │                                        │
  │    Legacy Manager                      │
  │                                        │
  └────────────────────────────────────────┘

  ┌────────────────────────────────────────┐
  │                                        │
  │    Generate .env files                 │
  │                                        │
  └────────────────────────────────────────┘

  ┌────────────────────────────────────────┐
  │                                        │
  │    Quit                                │
  │                                        │
  └────────────────────────────────────────┘

  ↑/↓ Navigate  ⏎ Select
```

Option active : marqueur `▶` + couleur surlignée.

| Section | Description |
|---|---|
| Docker Manager | Clone + installation/lancement/arrêt des conteneurs via docker compose |
| Legacy Manager | Installation complète dev ou prod sans Docker |
| Generate .env | Générateur interactif de fichiers .env partagé |
| Quit | Quitter l'assistant |

Tous les menus utilisent la sélection par flèches. Aucune saisie numérique.

---

## Structure des Fichiers

Script shell uniquement (`.sh`). Les utilisateurs Windows passent par Git Bash / WSL.

```
visio-conf-25/
├── setup.sh                  ← point d'entrée, menu principal uniquement
└── wizard/
    ├── core/
    │   ├── colors.sh         ← write_color, constantes de couleur
    │   ├── menu.sh           ← arrow_menu rendu + gestion input
    │   └── dependencies.sh   ← check_dependency, verify_clone
    ├── shared/
    │   └── generate-env.sh   ← fonction generate_env
    ├── docker/
    │   └── manager.sh        ← sous-menu docker, commandes compose
    └── legacy/
        ├── entry.sh          ← sélection OS + environnement
        ├── dev/
        │   ├── install.sh    ← pipeline d'installation dev
        │   ├── launch.sh     ← démarrage services dev
        │   ├── reload.sh     ← redémarrage services dev
        │   ├── stop.sh       ← arrêt processus dev
        │   └── status.sh     ← vérification statut ponctuelle
        └── prod/
            ├── install.sh    ← pipeline d'installation prod
            ├── launch.sh     ← démarrage pm2 + nginx
            ├── reload.sh     ← rechargement pm2 + nginx
            ├── stop.sh       ← arrêt pm2 + nginx
            ├── status.sh     ← tableau de bord en temps réel
            └── ssl.sh        ← vérification cert SSL, flux certbot
```

Chaque fichier a une seule responsabilité. Si un fichier commence à gérer deux préoccupations, le découper — peu importe le nombre de lignes.

---

## Architecture Shell

### Point d'Entrée Unique, Modules Sourcés

`setup.sh` est le seul fichier que l'utilisateur exécute. Il charge les utilitaires du noyau au démarrage, puis source dynamiquement le module correspondant quand l'utilisateur choisit une option du menu.

```
L'utilisateur lance setup.sh
  → source core/ + shared/ (utilitaires disponibles globalement)
  → affiche le menu principal
  → l'utilisateur choisit une option
  → source le module correspondant (docker/manager.sh, legacy/entry.sh, etc.)
  → le module s'exécute, retourne
  → retour au menu principal
```

### Fonctionnement du Sourcing

```sh
#!/bin/bash

WIZARD_DIR="$(dirname "$0")/wizard"

source "$WIZARD_DIR/core/colors.sh"
source "$WIZARD_DIR/core/menu.sh"
source "$WIZARD_DIR/core/dependencies.sh"
source "$WIZARD_DIR/shared/generate-env.sh"

# main menu loop
while true; do
    clear
    show_header
    choice=$(arrow_menu "Docker Manager (recommended)" "Legacy Manager" "Generate .env files" "Quit")

    case $choice in
        0) source "$WIZARD_DIR/docker/manager.sh" ;;
        1) source "$WIZARD_DIR/legacy/entry.sh" ;;
        2) run_generate_env ;;
        3) exit 0 ;;
    esac
done
```

### Portée des Variables

Tous les fichiers sourcés partagent la même session shell. Les variables définies dans `core/colors.sh` sont visibles dans `legacy/dev/launch.sh`. Les utilitaires du noyau sont disponibles globalement. Les fichiers spécifiques à un flux utilisent des variables locales ou la portée de fonction pour éviter les collisions.

### Exemple de Flux d'Exécution

L'utilisateur sélectionne Legacy Manager > Development > Installation :

```
setup.sh
  → source legacy/entry.sh     (sélection OS + environnement)
    → source legacy/dev/install.sh  (exécute le pipeline d'installation)
      → appelle verify_clone("legacy")   (depuis core/dependencies.sh)
      → appelle check_dependency("node")  (depuis core/dependencies.sh)
      → appelle generate_env(...)         (depuis shared/generate-env.sh)
      → npm install + lancement
```

Chaque étape utilise des fonctions déjà chargées au démarrage. Les fichiers plus profonds ne sourcent jamais eux-mêmes les utilitaires du noyau.

---

## Index des Specs

| Spec | Contenu |
|---|---|
| [pipelines.md](pipelines.md) | Pipelines Docker + Legacy entry + Dev + Prod |
| [functions.md](functions.md) | arrow_menu, generate_env, write_color, check_dependency, verify_clone |
| [os-matrix.md](os-matrix.md) | Correspondance des commandes par OS |
