#!/bin/bash

legacy_prod_status() {
    clear

    if ! locate_project; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    trap 'return 0' INT

    while true; do
        clear
        prod_health_report_live
        sleep 3
    done
}

prod_health_report_live() {
    local back_port mongo_port
    back_port=$(_extract_env_port "BACKEND/.env" "PORT" 3220)
    mongo_port=27017

    write_color "── Status (Prod) ── rafraîchissement : 3s ────────" CYAN
    echo ""

    write_color "  Services" WHITE

    local mongo_status="✗ unreachable" mongo_color="RED"
    local mongo_state
    mongo_state=$(_mongo_check)
    if [[ "$mongo_state" == "running" ]]; then
        mongo_status="✓ local prêt"; mongo_color="GREEN"
    elif [[ "$mongo_state" == "stopped" ]]; then
        mongo_status="✗ service arrêté"; mongo_color="RED"
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

    local nginx_status="✗ inactive" nginx_color="RED"
    case "$WIZARD_OS" in
        linux)   systemctl is-active nginx > /dev/null 2>&1 && { nginx_status="✓ active"; nginx_color="GREEN"; } ;;
        windows) tasklist 2>/dev/null | grep -qi "nginx" && { nginx_status="✓ active"; nginx_color="GREEN"; } ;;
        macos)   brew services list 2>/dev/null | grep nginx | grep -q started && { nginx_status="✓ active"; nginx_color="GREEN"; } ;;
    esac

    write_color "  ├─ nginx           ${!nginx_color}$nginx_status${NC}" WHITE
    write_color "  ├─ pm2 backend     ${!pm2_color}$pm2_status${NC}   cpu: ${pm2_cpu:-—}% | mem: ${pm2_mem} | restarts: ${pm2_restarts:-—}" WHITE
    write_color "  └─ MongoDB ($mongo_port) ${!mongo_color}$mongo_status${NC}" WHITE

    echo ""
    write_color "  Ports" WHITE
    for port in 80 443 "$back_port" "$mongo_port"; do
        local label=""
        case "$port" in
            80)  label="HTTP" ;;
            443) label="HTTPS" ;;
            "$back_port") label="Backend" ;;
            "$mongo_port") label="MongoDB" ;;
        esac
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
    write_color "  Logs (5 dernières lignes — pm2)" WHITE
    pm2 logs visioconf-backend --nostream --lines 5 2>/dev/null | tail -5 | while IFS= read -r logline; do
        write_color "  ├─ $logline" WHITE
    done

    echo ""
    write_color "  Ctrl+C pour quitter" YELLOW
    write_color "────────────────────────────────────────" CYAN
}
