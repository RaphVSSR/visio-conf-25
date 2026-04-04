#!/bin/bash

legacy_prod_status() {
    clear

    if ! locate_project; then
        wait_enter
        return
    fi

    local _keep_loop=true
    trap '_keep_loop=false' INT

    while [[ "$_keep_loop" == true ]]; do
        clear
        write_color "  rafraîchissement : 3s — Ctrl+C pour quitter" WHITE
        echo ""
        prod_health_report
        sleep 3 || true
    done

    trap - INT
}

prod_health_report() {
    local back_port mongo_port
    back_port=$(extract_env_val "BACKEND/.env" "PORT" 3220)
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
    printf "  ├─ MongoDB     ${!mongo_color}%s${RESET}\n" "$mongo_status"
    if [[ "$mongo_color" == "RED" ]]; then
        write_color "  │  → Relancez Installation pour démarrer MongoDB" YELLOW
    fi

    local pm2_status="✗ offline" pm2_color="RED"
    local pm2_cpu="—" pm2_mem="—" pm2_restarts="—"
    local pm2_state
    pm2_state=$(pm2_get_status)
    if [[ "$pm2_state" == "online" ]]; then
        pm2_status="✓ online"; pm2_color="GREEN"
    fi
    if [[ "$pm2_state" != "missing" ]]; then
        local pm2_json
        pm2_json=$(pm2 jlist 2>/dev/null)
        pm2_cpu=$(echo "$pm2_json" | grep -o '"cpu":[0-9.]*' | head -1 | cut -d: -f2)
        pm2_mem=$(echo "$pm2_json" | grep -o '"memory":[0-9]*' | head -1 | cut -d: -f2)
        pm2_restarts=$(echo "$pm2_json" | grep -o '"restart_time":[0-9]*' | head -1 | cut -d: -f2)
        [[ -n "$pm2_mem" && "$pm2_mem" != "0" ]] && pm2_mem="$((pm2_mem / 1048576))MB" || pm2_mem="—"
    fi
    printf "  ├─ pm2         ${!pm2_color}%s${RESET}   cpu: %s%% | mem: %s | restarts: %s\n" "$pm2_status" "${pm2_cpu:-—}" "${pm2_mem}" "${pm2_restarts:-—}"
    if [[ "$pm2_color" == "RED" ]]; then
        write_color "  │  → Relancez Installation si nécessaire" YELLOW
    fi

    local nginx_status="✗ inactive" nginx_color="RED"
    nginx_is_active && { nginx_status="✓ active"; nginx_color="GREEN"; }
    printf "  └─ nginx       ${!nginx_color}%s${RESET}\n" "$nginx_status"
    if [[ "$nginx_color" == "RED" ]]; then
        write_color "     → Relancez Installation si nécessaire" YELLOW
    fi

    echo ""
    write_color "  SSL" WHITE
    local ssl_cert ssl_type="none"
    ssl_cert=$(extract_env_val "BACKEND/.env" "SSL_CRT_FILE" "")
    if [[ -n "$ssl_cert" && -f "$ssl_cert" ]]; then
        local issuer
        issuer=$(openssl x509 -issuer -noout -in "$ssl_cert" 2>/dev/null)
        if echo "$issuer" | grep -qi "mkcert"; then
            ssl_type="mkcert"
            write_color "  ├─ Type:  mkcert (dev self-signed)" YELLOW
        elif echo "$issuer" | grep -qi "Let's Encrypt\|certbot"; then
            ssl_type="certbot"
            write_color "  ├─ Type:  Let's Encrypt (prod)" GREEN
        else
            ssl_type="custom"
            write_color "  ├─ Type:  custom certificate" CYAN
        fi
        if openssl x509 -checkend 0 -noout -in "$ssl_cert" 2>/dev/null; then
            local expiry
            expiry=$(openssl x509 -enddate -noout -in "$ssl_cert" 2>/dev/null | cut -d= -f2)
            write_color "  └─ Valid: ✓ expires $expiry" GREEN
        else
            write_color "  └─ Valid: ✗ expired" RED
        fi
    else
        write_color "  └─ aucun certificat configuré" RED
    fi

    local back_proto="http"
    [[ "$ssl_type" != "none" ]] && back_proto="https"

    echo ""
    write_color "  Ports" WHITE
    for port_info in "80:HTTP:http" "443:HTTPS:https" "$back_port:Backend:$back_proto" "$mongo_port:MongoDB:tcp"; do
        local port="${port_info%%:*}"
        local rest="${port_info#*:}"
        local label="${rest%%:*}"
        local proto="${rest#*:}"
        local alive=false

        if [[ "$proto" == "tcp" ]]; then
            if command -v nc > /dev/null 2>&1; then
                nc -z localhost "$port" 2>/dev/null && alive=true
            else
                (echo > /dev/tcp/localhost/$port) 2>/dev/null && alive=true
            fi
        else
            curl -sk -o /dev/null --connect-timeout 2 "${proto}://localhost:$port" 2>/dev/null && alive=true
        fi

        if [[ "$alive" == true ]]; then
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
    if [[ "$WIZARD_OS" == "windows" ]]; then
        nginx_ver=$("$(_win_nginx_exe)" -v 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "N/A")
    else
        nginx_ver=$(nginx -v 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "N/A")
    fi
    write_color "  ├─ Node:     $node_ver" WHITE
    write_color "  ├─ pm2:      $pm2_ver" WHITE
    write_color "  ├─ nginx:    $nginx_ver" WHITE
    local env_back="✗"; [[ -f "BACKEND/.env" ]] && env_back="✓"
    local env_front="✗"; [[ -f "FRONTENDV2/.env" ]] && env_front="✓"
    write_color "  └─ .env:     backend $env_back  frontend $env_front" WHITE

    echo ""
    write_color "  Logs (dernières lignes — pm2)" WHITE
    pm2 logs visioconf-backend --nostream --lines 5 2>/dev/null | tail -5 | while IFS= read -r logline; do
        write_color "  │ $logline" WHITE
    done

    write_color "──────────────────────────────────────────" CYAN
}
