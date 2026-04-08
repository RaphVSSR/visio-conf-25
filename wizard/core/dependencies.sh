#!/bin/sh

wait_enter() {
    printf '%s' "  Appuyez sur Entrée..."
    read -r ignored
}

check_dep() {
    name="$1"
    version_flag="${2:---version}"

    if command -v "$name" > /dev/null 2>&1; then
        version_text=$("$name" $version_flag 2>&1 | head -1)
        write_color "  [✓] $name — $version_text" GREEN
        return 0
    else
        write_color "  [✗] $name introuvable" RED
        return 1
    fi
}

verify_clone() {
    flow="$1"
    failure_flag=0
    write_color "  Vérification de la structure..." YELLOW
    base_checks='.git:Dépôt Git
BACKEND:Dossier Backend
FRONTENDV2:Dossier Frontend
BACKEND/package.json:Manifeste Backend
FRONTENDV2/package.json:Manifeste Frontend'
    flow_checks=""
    if [ "$flow" = "docker" ]; then
        flow_checks='compose.yaml:Fichier Compose
BACKEND/Dockerfile:Dockerfile Backend
FRONTENDV2/Dockerfile:Dockerfile Frontend'
    elif [ "$flow" = "legacy" ]; then
        flow_checks='BACKEND/src/index.ts:Entrée Backend
FRONTENDV2/src/index.tsx:Entrée Frontend
BACKEND/tsconfig.json:Config TS Backend
FRONTENDV2/tsconfig.json:Config TS Frontend'
    fi
    all_checks="$base_checks${flow_checks:+
$flow_checks}"
    printf '%s\n' "$all_checks" | while IFS= read -r entry; do
        [ -z "$entry" ] && continue
        target_path="${entry%%:*}"
        description="${entry#*:}"
        if [ -e "$target_path" ]; then
            write_color "  [✓] $description" GREEN
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

