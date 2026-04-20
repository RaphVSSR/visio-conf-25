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

    reload_nginx

    sleep 3

    echo ""
    prod_health_report

    wait_enter
}
