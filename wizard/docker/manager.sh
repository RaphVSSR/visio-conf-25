#!/bin/bash

docker_detect_os() {
    if [[ -z "$WIZARD_OS" ]]; then
        case "$(uname -s)" in
            Linux*)          WIZARD_OS="linux" ;;
            MINGW*|MSYS*|CYGWIN*) WIZARD_OS="windows" ;;
            Darwin*)         WIZARD_OS="macos" ;;
            *) write_color "  [✗] Systeme non reconnu" RED; return 1 ;;
        esac
    fi
}

docker_has_containers() {
    local compose_file="${1:-compose.yaml}"
    docker compose -f "$compose_file" ps --quiet 2>/dev/null | grep -q .
}

docker_health_report() {
    local compose_file="${1:-compose.yaml}"

    write_color "── Status (Docker) ──────────────────────" CYAN
    echo ""

    if ! docker_has_containers "$compose_file"; then
        write_color "  Aucun conteneur trouve. Lancez d'abord Installation." YELLOW
        return
    fi

    write_color "  Conteneurs" WHITE
    local containers
    containers=$(docker compose -f "$compose_file" ps --format "{{.Name}}|{{.Status}}|{{.Ports}}" 2>/dev/null)

    while IFS='|' read -r name status ports; do
        [[ -z "$name" ]] && continue
        local icon="●" color="RED"
        if [[ "$status" == *"Up"* || "$status" == *"running"* ]]; then
            icon="●"; color="GREEN"
        fi
        printf "  ├─ %s  ${!color}%s${RESET} %s\n" "$name" "$icon" "$status"
    done <<< "$containers"

    echo ""
    write_color "  Services" WHITE

    local mongo_status="✗ unreachable" mongo_color="RED"
    if docker compose -f "$compose_file" exec -T mongodb mongosh --eval 'db.runCommand({ping:1})' --quiet > /dev/null 2>&1; then
        mongo_status="✓ connected"; mongo_color="GREEN"
    fi
    printf "  ├─ MongoDB     ${!mongo_color}%s${RESET}\n" "$mongo_status"
    if [[ "$mongo_color" == "RED" ]]; then
        write_color "  │  → Le conteneur MongoDB n'a peut-etre pas fini de demarrer" YELLOW
    fi

    local back_status="✗ not responding" back_color="RED"
    local front_status="✗ not responding" front_color="RED"

    if [[ "$compose_file" == *"prod"* ]]; then
        if curl -4 -s -o /dev/null --connect-timeout 3 "http://localhost/api" 2>/dev/null; then
            back_status="✓ responding (via nginx)"; back_color="GREEN"
        fi
        if curl -4 -s -o /dev/null --connect-timeout 3 "http://localhost" 2>/dev/null; then
            front_status="✓ responding :80"; front_color="GREEN"
        fi
    else
        local back_port
        back_port=$(docker compose -f "$compose_file" port backend 3220 2>/dev/null | grep -oE '[0-9]+$' || echo "3220")
        local back_proto="http"
        local ssl_cert
        ssl_cert=$(extract_env_val "BACKEND/.env" "SSL_CRT_FILE" "")
        [[ -n "$ssl_cert" ]] && back_proto="https"
        if curl -4 -sk -o /dev/null --connect-timeout 3 "${back_proto}://localhost:$back_port" 2>/dev/null; then
            back_status="✓ responding :$back_port"; back_color="GREEN"
        fi
        local front_port
        front_port=$(docker compose -f "$compose_file" port frontendv2 3000 2>/dev/null | grep -oE '[0-9]+$' || echo "3000")
        if curl -4 -sk -o /dev/null --connect-timeout 3 "http://localhost:$front_port" 2>/dev/null; then
            front_status="✓ responding :$front_port"; front_color="GREEN"
        fi
    fi

    printf "  ├─ Backend     ${!back_color}%s${RESET}\n" "$back_status"
    if [[ "$back_color" == "RED" ]]; then
        write_color "  │  → Le backend necessite MongoDB pour demarrer" YELLOW
    fi
    printf "  └─ Frontend    ${!front_color}%s${RESET}\n" "$front_status"
    if [[ "$front_color" == "RED" ]]; then
        write_color "     → Le frontend peut prendre ~30s a compiler" YELLOW
    fi

    echo ""
    write_color "  Environnement" WHITE
    write_color "  ├─ Projet:   $PROJECT_DIR" WHITE
    local env_back="✗"; [[ -f "BACKEND/.env" ]] && env_back="✓"
    local env_front="✗"; [[ -f "FRONTENDV2/.env" ]] && env_front="✓"
    write_color "  └─ .env:  backend $env_back  frontend $env_front" WHITE

    echo ""
    write_color "  Logs (dernieres lignes — backend)" WHITE
    docker compose -f "$compose_file" logs --tail 5 backend 2>/dev/null | while IFS= read -r line; do
        write_color "  │ $line" WHITE
    done

    write_color "─────────────────────────────────────────" CYAN
}

docker_manager() {
    docker_detect_os

    clear
    show_submenu_header "Docker Manager"
    write_color "  Selectionnez votre environnement :" WHITE
    echo ""

    arrow_menu --style lines \
        --colors "GREEN,YELLOW,RED" \
        "Development" "Production" "Back"

    case $MENU_RESULT in
        0)
            source "$WIZARD_DIR/legacy/dev/ssl.sh"
            source "$WIZARD_DIR/docker/dev.sh"
            docker_dev_menu
            ;;
        1)
            source "$WIZARD_DIR/docker/prod.sh"
            docker_prod_menu
            ;;
        2) return ;;
    esac
}
