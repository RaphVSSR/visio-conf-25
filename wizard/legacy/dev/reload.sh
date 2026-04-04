#!/bin/bash

legacy_dev_reload() {
    clear
    write_color "── Reload (Dev) ──" CYAN
    echo ""

    if ! locate_project; then
        wait_enter
        return
    fi

    if ! _dev_are_services_running; then
        write_color "  Aucun service en cours d'exécution trouvé." YELLOW
        wait_enter
        return
    fi

    if ! verify_node_deps; then
        wait_enter
        return
    fi

    write_color "  Arrêt des services..." YELLOW
    _dev_kill_processes
    sleep 2

    write_color "  Relancement..." YELLOW
    _dev_launch_terminals
    sleep 8

    echo ""
    dev_health_report

    wait_enter
}