locate_project() {
    if [ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR/BACKEND" ]; then
        cd "$PROJECT_DIR" 2>/dev/null && return 0
    fi

    write_color "  Chemin du projet non défini ou introuvable." YELLOW
    printf '%s' "  Chemin vers visio-conf-25 [./] : "
    read -r project_path
    project_path="${project_path:-./}"
    project_path="${project_path%/}"

    if resolve_project "$project_path" && [ -d "$PROJECT_DIR/BACKEND" ]; then
        cd "$PROJECT_DIR" && return 0
    fi

    write_color "  [✗] Projet introuvable dans $project_path" RED
    write_color "  → Lancez d'abord Installation" YELLOW
    return 1
}

_win_refresh_path() {
    win_path=$(powershell.exe -Command "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')" 2>/dev/null | tr -d '\r')
    if [ -n "$win_path" ]; then
        converted=$(echo "$win_path" | tr ';' '\n' | tr '\\' '/' | sed 's|^\([A-Za-z]\):|/\L\1|' | tr '\n' ':')
        export PATH="$PATH:$converted"
    fi
}

_win_install() {
    winget_id="$1"
    choco_name="$2"
    if [ -n "$winget_id" ] && command -v winget > /dev/null 2>&1; then
        winget install -e --id "$winget_id" --accept-package-agreements --accept-source-agreements 2>&1 && { _win_refresh_path; return 0; }
    fi
    if [ -n "$choco_name" ] && command -v choco > /dev/null 2>&1; then
        choco install "$choco_name" -y 2>&1 && { _win_refresh_path; return 0; }
    fi
    write_color "  [✗] Aucun gestionnaire de paquets disponible" RED
    return 1
}

_win_nginx_dir() {
    local_appdata="${LOCALAPPDATA:-}"
    [ -z "$local_appdata" ] && local_appdata=$(powershell.exe -Command 'echo $env:LOCALAPPDATA' 2>/dev/null | tr -d '\r')

    if command -v cygpath > /dev/null 2>&1; then
        local_appdata=$(cygpath -u "$local_appdata")
    else
        local_appdata=$(echo "$local_appdata" | sed 's|\\|/|g; s|^\([A-Za-z]\):|/\L\1|')
    fi

    for search_path in \
        "$local_appdata/Microsoft/WinGet/Packages/nginxinc.nginx_"*/nginx-*/ \
        "C:/tools/nginx"*/ \
        "C:/ProgramData/chocolatey/lib/nginx/tools/nginx-"*/ \
        "/c/tools/nginx"*/ \
        "/c/ProgramData/chocolatey/lib/nginx/tools/nginx-"*/ \
        "C:/nginx" \
        "/c/nginx"; do
        if [ -f "${search_path}/nginx.exe" ]; then
            real_path="${search_path%/}"
            if command -v cygpath > /dev/null 2>&1; then
                real_path=$(cygpath -u "$real_path")
            fi
            echo "$real_path"
            return 0
        fi
    done
    return 1
}

_win_nginx_exe() {
    nginx_folder=$(_win_nginx_dir) || return 1
    echo "${nginx_folder}/nginx.exe"
}

ensure_dep() {
    name="$1"
    flag="${2:---version}"

    if check_dep "$name" "$flag"; then return 0; fi

    write_color "  Installation de $name..." YELLOW

    case "$name" in
        pm2)
            npm install -g pm2 2>&1
            ;;
        docker)
            case "$WIZARD_OS" in
                linux)
                    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg 2>&1
                    echo "deb [signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs 2>/dev/null || echo jammy) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
                    sudo apt update -qq 2>&1 && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin 2>&1 && sudo systemctl start docker 2>&1
                    ;;
                windows) _win_install "Docker.DockerDesktop" "docker-desktop" ;;
                macos)
                    brew install --cask docker 2>&1
                    write_color "  Lancement de Docker Desktop..." YELLOW
                    open -a Docker 2>&1
                    sleep 5
                    write_color "  Docker Desktop peut prendre du temps à démarrer" YELLOW
                    ;;
            esac
            ;;
        node)
            case "$WIZARD_OS" in
                linux)   sudo apt update -qq 2>&1 && sudo apt install -y nodejs npm 2>&1 ;;
                windows) _win_install "OpenJS.NodeJS" "nodejs" ;;
                macos)   brew install node 2>&1 ;;
            esac
            ;;
        nginx)
            case "$WIZARD_OS" in
                linux)   sudo apt update -qq 2>&1 && sudo apt install -y nginx 2>&1 ;;
                windows) _win_install "nginxinc.nginx" "nginx" ;;
                macos)   brew install nginx 2>&1 ;;
            esac
            ;;
    esac

    if check_dep "$name" "$flag"; then return 0; fi

    if [ "$name" = "nginx" ] && [ "$WIZARD_OS" = "windows" ]; then
        nginx_exec=$(_win_nginx_exe)
        if [ -n "$nginx_exec" ] && [ -f "$nginx_exec" ]; then
            nginx_version=$("$nginx_exec" -v 2>&1 | head -1)
            write_color "  [✓] $name — $nginx_version (via $nginx_exec)" GREEN
            return 0
        fi
    fi

    write_color "  [✗] Échec de l'installation de $name" RED
    return 1
}

_mongo_check() {
    case "$WIZARD_OS" in
        linux)
            systemctl is-active mongod > /dev/null 2>&1 && echo "running" && return
            systemctl list-unit-files 2>/dev/null | grep -q mongod && echo "stopped" && return
            command -v mongod > /dev/null 2>&1 && echo "stopped" && return
            ;;
        windows)
            sc.exe query MongoDB 2>/dev/null | grep -qi "RUNNING" && echo "running" && return
            sc.exe query MongoDB 2>/dev/null | grep -qi "STOPPED" && echo "stopped" && return
            sc.exe query MongoDB > /dev/null 2>&1 && echo "stopped" && return
            ;;
        macos)
            brew services list 2>/dev/null | grep mongodb | grep -q started && echo "running" && return
            brew list mongodb-community > /dev/null 2>&1 && echo "stopped" && return
            ;;
    esac
    echo "missing"
}

_mongo_start() {
    write_color "  Démarrage du service MongoDB..." YELLOW
    case "$WIZARD_OS" in
        linux)   sudo systemctl start mongod 2>&1 ;;
        windows) powershell.exe -Command "Start-Process cmd -ArgumentList '/c','net','start','MongoDB' -Verb RunAs -Wait" 2>&1 ;;
        macos)   brew services start mongodb-community 2>&1 ;;
    esac
    sleep 2
    [ "$(_mongo_check)" = "running" ]
}

