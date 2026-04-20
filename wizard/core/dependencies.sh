#!/bin/sh

wait_enter() {
    printf '%s' "  Appuyez sur Entrée..."
    read -r ignored_input
}

check_dep() {
    dep_name="$1"
    version_flag="${2:---version}"

    if command -v "$dep_name" > /dev/null 2>&1; then
        version_text=$("$dep_name" $version_flag 2>&1 | head -1)
        write_color "  [✓] $dep_name — $version_text" GREEN
        return 0
    else
        write_color "  [✗] $dep_name introuvable" RED
        return 1
    fi
}

verify_clone() {
    flow_name="$1"
    failure_flag=0
    write_color "  Vérification de la structure..." YELLOW
    base_checks='.git:Dépôt Git
BACKEND:Dossier Backend
FRONTENDV2:Dossier Frontend
BACKEND/package.json:Manifeste Backend
FRONTENDV2/package.json:Manifeste Frontend'
    flow_checks=""
    if [ "$flow_name" = "docker" ]; then
        flow_checks='compose.yaml:Fichier Compose
BACKEND/Dockerfile:Dockerfile Backend
FRONTENDV2/Dockerfile:Dockerfile Frontend'
    elif [ "$flow_name" = "legacy" ]; then
        flow_checks='BACKEND/src/index.ts:Entrée Backend
FRONTENDV2/src/index.tsx:Entrée Frontend
BACKEND/tsconfig.json:Config TS Backend
FRONTENDV2/tsconfig.json:Config TS Frontend'
    fi
    all_checks="$base_checks${flow_checks:+
$flow_checks}"
    printf '%s\n' "$all_checks" | while IFS= read -r entry_line; do
        [ -z "$entry_line" ] && continue
        target_path="${entry_line%%:*}"
        target_desc="${entry_line#*:}"
        if [ -e "$target_path" ]; then
            write_color "  [✓] $target_desc" GREEN
        else
            write_color "  [✗] Manquant : $target_path" RED
            exit 1
        fi
    done || failure_flag=1
    if [ "$failure_flag" = 1 ]; then
        printf '\n'
        write_color "  → Vérifiez que le dépôt a été cloné correctement" RED
        return 1
    fi
    return 0
}

init_project_dir() {
    default_path="$HOME"

    echo ""
    write_color "── Répertoire du projet ──" CYAN
    printf '%s' "  Chemin [$default_path] : "
    read -r user_path
    user_path="${user_path:-$default_path}"
    user_path="${user_path%/}"
    case "$user_path" in
        "~")   user_path="$HOME" ;;
        "~/"*) user_path="$HOME/${user_path#\~/}" ;;
    esac

    mkdir -p "$user_path"
    PROJECT_DIR="$(cd "$user_path" && pwd)"
    export PROJECT_DIR
    write_color "  [✓] Projet : $PROJECT_DIR" GREEN
    write_color "  [✓] Logs   : $WIZARD_LOG_DIR" GREEN
}

locate_project() {
    if [ ! -d "$PROJECT_DIR/BACKEND" ] || [ ! -d "$PROJECT_DIR/FRONTENDV2" ]; then
        write_color "  [✗] Projet non installé dans $PROJECT_DIR" RED
        write_color "  → Lancez d'abord Installation" YELLOW
        return 1
    fi
    cd "$PROJECT_DIR"
}

ensure_dep() {
    dep_name="$1"
    version_flag="${2:---version}"

    if check_dep "$dep_name" "$version_flag"; then return 0; fi

    write_color "  Installation de $dep_name..." YELLOW

    case "$dep_name" in
        pm2)    npm install -g pm2 2>&1 ;;
        docker) install_docker ;;
        node)   install_node ;;
        nginx)  install_nginx ;;
        *)      write_color "  [✗] Installation non supportée pour $dep_name" RED; return 1 ;;
    esac

    if check_dep "$dep_name" "$version_flag"; then return 0; fi

    if [ "$dep_name" = "nginx" ] && [ "$WIZARD_OS" = "windows" ]; then
        nginx_exec=$(_win_nginx_exe)
        if [ -n "$nginx_exec" ] && [ -f "$nginx_exec" ]; then
            nginx_version=$("$nginx_exec" -v 2>&1 | head -1)
            write_color "  [✓] $dep_name — $nginx_version (via $nginx_exec)" GREEN
            return 0
        fi
    fi

    write_color "  [✗] Échec de l'installation de $dep_name" RED
    return 1
}

