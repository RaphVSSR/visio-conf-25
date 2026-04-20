#!/bin/sh

legacy_dev_stop() {
    clear
    write_color "── Stop (Dev) ──" CYAN
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

    write_color "  Arrêt des services..." YELLOW
    _dev_kill_processes

    sleep 1
    if _dev_are_services_running; then
        write_color "  [!] Certains processus n'ont pas été arrêtés" YELLOW
    else
        write_color "  [✓] Services arrêtés" GREEN
    fi
    wait_enter
}

_dev_are_services_running() {
    backend_port=$(extract_env_val "BACKEND/.env" "PORT" 3220)
    frontend_port=3000
    is_port_listening "$backend_port" || is_port_listening "$frontend_port"
}

_dev_kill_processes() {
    for svc in backend frontend; do
        pid_file="$WIZARD_LOG_DIR/$svc.pid"
        if [ -f "$pid_file" ]; then
            pid="$(cat "$pid_file")"
            [ -n "$pid" ] && kill "$pid" 2>/dev/null
            rm -f "$pid_file"
        fi
    done

    backend_port=$(extract_env_val "BACKEND/.env" "PORT" 3220)
    case "$WIZARD_OS" in
        linux|macos)
            for target_port in "$backend_port" 3000; do
                port_pid=$(find_port_pid "$target_port")
                [ -n "$port_pid" ] && kill "$port_pid" 2>/dev/null
            done
            ;;
    esac
}
