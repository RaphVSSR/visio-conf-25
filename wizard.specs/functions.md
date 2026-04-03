# Fonctions partagées

Fonctions réutilisées dans toutes les sections du wizard et les deux scripts (sh + ps1).

---

## arrow_menu

Menu navigable avec les flèches. Utilisé par chaque menu du wizard.

| Param | Type | Description |
|---|---|---|
| items | string[] | Labels des options du menu |
| title | string | Texte d'en-tête (optionnel) |

**Comportement :**
- **Menu principal** : options dans des boîtes bordées avec padding
- **Sous-menus** : lignes colorées sans bordures ni padding, léger espacement entre les lignes
- Marqueur `▶` sur l'option active + couleur surlignée
- Flèches ↑/↓ pour naviguer, Entrée pour sélectionner
- Retourne l'index sélectionné
- Boucle (dernier → premier, premier → dernier)

---

## generate_env

Générateur interactif de `.env` depuis un template. Appelé par :
- Installation du Docker Manager
- Installation du Legacy Manager (dev ou prod)
- Option "Generate .env files" du menu principal

| Param | Type | Description |
|---|---|---|
| template | path | Fichier source `.env.template` |
| output | path | Fichier env cible — `.env.local` (dev/docker) ou `.env` (prod) |
| label | string | Label d'affichage (ex: "Backend", "Frontend") |
| defaults | map | Valeurs par défaut surchargées par env (optionnel) |

**Comportement :**
1. Vérifier que le fichier template existe, abandonner sinon
2. Vérifier si le fichier de sortie existe déjà :
   - **N'existe pas** → procéder à la génération
   - **Existe** → demander à l'utilisateur : écraser ou garder ? Si pas de réponse (input vide / timeout) → garder l'existant, passer la génération
3. Parser le template : ignorer les commentaires d'en-tête, extraire les paires clé=valeur
4. Préserver les lignes vides et les lignes de commentaires telles quelles dans la sortie
5. Pour chaque clé=valeur : extraire la valeur par défaut + indication optionnelle (après ` #`), demander l'input utilisateur
6. Input vide → utiliser la valeur par défaut (ou surcharge depuis la map `defaults`)
7. Écrire le résultat dans le fichier de sortie

**Surcharges dev :** `VERBOSE=true`, `VERBOSE_LVL=3`, `FLUSH_DB_ON_START=true`
**Surcharges prod :** `VERBOSE=false`, `FLUSH_DB_ON_START=false`

**Mode autonome** (option "Generate .env files" du menu principal) :
Pas de surcharges spécifiques à l'environnement. Exécute séquentiellement :
1. `generate_env("BACKEND/.env.template", "BACKEND/.env.local", "Backend")`
2. `generate_env("FRONTENDV2/.env.template", "FRONTENDV2/.env.local", "Frontend")`

---

## write_color

Sortie colorée dans le terminal.

| Param | Type | Description |
|---|---|---|
| text | string | Texte à afficher |
| color | string | Nom de la couleur (Red, Green, Yellow, Blue, Cyan, White) |

**Implémentation :**
- Bash : codes `tput setaf`
- PowerShell : `Write-Host -ForegroundColor`

---

## check_dependency

Vérifier qu'un outil CLI est disponible.

| Param | Type | Description |
|---|---|---|
| name | string | Nom de l'outil (node, mongosh, pm2, nginx, etc.) |
| version_flag | string | Flag pour obtenir la version (défaut : `--version`) |

**Comportement :**
1. Vérifier que la commande existe
2. Exécuter le flag de version, capturer la sortie
3. Retourner : disponible (bool) + version (string)

Format de sortie :
```
  [✓] Node.js v22.1.0
  [✗] pm2 not found — install: npm install -g pm2
```

---

## verify_clone

Vérifier que la structure du projet est valide. S'exécute en deux phases : vérifications de base (toujours), puis vérifications spécifiques au flux selon la sélection utilisateur.

| Param | Type | Description |
|---|---|---|
| flow | string | `"docker"` ou `"legacy"` — détermine quels fichiers principaux vérifier |

### Phase 1 — Base (toujours)

| # | Vérification | Cible |
|---|---|---|
| 1 | Dépôt Git | Répertoire `.git/` |
| 2 | Dossier Backend | Répertoire `BACKEND/` |
| 3 | Dossier Frontend | Répertoire `FRONTENDV2/` |
| 4 | Manifeste deps Backend | `BACKEND/package.json` |
| 5 | Manifeste deps Frontend | `FRONTENDV2/package.json` |

### Phase 2 — Fichiers principaux spécifiques au flux

**Flux Docker** (`flow = "docker"`) :

| # | Vérification | Cible | Rôle |
|---|---|---|---|
| 6 | Fichier Compose | `compose.yaml` | Orchestre tous les services |
| 7 | Image Backend | `BACKEND/Dockerfile` | Build du conteneur backend |
| 8 | Image Frontend | `FRONTENDV2/Dockerfile` | Build du conteneur frontend |

**Flux Legacy** (`flow = "legacy"`) :

| # | Vérification | Cible | Rôle |
|---|---|---|---|
| 6 | Entrée Backend | `BACKEND/src/index.ts` | Bootstrap du serveur |
| 7 | Entrée Frontend | `FRONTENDV2/src/index.tsx` | Point de montage React |
| 8 | Config TS Backend | `BACKEND/tsconfig.json` | Compilation TypeScript |
| 9 | Config TS Frontend | `FRONTENDV2/tsconfig.json` | Compilation TypeScript |

### Comportement

1. Exécuter les vérifications Phase 1 séquentiellement, afficher chaque résultat
2. Exécuter les vérifications Phase 2 pour le flux donné
3. Si une vérification échoue → afficher tous les résultats, puis abandonner avec message actionnable
4. Si tout passe → retourner succès

Format de sortie :
```
  [✓] Git repository detected
  [✓] Folder structure valid
  [✓] Main files verified (docker)
```

En cas d'échec :
```
  [✓] Git repository detected
  [✓] Folder structure valid
  [✗] Missing: BACKEND/Dockerfile
      → Ensure you cloned the full repository
```
