#!/bin/sh

legacy_dev_launch() {
    clear
    write_color "── Launch (Dev) ──" CYAN
    echo ""

    if ! locate_project; then
        wait_enter
        return
    fi

    if ! verify_node_deps; then
        wait_enter
        return
    fi

    if [ ! -f "BACKEND/.env" ] || [ ! -f "FRONTENDV2/.env" ]; then
        write_color "  [✗] Fichiers .env manquants. Lancez d'abord Installation." YELLOW
        wait_enter
        return
    fi

    _dev_launch_terminals
    sleep 8

    echo ""
    dev_health_report

    wait_enter
}

_dev_launch_terminals() {
    project_folder="$(cd "${PROJECT_DIR:-.}" && pwd)"

    case "$WIZARD_OS" in
        linux)
            terminal_program=""
            terminal_flag="--"
            if command -v x-terminal-emulator > /dev/null 2>&1; then
                terminal_program="x-terminal-emulator"
            elif command -v gnome-terminal > /dev/null 2>&1; then
                terminal_program="gnome-terminal"
            elif command -v konsole > /dev/null 2>&1; then
                terminal_program="konsole"; terminal_flag="-e"
            elif command -v xfce4-terminal > /dev/null 2>&1; then
                terminal_program="xfce4-terminal"; terminal_flag="-e"
            elif command -v xterm > /dev/null 2>&1; then
                terminal_program="xterm"; terminal_flag="-e"
            fi

            if [ -z "$terminal_program" ]; then
                write_color "  [✗] Aucun émulateur de terminal détecté" RED
                return 1
            fi

            $terminal_program $terminal_flag bash -c "cd '$project_folder/BACKEND'; npm run dev; exec bash" < /dev/null > /dev/null 2>&1 &
            sleep 3
            $terminal_program $terminal_flag bash -c "cd '$project_folder/FRONTENDV2'; npm start; exec bash" < /dev/null > /dev/null 2>&1 &
            ;;
        windows)
            windows_backend="$(cygpath -w "$project_folder/BACKEND")"
            windows_frontend="$(cygpath -w "$project_folder/FRONTENDV2")"
            powershell.exe -Command "Start-Process powershell -ArgumentList '-NoExit','-Command','cd \"$windows_backend\"; npm run dev'" < /dev/null > /dev/null 2>&1 &
            sleep 3
            powershell.exe -Command "Start-Process powershell -ArgumentList '-NoExit','-Command','cd \"$windows_frontend\"; npm start'" < /dev/null > /dev/null 2>&1 &
            ;;
        macos)
            osascript -e "tell app \"Terminal\" to do script \"cd '$project_folder/BACKEND' && npm run dev\"" < /dev/null > /dev/null 2>&1 &
            sleep 3
            osascript -e "tell app \"Terminal\" to do script \"cd '$project_folder/FRONTENDV2' && npm start\"" < /dev/null > /dev/null 2>&1 &
            ;;
    esac
}

_dev_resolve_color() {
    case "$1" in
        RED)    printf '%s' "$RED" ;;
        GREEN)  printf '%s' "$GREEN" ;;
        YELLOW) printf '%s' "$YELLOW" ;;
        BLUE)   printf '%s' "$BLUE" ;;
        CYAN)   printf '%s' "$CYAN" ;;
        MAGENTA) printf '%s' "$MAGENTA" ;;
        WHITE)  printf '%s' "$WHITE" ;;
        *)      printf '%s' "$WHITE" ;;
    esac
}

