# Fonctions partagées

Fonctions réutilisées dans toutes les sections du wizard.

---

## arrow_menu

Menu navigable par flèches.

| Param | Type | Description |
|---|---|---|
| items | string[] | Labels des options |
| --style | boxes/lines | Boîtes bordées (menu principal) ou lignes colorées (sous-menus) |
| --colors | string | Couleurs par option, séparées par virgules |

Comportement : marqueur `▶` + couleur sur l'option active, ↑/↓ pour naviguer (boucle), Entrée pour sélectionner. Retourne l'index dans `$MENU_RESULT`.

---

## generate_env

Générateur interactif de `.env` depuis un template.

| Param | Type | Description |
|---|---|---|
| template | path | Fichier `.env.template` source |
| output | path | Fichier cible |
| label | string | Label d'affichage ("Backend", "Frontend") |
| defaults | map | Surcharges de valeurs par défaut (optionnel) |

Comportement :
1. Vérifie que le template existe
2. Si le fichier cible existe → demande écraser/garder (défaut : garder)
3. Parse le template, extrait les paires clé=valeur
4. Pour chaque clé : propose la valeur par défaut, accepte l'input utilisateur
5. Écrit le résultat

Surcharges dev : `VERBOSE=true`, `FLUSH_DB_ON_START=true`
Surcharges prod : `VERBOSE=false`, `FLUSH_DB_ON_START=false`

---

## write_color

Sortie colorée via codes ANSI (`tput setaf`).

| Param | Type | Description |
|---|---|---|
| text | string | Texte à afficher |
| color | string | RED, GREEN, YELLOW, BLUE, CYAN, WHITE |

---

## check_dep

Vérifie qu'un outil CLI est disponible et affiche sa version.

| Param | Type | Description |
|---|---|---|
| name | string | Nom de l'outil (node, mongosh, pm2, nginx, etc.) |

Sortie : `[✓] Node.js v22.1.0` ou `[✗] pm2 non trouvé`

---

## verify_clone

Vérifie la structure du projet cloné en deux phases.

| Param | Type | Description |
|---|---|---|
| flow | string | `"docker"` ou `"legacy"` |

**Phase 1 (toujours)** : `.git/`, `BACKEND/`, `FRONTENDV2/`, les deux `package.json`

**Phase 2 Docker** : `compose.yaml`, les deux `Dockerfile`

**Phase 2 Legacy** : `BACKEND/src/index.ts`, `FRONTENDV2/src/index.tsx`, les deux `tsconfig.json`

Échec sur n'importe quelle vérification → abandon avec message.
