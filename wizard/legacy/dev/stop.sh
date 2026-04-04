#!/bin/bash

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
    local back_port front_port
    back_port=$(extract_env_val "BACKEND/.env" "PORT" 3220)
    front_port=3000

    case "$WIZARD_OS" in
        linux|macos)
            lsof -i :"$back_port" > /dev/null 2>&1 || lsof -i :"$front_port" > /dev/null 2>&1
            ;;
        windows)
            netstat -ano 2>/dev/null | grep "LISTENING" | grep -q ":$back_port " || netstat -ano 2>/dev/null | grep "LISTENING" | grep -q ":$front_port "
            ;;
    esac
}

_dev_kill_processes() {
    local back_port front_port
    back_port=$(extract_env_val "BACKEND/.env" "PORT" 3220)
    front_port=3000

    case "$WIZARD_OS" in
        linux|macos)
            local pids
            pids=$(lsof -ti :"$back_port" 2>/dev/null; lsof -ti :"$front_port" 2>/dev/null)
            for proc_id in $pids; do
                kill "$proc_id" 2>/dev/null
            done
            ;;
        windows)
            powershell.exe -Command "Get-CimInstance Win32_Process -Filter \"name='powershell.exe'\" | Where-Object { \$_.CommandLine -match 'visio-conf-25' -and \$_.CommandLine -match '-NoExit' -and \$_.ProcessId -ne \$PID } | ForEach-Object { taskkill /PID \$_.ProcessId /F /T 2>\$null }" 2>/dev/null
            ;;
    esac
}

