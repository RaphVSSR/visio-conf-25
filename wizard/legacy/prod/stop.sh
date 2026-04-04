#!/bin/bash

legacy_prod_stop() {
    clear
    write_color "── Stop (Prod) ──" CYAN
    echo ""

    if ! locate_project; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    if ! _prod_are_services_running; then
        write_color "  Aucun service en cours d'exécution trouvé." YELLOW
        read -p "  Appuyez sur Entrée..." dummy
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

    read -p "  Appuyez sur Entrée..." dummy
}

_prod_are_services_running() {
    if pm2 describe visioconf-backend > /dev/null 2>&1; then
        local pm2_state
        pm2_state=$(pm2 jlist 2>/dev/null | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
        [[ "$pm2_state" == "online" ]] && return 0
    fi

    case "$WIZARD_OS" in
        linux)   systemctl is-active nginx > /dev/null 2>&1 && return 0 ;;
        windows) tasklist 2>/dev/null | grep -qi "nginx" && return 0 ;;
        macos)   brew services list 2>/dev/null | grep nginx | grep -q started && return 0 ;;
    esac

    return 1
}
