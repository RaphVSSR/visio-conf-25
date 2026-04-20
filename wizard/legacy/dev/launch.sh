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

    _dev_launch_bg
    sleep 8

    echo ""
    dev_health_report

    wait_enter
}

_dev_launch_bg() {
    project_folder="$(cd "$PROJECT_DIR" && pwd)"

    (cd "$project_folder/BACKEND"    && nohup npm run dev > "$WIZARD_LOG_DIR/backend.log"  2>&1 & echo $! > "$WIZARD_LOG_DIR/backend.pid")
    sleep 3
    (cd "$project_folder/FRONTENDV2" && nohup npm start   > "$WIZARD_LOG_DIR/frontend.log" 2>&1 & echo $! > "$WIZARD_LOG_DIR/frontend.pid")

    write_color "  Logs : $WIZARD_LOG_DIR/{backend,frontend}.log" CYAN
}

_dev_resolve_color() {
    color_name="$1"
    case "$color_name" in
        RED)    printf '%s' "$RED" ;;
        GREEN)  printf '%s' "$GREEN" ;;
        YELLOW) printf '%s' "$YELLOW" ;;
        BLUE)   printf '%s' "$BLUE" ;;
        CYAN)   printf '%s' "$CYAN" ;;
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
            mongo_state=$(check_mongo)
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
        linux|macos) backend_process=$(find_port_pid "$backend_port") ;;
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
        linux|macos) frontend_process=$(find_port_pid "$frontend_port") ;;
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
    write_color "  ├─ Logs:     $WIZARD_LOG_DIR" WHITE
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