_mongo_install() {
    write_color "  Installation de MongoDB..." YELLOW
    case "$WIZARD_OS" in
        linux)
            curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg 2>&1
            echo "deb [signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs 2>/dev/null || echo jammy)/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list > /dev/null
            sudo apt update -qq 2>&1 && sudo apt install -y mongodb-org 2>&1
            ;;
        windows)
            if command -v winget > /dev/null 2>&1; then
                winget install -e --id MongoDB.Server --accept-package-agreements --accept-source-agreements 2>&1 && _win_refresh_path
            elif command -v choco > /dev/null 2>&1; then
                choco install mongodb -y 2>&1 && _win_refresh_path
            else
                write_color "  [✗] Aucun gestionnaire de paquets (winget/choco)" RED
                return 1
            fi
            ;;
        macos)
            brew tap mongodb/brew 2>&1
            brew install mongodb-community 2>&1
            ;;
    esac
}

_mongo_setup() {
    state=$(_mongo_check)

    case "$state" in
        running)
            write_color "  [✓] MongoDB local prêt" GREEN
            return 0
            ;;
        stopped)
            write_color "  [!] MongoDB installé mais non démarré" YELLOW
            if _mongo_start; then
                write_color "  [✓] MongoDB local prêt" GREEN
                return 0
            fi
            write_color "  [✗] Impossible de démarrer le service MongoDB" RED
            return 1
            ;;
        missing)
            _mongo_install || return 1
            if _mongo_start; then
                write_color "  [✓] MongoDB local prêt" GREEN
                return 0
            fi
            write_color "  [✗] MongoDB installé mais le service ne démarre pas" RED
            return 1
            ;;
    esac
}

resolve_project() {
    input_path="$1"
    real_name="$(cd "$input_path" 2>/dev/null && basename "$(pwd)")"

    if [ "$real_name" = "visio-conf-25" ]; then
        PROJECT_DIR="$input_path"
    elif [ -d "$input_path/visio-conf-25" ]; then
        PROJECT_DIR="$input_path/visio-conf-25"
    else
        PROJECT_DIR="$input_path/visio-conf-25"
        return 1
    fi

    if [ -d "$PROJECT_DIR/.git" ]; then
        write_color "  [✓] Projet détecté dans $PROJECT_DIR" GREEN
        return 0
    elif [ -d "$PROJECT_DIR" ]; then
        write_color "  [!] Dossier $PROJECT_DIR existe mais sans dépôt Git" YELLOW
        return 1
    fi

    return 1
}

clone_project() {
    target="$1"

    write_color "  Clonage du dépôt..." YELLOW
    if git clone "$REPO_URL" "$target" 2>&1; then
        write_color "  [✓] Dépôt cloné dans $target" GREEN
        return 0
    fi

    write_color "  [✗] Échec du clonage" RED
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

    if [ ! -f "$project_folder/BACKEND/dist/index.js" ]; then
        write_color "  [✗] Build backend manquant (dist/index.js introuvable)" RED
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

set_env_line() {
    file="$1"
    field="$2"
    value="$3"
    if grep -q "^${field}=" "$file" 2>/dev/null; then
        sed -i "s|^${field}=.*|${field}=${value}|" "$file"
    else
        echo "${field}=${value}" >> "$file"
    fi
}

extract_env_val() {
    file="$1"
    field="$2"
    default="$3"
    if [ -f "$file" ]; then
        value=$(grep "^${field}=" "$file" 2>/dev/null | head -1 | cut -d= -f2-)
        echo "${value:-$default}"
    else
        echo "$default"
    fi
}

nginx_is_active() {
    case "$WIZARD_OS" in
        linux)   systemctl is-active nginx > /dev/null 2>&1 ;;
        windows) tasklist 2>/dev/null | grep -qi "nginx.exe" ;;
        macos)   brew services list 2>/dev/null | grep nginx | grep -q started ;;
    esac
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