dev_health_report() {
    backend_port=$(extract_env_val "BACKEND/.env" "PORT" 3220)
    frontend_port=3000
    protocol="http"
    ssl_certificate=$(extract_env_val "BACKEND/.env" "SSL_CRT_FILE" "")
    [ -n "$ssl_certificate" ] && protocol="https"

    write_color "── Status (Dev) ──────────────────────────" CYAN
    echo ""

    write_color "  Services" WHITE

    mongo_status="✗ unreachable"
    mongo_color="RED"
    mongodb_uri=$(extract_env_val "BACKEND/.env" "MONGO_URI" "mongodb://localhost:27017/visio-conf")

    case "$mongodb_uri" in
        *mongodb+srv*|*mongodb.net*)
            mongo_status="Atlas ($mongodb_uri)"
            mongo_color="YELLOW"
            ;;
        *)
            mongo_state=$(_mongo_check)
            if [ "$mongo_state" = "running" ]; then
                mongo_status="✓ local prêt"; mongo_color="GREEN"
            elif [ "$mongo_state" = "stopped" ]; then
                mongo_status="✗ service arrêté"; mongo_color="RED"
            else
                mongo_status="✗ non installé"; mongo_color="RED"
            fi
            ;;
    esac
    mongo_color_code=$(_dev_resolve_color "$mongo_color")
    printf "  ├─ MongoDB     %s%s%s\n" "$mongo_color_code" "$mongo_status" "$RESET"
    case "$mongodb_uri" in
        *mongodb+srv*) ;;
        *)
            if [ "$mongo_color" != "GREEN" ]; then
                write_color "  │  → Relancez Installation pour démarrer MongoDB" YELLOW
            fi
            ;;
    esac

    backend_status="✗ not responding"
    backend_color="RED"
    backend_process="—"
    case "$WIZARD_OS" in
        linux|macos) backend_process=$(lsof -ti :"$backend_port" 2>/dev/null | head -1) ;;
        windows)     backend_process=$(netstat -ano 2>/dev/null | grep ":$backend_port " | awk '{print $5}' | head -1) ;;
    esac
    if curl -4 -sk -o /dev/null --connect-timeout 3 "${protocol}://localhost:$backend_port" 2>/dev/null; then
        backend_status="✓ responding :$backend_port"
        backend_color="GREEN"
    fi
    backend_color_code=$(_dev_resolve_color "$backend_color")
    printf "  ├─ Backend     %s%s%s  pid: %s\n" "$backend_color_code" "$backend_status" "$RESET" "${backend_process:-—}"
    if [ "$backend_color" = "RED" ]; then
        write_color "  │  → Vérifiez le terminal backend, MongoDB doit être accessible" YELLOW
    fi

    frontend_status="✗ not responding"
    frontend_color="RED"
    frontend_process="—"
    case "$WIZARD_OS" in
        linux|macos) frontend_process=$(lsof -ti :"$frontend_port" 2>/dev/null | head -1) ;;
        windows)     frontend_process=$(netstat -ano 2>/dev/null | grep ":$frontend_port " | awk '{print $5}' | head -1) ;;
    esac
    if curl -4 -sk -o /dev/null --connect-timeout 3 "${protocol}://localhost:$frontend_port" 2>/dev/null; then
        frontend_status="✓ responding :$frontend_port"
        frontend_color="GREEN"
    fi
    frontend_color_code=$(_dev_resolve_color "$frontend_color")
    printf "  └─ Frontend    %s%s%s  pid: %s\n" "$frontend_color_code" "$frontend_status" "$RESET" "${frontend_process:-—}"
    if [ "$frontend_color" = "RED" ]; then
        write_color "     → Vérifiez le terminal frontend, peut prendre ~15s à compiler" YELLOW
    fi

    echo ""
    write_color "  Environnement" WHITE
    write_color "  ├─ Mode:     development" WHITE
    write_color "  ├─ Projet:   $PROJECT_DIR" WHITE
    verbose_value=$(extract_env_val "BACKEND/.env" "VERBOSE" "false")
    if [ "$verbose_value" = "true" ]; then
        write_color "  ├─ Verbose:  enabled" GREEN
    else
        write_color "  ├─ Verbose:  disabled" WHITE
    fi
    node_version=$(node --version 2>/dev/null || echo "N/A")
    write_color "  ├─ Node:     $node_version" WHITE
    backend_env_mark="✗"
    [ -f "BACKEND/.env" ] && backend_env_mark="✓"
    frontend_env_mark="✗"
    [ -f "FRONTENDV2/.env" ] && frontend_env_mark="✓"
    write_color "  └─ .env:     backend $backend_env_mark  frontend $frontend_env_mark" WHITE

    if [ "$backend_color" = "GREEN" ] && [ "$frontend_color" = "GREEN" ]; then
        echo ""
        write_color "  Identifiants : dev@visioconf.com | d3vV1s10C0nf" YELLOW
    fi
    write_color "──────────────────────────────────────────" CYAN
}
