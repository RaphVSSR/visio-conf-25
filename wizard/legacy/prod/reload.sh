#!/bin/sh

legacy_prod_reload() {
    clear
    write_color "── Reload (Prod) ──" CYAN
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

    write_color "  Rechargement pm2..." YELLOW
    pm2 reload visioconf-backend 2>&1

    write_color "  Rechargement nginx..." YELLOW
    case "$WIZARD_OS" in
        linux) sudo nginx -s reload 2>&1 ;;
        windows)
            nginx_folder=$(_win_nginx_dir)
            if [ -z "$nginx_folder" ]; then
                write_color "  [✗] nginx introuvable" RED
                return 1
            fi
            (cd "$nginx_folder" && "./nginx.exe" -s reload 2>&1)
            ;;
        macos) nginx -s reload 2>&1 ;;
    esac

    sleep 3

    echo ""
    prod_health_report

    wait_enter
}
