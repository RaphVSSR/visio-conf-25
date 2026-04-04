#!/bin/bash

legacy_prod_reload() {
    clear
    write_color "── Reload (Prod) ──" CYAN
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

    write_color "  Rechargement pm2..." YELLOW
    pm2 reload visioconf-backend 2>&1

    write_color "  Rechargement nginx..." YELLOW
    case "$WIZARD_OS" in
        linux) sudo nginx -s reload 2>&1 ;;
        windows)
            local nginx_dir
            nginx_dir=$(_win_nginx_dir)
            (cd "$nginx_dir" && "./nginx.exe" -s reload 2>&1)
            ;;
        *)     nginx -s reload 2>&1 ;;
    esac

    sleep 3

    echo ""
    prod_health_report

    read -p "  Appuyez sur Entrée..." dummy
}
