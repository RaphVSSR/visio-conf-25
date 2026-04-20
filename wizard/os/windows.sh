#!/bin/sh

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
        write_color "  Installation via winget : $winget_id" YELLOW
        if winget install -e --id "$winget_id" --accept-package-agreements --accept-source-agreements 2>&1; then
            _win_refresh_path
            return 0
        fi
        write_color "  [!] winget a échoué pour $winget_id, essai de chocolatey..." YELLOW
    fi
    if [ -n "$choco_name" ] && command -v choco > /dev/null 2>&1; then
        write_color "  Installation via choco : $choco_name" YELLOW
        if choco install "$choco_name" -y 2>&1; then
            _win_refresh_path
            return 0
        fi
        write_color "  [✗] chocolatey a échoué pour $choco_name" RED
        return 1
    fi
    write_color "  [✗] Installation impossible — aucun gestionnaire de paquets disponible" RED
    write_color "  → Installez winget (Microsoft Store) ou chocolatey (https://chocolatey.org/install)" YELLOW
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

windows_install_docker() {
    write_color "  Installation de Docker Desktop..." CYAN
    _win_install "Docker.DockerDesktop" "docker-desktop"
}

windows_install_node() {
    write_color "  Installation de Node.js..." CYAN
    _win_install "OpenJS.NodeJS" "nodejs"
}

windows_install_nginx() {
    write_color "  Installation de Nginx..." CYAN
    _win_install "nginxinc.nginx" "nginx"
}

windows_install_mongo() {
    write_color "  Installation de MongoDB Server..." CYAN
    _win_install "MongoDB.Server" "mongodb"
}

windows_start_mongo() {
    write_color "  Démarrage du service MongoDB (élévation UAC requise)..." YELLOW
    if ! powershell.exe -Command "Start-Process cmd -ArgumentList '/c','net','start','MongoDB' -Verb RunAs -Wait" 2>&1; then
        write_color "  [✗] Échec démarrage du service MongoDB" RED
        write_color "  → Ouvrez services.msc et démarrez 'MongoDB' manuellement" YELLOW
        return 1
    fi
}

windows_start_nginx() {
    nginx_binary=$(_win_nginx_exe)
    if [ -z "$nginx_binary" ] || [ ! -f "$nginx_binary" ]; then
        write_color "  [✗] nginx.exe introuvable dans les emplacements connus" RED
        write_color "  → Vérifiez l'installation (winget/choco) ou placez nginx dans C:/nginx" YELLOW
        return 1
    fi
    nginx_base=$(dirname "$nginx_binary")
    write_color "  Démarrage de nginx depuis $nginx_base..." YELLOW
    (cd "$nginx_base" && ./nginx.exe > /dev/null 2>&1 &)
    sleep 2
    if windows_check_nginx; then
        return 0
    fi
    write_color "  [✗] nginx ne répond pas après démarrage" RED
    write_color "  → Vérifiez $nginx_base/logs/error.log" YELLOW
    return 1
}

windows_stop_nginx() {
    nginx_binary=$(_win_nginx_exe)
    if [ -z "$nginx_binary" ] || [ ! -f "$nginx_binary" ]; then
        write_color "  [✗] nginx.exe introuvable" RED
        return 1
    fi
    nginx_base=$(dirname "$nginx_binary")
    write_color "  Arrêt de nginx..." YELLOW
    (cd "$nginx_base" && ./nginx.exe -s stop 2>&1)
}

windows_reload_nginx() {
    nginx_binary=$(_win_nginx_exe)
    if [ -z "$nginx_binary" ] || [ ! -f "$nginx_binary" ]; then
        write_color "  [✗] nginx.exe introuvable" RED
        return 1
    fi
    nginx_base=$(dirname "$nginx_binary")
    write_color "  Rechargement nginx..." YELLOW
    (cd "$nginx_base" && ./nginx.exe -s reload 2>&1)
}

windows_check_mongo() {
    if sc.exe query MongoDB 2>/dev/null | grep -qi "RUNNING"; then
        echo "running"
        return
    fi
    if sc.exe query MongoDB 2>/dev/null | grep -qi "STOPPED"; then
        echo "stopped"
        return
    fi
    if sc.exe query MongoDB > /dev/null 2>&1; then
        echo "stopped"
        return
    fi
    echo "missing"
}

windows_check_nginx() {
    tasklist 2>/dev/null | grep -qi "nginx.exe"
}

windows_install_pm2() {
    if ! command -v npm > /dev/null 2>&1; then
        write_color "  [✗] npm manquant — installez node d'abord" RED
        return 1
    fi
    npm install -g pm2 2>&1 || { write_color "  [✗] Échec install pm2" RED; return 1; }
}

windows_install_mkcert() {
    _win_install "FiloSottile.mkcert" "mkcert"
}

windows_install_certbot() {
    _win_install "EFF.Certbot" "certbot"
}
