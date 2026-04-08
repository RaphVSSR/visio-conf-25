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

    case "$WIZARD_OS" in
        linux|macos)
            lsof -i :"$backend_port" > /dev/null 2>&1 || lsof -i :"$frontend_port" > /dev/null 2>&1
            ;;
        windows)
            netstat -ano 2>/dev/null | grep "LISTENING" | grep -q ":$backend_port " || netstat -ano 2>/dev/null | grep "LISTENING" | grep -q ":$frontend_port "
            ;;
    esac
}

_dev_kill_processes() {
    backend_port=$(extract_env_val "BACKEND/.env" "PORT" 3220)
    frontend_port=3000

    case "$WIZARD_OS" in
        linux|macos)
            process_list=$(lsof -ti :"$backend_port" 2>/dev/null; lsof -ti :"$frontend_port" 2>/dev/null)
            for process_identifier in $process_list; do
                kill "$process_identifier" 2>/dev/null
            done
            ;;
        windows)
            powershell.exe -Command "Get-CimInstance Win32_Process -Filter \"name='powershell.exe'\" | Where-Object { \$_.CommandLine -match 'visio-conf-25' -and \$_.CommandLine -match '-NoExit' -and \$_.ProcessId -ne \$PID } | ForEach-Object { taskkill /PID \$_.ProcessId /F /T 2>\$null }" 2>/dev/null
            ;;
    esac
}
