#!/bin/bash

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

    if [[ ! -f "BACKEND/.env" ]] || [[ ! -f "FRONTENDV2/.env" ]]; then
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
    local proj_dir
    proj_dir="$(cd "${PROJECT_DIR:-.}" && pwd)"

    case "$WIZARD_OS" in
        linux)
            local term_emulator="" term_flag="--"
            if command -v x-terminal-emulator > /dev/null 2>&1; then
                term_emulator="x-terminal-emulator"
            elif command -v gnome-terminal > /dev/null 2>&1; then
                term_emulator="gnome-terminal"
            elif command -v konsole > /dev/null 2>&1; then
                term_emulator="konsole"; term_flag="-e"
            elif command -v xfce4-terminal > /dev/null 2>&1; then
                term_emulator="xfce4-terminal"; term_flag="-e"
            elif command -v xterm > /dev/null 2>&1; then
                term_emulator="xterm"; term_flag="-e"
            fi

            if [[ -z "$term_emulator" ]]; then
                write_color "  [✗] Aucun émulateur de terminal détecté" RED
                return 1
            fi

            $term_emulator $term_flag bash -c "cd '$proj_dir/BACKEND'; npm run dev; exec bash" < /dev/null > /dev/null 2>&1 &
            sleep 3
            $term_emulator $term_flag bash -c "cd '$proj_dir/FRONTENDV2'; npm start; exec bash" < /dev/null > /dev/null 2>&1 &
            ;;
        windows)
            local win_back win_front
            win_back="$(cygpath -w "$proj_dir/BACKEND")"
            win_front="$(cygpath -w "$proj_dir/FRONTENDV2")"
            powershell.exe -Command "Start-Process powershell -ArgumentList '-NoExit','-Command','cd \"$win_back\"; npm run dev'" < /dev/null > /dev/null 2>&1 &
            sleep 3
            powershell.exe -Command "Start-Process powershell -ArgumentList '-NoExit','-Command','cd \"$win_front\"; npm start'" < /dev/null > /dev/null 2>&1 &
            ;;
        macos)
            osascript -e "tell app \"Terminal\" to do script \"cd '$proj_dir/BACKEND' && npm run dev\"" < /dev/null > /dev/null 2>&1 &
            sleep 3
            osascript -e "tell app \"Terminal\" to do script \"cd '$proj_dir/FRONTENDV2' && npm start\"" < /dev/null > /dev/null 2>&1 &
            ;;
    esac
}

dev_health_report() {
    local back_port front_port proto
    back_port=$(extract_env_val "BACKEND/.env" "PORT" 3220)
    front_port=3000
    proto="http"
    local ssl_cert
    ssl_cert=$(extract_env_val "BACKEND/.env" "SSL_CRT_FILE" "")
    [[ -n "$ssl_cert" ]] && proto="https"

    write_color "── Status (Dev) ──────────────────────────" CYAN
    echo ""

    write_color "  Services" WHITE

    local mongo_status="✗ unreachable" mongo_color="RED"
    local mongo_uri
    mongo_uri=$(extract_env_val "BACKEND/.env" "MONGO_URI" "mongodb://localhost:27017/visio-conf")

    if [[ "$mongo_uri" == *"mongodb+srv"* || "$mongo_uri" == *"mongodb.net"* ]]; then
        mongo_status="Atlas ($mongo_uri)"; mongo_color="YELLOW"
    else
        local state
        state=$(_mongo_check)
        if [[ "$state" == "running" ]]; then
            mongo_status="✓ local prêt"; mongo_color="GREEN"
        elif [[ "$state" == "stopped" ]]; then
            mongo_status="✗ service arrêté"; mongo_color="RED"
        else
            mongo_status="✗ non installé"; mongo_color="RED"
        fi
    fi
    printf "  ├─ MongoDB     ${!mongo_color}%s${RESET}\n" "$mongo_status"
    if [[ "$mongo_color" != "GREEN" && "$mongo_uri" != *"mongodb+srv"* ]]; then
        write_color "  │  → Relancez Installation pour démarrer MongoDB" YELLOW
    fi

    local back_status="✗ not responding" back_color="RED" back_pid="—"
    case "$WIZARD_OS" in
        linux|macos) back_pid=$(lsof -ti :"$back_port" 2>/dev/null | head -1) ;;
        windows)     back_pid=$(netstat -ano 2>/dev/null | grep ":$back_port " | awk '{print $5}' | head -1) ;;
    esac
    if curl -sk -o /dev/null --connect-timeout 3 "${proto}://localhost:$back_port" 2>/dev/null; then
        back_status="✓ responding :$back_port"; back_color="GREEN"
    fi
    printf "  ├─ Backend     ${!back_color}%s${RESET}  pid: %s\n" "$back_status" "${back_pid:-—}"
    if [[ "$back_color" == "RED" ]]; then
        write_color "  │  → Vérifiez le terminal backend, MongoDB doit être accessible" YELLOW
    fi

    local front_status="✗ not responding" front_color="RED" front_pid="—"
    case "$WIZARD_OS" in
        linux|macos) front_pid=$(lsof -ti :"$front_port" 2>/dev/null | head -1) ;;
        windows)     front_pid=$(netstat -ano 2>/dev/null | grep ":$front_port " | awk '{print $5}' | head -1) ;;
    esac
    if curl -sk -o /dev/null --connect-timeout 3 "${proto}://localhost:$front_port" 2>/dev/null; then
        front_status="✓ responding :$front_port"; front_color="GREEN"
    fi
    printf "  └─ Frontend    ${!front_color}%s${RESET}  pid: %s\n" "$front_status" "${front_pid:-—}"
    if [[ "$front_color" == "RED" ]]; then
        write_color "     → Vérifiez le terminal frontend, peut prendre ~15s à compiler" YELLOW
    fi

    echo ""
    write_color "  Environnement" WHITE
    write_color "  ├─ Mode:     development" WHITE
    write_color "  ├─ Projet:   $PROJECT_DIR" WHITE
    local verbose_val
    verbose_val=$(extract_env_val "BACKEND/.env" "VERBOSE" "false")
    if [[ "$verbose_val" == "true" ]]; then
        write_color "  ├─ Verbose:  enabled" GREEN
    else
        write_color "  ├─ Verbose:  disabled" WHITE
    fi
    local node_ver
    node_ver=$(node --version 2>/dev/null || echo "N/A")
    write_color "  ├─ Node:     $node_ver" WHITE
    local env_back="✗"; [[ -f "BACKEND/.env" ]] && env_back="✓"
    local env_front="✗"; [[ -f "FRONTENDV2/.env" ]] && env_front="✓"
    write_color "  └─ .env:     backend $env_back  frontend $env_front" WHITE

    if [[ "$back_color" == "GREEN" && "$front_color" == "GREEN" ]]; then
        echo ""
        write_color "  Identifiants : dev@visioconf.com | d3vV1s10C0nf" YELLOW
    fi
    write_color "──────────────────────────────────────────" CYAN
}