pull_project() {
    current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
    printf '%s' "  Branche cible [Entrée = $current_branch] : "
    read -r target_branch
    if [ -n "$target_branch" ] && [ "$target_branch" != "$current_branch" ]; then
        if ! git checkout "$target_branch" 2>&1; then
            write_color "  [!] Échec checkout $target_branch — poursuite sans mise à jour" YELLOW
            return 0
        fi
    fi
    if ! git pull 2>&1; then
        write_color "  [!] Échec git pull — poursuite sans mise à jour" YELLOW
        return 0
    fi
    write_color "  [✓] Projet à jour" GREEN
    return 0
}

clone_project() {
    target_dir="$1"

    guard_cmd git "Relancez setup.sh pour installer git" || return 1

    mkdir -p "$target_dir"
    write_color "  Clonage du dépôt..." YELLOW
    if (cd "$target_dir" && git clone "$REPO_URL" . 2>&1); then
        write_color "  [✓] Dépôt cloné dans $target_dir" GREEN
        return 0
    fi

    write_color "  [✗] Échec du clonage" RED
    write_color "  → Vérifiez votre accès réseau et vos droits sur $target_dir" YELLOW
    return 1
}

verify_node_deps() {
    project_folder="${1:-.}"
    failure_flag=0

    if [ ! -d "$project_folder/BACKEND/node_modules/.bin" ] || \
       [ -z "$(ls "$project_folder/BACKEND/node_modules/.bin/" 2>/dev/null)" ]; then
        write_color "  [✗] Dépendances backend manquantes ou corrompues" RED
        write_color "  → Lancez d'abord Installation" YELLOW
        failure_flag=1
    fi

    if [ ! -d "$project_folder/FRONTENDV2/node_modules/.bin" ] || \
       [ -z "$(ls "$project_folder/FRONTENDV2/node_modules/.bin/" 2>/dev/null)" ]; then
        write_color "  [✗] Dépendances frontend manquantes ou corrompues" RED
        write_color "  → Lancez d'abord Installation" YELLOW
        failure_flag=1
    fi

    [ "$failure_flag" = 1 ] && return 1
    return 0
}

verify_prod_build() {
    project_folder="${1:-.}"
    failure_flag=0

    if [ ! -f "$project_folder/BACKEND/node_modules/tsx/dist/cli.mjs" ]; then
        write_color "  [✗] Backend tsx manquant (node_modules/tsx/dist/cli.mjs introuvable)" RED
        write_color "  → Lancez d'abord Installation" YELLOW
        failure_flag=1
    fi

    if [ ! -d "$project_folder/FRONTENDV2/build" ] || \
       [ ! -f "$project_folder/FRONTENDV2/build/index.html" ]; then
        write_color "  [✗] Build frontend manquant (build/index.html introuvable)" RED
        write_color "  → Lancez d'abord Installation" YELLOW
        failure_flag=1
    fi

    [ "$failure_flag" = 1 ] && return 1
    return 0
}

sed_inplace() {
    pattern_expr="$1"
    target_file="$2"
    if [ "$WIZARD_OS" = "macos" ]; then
        sed -i '' "$pattern_expr" "$target_file"
    else
        sed -i "$pattern_expr" "$target_file"
    fi
}

set_env_line() {
    file_path="$1"
    field_name="$2"
    field_value="$3"
    if grep -q "^${field_name}=" "$file_path" 2>/dev/null; then
        sed_inplace "s|^${field_name}=.*|${field_name}=${field_value}|" "$file_path"
    else
        echo "${field_name}=${field_value}" >> "$file_path"
    fi
}

extract_env_val() {
    file_path="$1"
    field_name="$2"
    default_val="$3"
    if [ -f "$file_path" ]; then
        found_value=$(grep "^${field_name}=" "$file_path" 2>/dev/null | head -1 | cut -d= -f2-)
        echo "${found_value:-$default_val}"
    else
        echo "$default_val"
    fi
}

pm2_get_status() {
    process_name="${1:-visioconf-backend}"
    if ! pm2 describe "$process_name" > /dev/null 2>&1; then
        echo "missing"
        return
    fi
    json_data=$(pm2 jlist 2>/dev/null)
    echo "$json_data" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4
}
