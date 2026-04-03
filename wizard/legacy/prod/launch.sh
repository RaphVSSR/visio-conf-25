#!/bin/bash

legacy_prod_launch() {
    clear
    write_color "── Launch (Prod) ──" CYAN
    echo ""

    if ! locate_project; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    if ! verify_prod_build; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    if [[ ! -f "BACKEND/.env" ]] || [[ ! -f "FRONTENDV2/.env" ]]; then
        write_color "  [✗] Fichiers .env manquants. Lancez d'abord Installation." YELLOW
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    _prod_start_services
    sleep 5

    echo ""
    prod_health_report

    read -p "  Appuyez sur Entrée..." dummy
}

_prod_start_services() {
    local proj_dir
    proj_dir="$(cd "${PROJECT_DIR:-.}" && pwd)"

    pm2 start "$proj_dir/BACKEND/dist/index.js" --name visioconf-backend 2>&1
    write_color "  [✓] pm2: visioconf-backend démarré" GREEN

    case "$WIZARD_OS" in
        linux)
            sudo systemctl start nginx 2>&1
            ;;
        windows)
            nginx 2>&1 &
            ;;
        macos)
            brew services start nginx 2>&1
            ;;
    esac
    write_color "  [✓] nginx démarré" GREEN
}

prod_health_report() {
    local back_port mongo_port
    back_port=$(_extract_env_port "BACKEND/.env" "PORT" 3220)
    mongo_port=27017

    write_color "── Status (Prod) ──────────────────────────" CYAN
    echo ""

    write_color "  Services" WHITE

    local mongo_status="✗ unreachable" mongo_color="RED"
    local mongo_state
    mongo_state=$(_mongo_check)
    if [[ "$mongo_state" == "running" ]]; then
        mongo_status="✓ local prêt"; mongo_color="GREEN"
    elif [[ "$mongo_state" == "stopped" ]]; then
        mongo_status="✗ service arrêté"; mongo_color="RED"
    else
        mongo_status="✗ non installé"; mongo_color="RED"
    fi
    write_color "  ├─ MongoDB     ${!mongo_color}$mongo_status${NC}" WHITE
    if [[ "$mongo_color" == "RED" ]]; then
        write_color "  │  → Relancez Installation pour démarrer MongoDB" YELLOW
    fi

    local pm2_status="✗ offline" pm2_color="RED"
    local pm2_cpu="—" pm2_mem="—" pm2_restarts="—"
    if pm2 describe visioconf-backend > /dev/null 2>&1; then
        local pm2_json
        pm2_json=$(pm2 jlist 2>/dev/null)
        local pm2_state
        pm2_state=$(echo "$pm2_json" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [[ "$pm2_state" == "online" ]]; then
            pm2_status="✓ online"; pm2_color="GREEN"
        fi
        pm2_cpu=$(echo "$pm2_json" | grep -o '"cpu":[0-9.]*' | head -1 | cut -d: -f2)
        pm2_mem=$(echo "$pm2_json" | grep -o '"memory":[0-9]*' | head -1 | cut -d: -f2)
        pm2_restarts=$(echo "$pm2_json" | grep -o '"restart_time":[0-9]*' | head -1 | cut -d: -f2)
        [[ -n "$pm2_mem" && "$pm2_mem" != "0" ]] && pm2_mem="$((pm2_mem / 1048576))MB" || pm2_mem="—"
    fi
    write_color "  ├─ pm2         ${!pm2_color}$pm2_status${NC}   cpu: ${pm2_cpu:-—}% | mem: ${pm2_mem} | restarts: ${pm2_restarts:-—}" WHITE
    if [[ "$pm2_color" == "RED" ]]; then
        write_color "  │  → Vérifiez que pm2 est installé et que MongoDB est accessible" YELLOW
        write_color "  │  → Relancez Installation si nécessaire" YELLOW
    fi

    local nginx_status="✗ inactive" nginx_color="RED"
    case "$WIZARD_OS" in
        linux)   systemctl is-active nginx > /dev/null 2>&1 && { nginx_status="✓ active"; nginx_color="GREEN"; } ;;
        windows) tasklist 2>/dev/null | grep -qi "nginx" && { nginx_status="✓ active"; nginx_color="GREEN"; } ;;
        macos)   brew services list 2>/dev/null | grep nginx | grep -q started && { nginx_status="✓ active"; nginx_color="GREEN"; } ;;
    esac
    write_color "  └─ nginx       ${!nginx_color}$nginx_status${NC}" WHITE
    if [[ "$nginx_color" == "RED" ]]; then
        write_color "     → Vérifiez que nginx est installé et démarré" YELLOW
        write_color "     → Relancez Installation si nécessaire" YELLOW
    fi

    echo ""
    write_color "  Ports" WHITE
    for port_info in "80:HTTP" "443:HTTPS" "$back_port:Backend" "$mongo_port:MongoDB"; do
        local port="${port_info%%:*}"
        local label="${port_info#*:}"
        if curl -s -o /dev/null --connect-timeout 2 "http://localhost:$port" 2>/dev/null; then
            write_color "  ├─ :$port $label  ● responding" GREEN
        else
            write_color "  ├─ :$port $label  ● not responding" RED
        fi
    done

    echo ""
    write_color "  Environnement" WHITE
    write_color "  ├─ Mode:     production" WHITE
    write_color "  ├─ Projet:   $PROJECT_DIR" WHITE
    local node_ver pm2_ver nginx_ver
    node_ver=$(node --version 2>/dev/null || echo "N/A")
    pm2_ver=$(pm2 --version 2>/dev/null || echo "N/A")
    nginx_ver=$(nginx -v 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "N/A")
    write_color "  ├─ Node:     $node_ver" WHITE
    write_color "  ├─ pm2:      $pm2_ver" WHITE
    write_color "  ├─ nginx:    $nginx_ver" WHITE
    local env_back="✗"; [[ -f "BACKEND/.env" ]] && env_back="✓"
    local env_front="✗"; [[ -f "FRONTENDV2/.env" ]] && env_front="✓"
    write_color "  └─ .env:     backend $env_back  frontend $env_front" WHITE

    echo ""
    write_color "  Logs (dernières lignes — pm2)" WHITE
    pm2 logs visioconf-backend --nostream --lines 5 2>/dev/null | tail -5 | while IFS= read -r line; do
        write_color "  │ $line" WHITE
    done

    write_color "──────────────────────────────────────────" CYAN
}
