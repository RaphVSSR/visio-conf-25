#!/bin/bash

legacy_dev_stop() {
    clear
    write_color "── Stop (Dev) ──" CYAN
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

    write_color "  Arrêt des services..." YELLOW
    _dev_kill_processes

    write_color "  [✓] Services arrêtés" GREEN
    read -p "  Appuyez sur Entrée..." dummy
}

_dev_services_running() {
    local back_port front_port
    back_port=$(_extract_env_port "BACKEND/.env" "PORT" 3220)
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
    back_port=$(_extract_env_port "BACKEND/.env" "PORT" 3220)
    front_port=3000

    case "$WIZARD_OS" in
        linux|macos)
            local pids
            pids=$(lsof -ti :"$back_port" 2>/dev/null; lsof -ti :"$front_port" 2>/dev/null)
            for pid in $pids; do
                kill "$pid" 2>/dev/null
            done
            ;;
        windows)
            powershell.exe -Command "Get-CimInstance Win32_Process -Filter \"name='powershell.exe'\" | Where-Object { \$_.CommandLine -match 'visio-conf-25' -and \$_.CommandLine -match '-NoExit' -and \$_.ProcessId -ne \$PID } | ForEach-Object { taskkill /PID \$_.ProcessId /F /T 2>\$null }" 2>/dev/null
            ;;
    esac
}

