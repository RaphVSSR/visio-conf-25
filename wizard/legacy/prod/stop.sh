#!/bin/bash

legacy_prod_stop() {
    clear
    write_color "── Stop (Prod) ──" CYAN
    echo ""

    if ! locate_project; then
        wait_enter
        return
    fi

    if ! _prod_are_services_running; then
        write_color "  Aucun service en cours d'exécution trouvé." YELLOW
        wait_enter
        return
    fi

    write_color "  Arrêt de pm2..." YELLOW
    pm2 stop visioconf-backend 2>&1
    write_color "  [✓] pm2 arrêté" GREEN

    echo ""
    write_color "  Arrêter nginx aussi ? (o/N)" YELLOW
    local answer
    read -p "  " answer
    if [[ "${answer,,}" == "o" || "${answer,,}" == "oui" ]]; then
        case "$WIZARD_OS" in
            linux)
                sudo systemctl stop nginx 2>&1
                ;;
            windows)
                local nginx_dir
                nginx_dir=$(_win_nginx_dir)
                if [[ -z "$nginx_dir" ]]; then
                    write_color "  [✗] nginx introuvable" RED
                    return 1
                fi
                (cd "$nginx_dir" && "./nginx.exe" -s stop 2>&1)
                ;;
            macos)
                brew services stop nginx 2>&1
                ;;
        esac
        write_color "  [✓] nginx arrêté" GREEN
    else
        write_color "  → nginx laissé en fonctionnement" CYAN
    fi

    wait_enter
}

_prod_are_services_running() {
    [[ "$(pm2_get_status)" == "online" ]] && return 0

    nginx_is_active && return 0

    return 1
}
