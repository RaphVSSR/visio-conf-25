#!/bin/bash

legacy_dev_reload() {
    clear
    write_color "── Reload (Dev) ──" CYAN
    echo ""

    if ! locate_project; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    if ! _dev_services_running; then
        write_color "  Aucun service en cours d'exécution trouvé." YELLOW
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    if ! verify_node_deps; then
        read -p "  Appuyez sur Entrée..." dummy
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

    read -p "  Appuyez sur Entrée..." dummy
}
