#!/bin/sh

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
    printf '%s' "  "
    read -r answer
    answer_lower=$(echo "$answer" | tr 'A-Z' 'a-z')
    if [ "$answer_lower" = "o" ] || [ "$answer_lower" = "oui" ]; then
        if stop_nginx; then
            write_color "  [✓] nginx arrêté" GREEN
        fi
    else
        write_color "  → nginx laissé en fonctionnement" CYAN
    fi

    wait_enter
}

_prod_are_services_running() {
    [ "$(pm2_get_status)" = "online" ] && return 0

    check_nginx && return 0

    return 1
}
