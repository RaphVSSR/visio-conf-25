#!/bin/sh

docker_has_containers() {
    compose_file="${1:-compose.yaml}"
    docker compose -f "$compose_file" ps --quiet 2>/dev/null | grep -q .
}

docker_color_code() {
    case "$1" in
        GREEN)  printf '%s' "$GREEN" ;;
        RED)    printf '%s' "$RED" ;;
        YELLOW) printf '%s' "$YELLOW" ;;
        CYAN)   printf '%s' "$CYAN" ;;
        *)      printf '%s' "$WHITE" ;;
    esac
}

docker_health_report() {
    compose_file="${1:-compose.yaml}"

    write_color "── Status (Docker) ──────────────────────" CYAN
    echo ""

    if ! docker_has_containers "$compose_file"; then
        write_color "  Aucun conteneur trouve. Lancez d'abord Installation." YELLOW
        return
    fi

    write_color "  Conteneurs" WHITE
    containers=$(docker compose -f "$compose_file" ps --format "{{.Name}}|{{.Status}}|{{.Ports}}" 2>/dev/null)

    printf '%s\n' "$containers" | while IFS='|' read -r container_name container_status container_ports; do
        [ -z "$container_name" ] && continue
        icon_color="RED"
        case "$container_status" in
            *Up*|*running*) icon_color="GREEN" ;;
        esac
        color_code=$(docker_color_code "$icon_color")
        printf "  ├─ %s  %s●%s %s\n" "$container_name" "$color_code" "$RESET" "$container_status"
    done

    echo ""
    write_color "  Services" WHITE

    mongo_status="✗ unreachable"
    mongo_color="RED"
    if docker compose -f "$compose_file" exec -T mongodb mongosh --eval 'db.runCommand({ping:1})' --quiet > /dev/null 2>&1; then
        mongo_status="✓ connected"
        mongo_color="GREEN"
    fi
    mongo_color_code=$(docker_color_code "$mongo_color")
    printf "  ├─ MongoDB     %s%s%s\n" "$mongo_color_code" "$mongo_status" "$RESET"
    if [ "$mongo_color" = "RED" ]; then
        write_color "  │  → Le conteneur MongoDB n'a peut-etre pas fini de demarrer" YELLOW
    fi

    backend_status="✗ not responding"
    backend_color="RED"
    frontend_status="✗ not responding"
    frontend_color="RED"

    case "$compose_file" in
        *prod*)
            if curl -4 -s -o /dev/null --connect-timeout 3 "http://localhost/api" 2>/dev/null; then
                backend_status="✓ responding (via nginx)"
                backend_color="GREEN"
            fi
            if curl -4 -s -o /dev/null --connect-timeout 3 "http://localhost" 2>/dev/null; then
                frontend_status="✓ responding :80"
                frontend_color="GREEN"
            fi
            ;;
        *)
            backend_port=$(docker compose -f "$compose_file" port backend 3220 2>/dev/null | grep -oE '[0-9]+$' || echo "3220")
            backend_protocol="http"
            ssl_certificate=$(extract_env_val "BACKEND/.env" "SSL_CRT_FILE" "")
            [ -n "$ssl_certificate" ] && backend_protocol="https"
            if curl -4 -sk -o /dev/null --connect-timeout 3 "${backend_protocol}://localhost:$backend_port" 2>/dev/null; then
                backend_status="✓ responding :$backend_port"
                backend_color="GREEN"
            fi
            frontend_port=$(docker compose -f "$compose_file" port frontendv2 3000 2>/dev/null | grep -oE '[0-9]+$' || echo "3000")
            if curl -4 -sk -o /dev/null --connect-timeout 3 "http://localhost:$frontend_port" 2>/dev/null; then
                frontend_status="✓ responding :$frontend_port"
                frontend_color="GREEN"
            fi
            ;;
    esac

    backend_color_code=$(docker_color_code "$backend_color")
    printf "  ├─ Backend     %s%s%s\n" "$backend_color_code" "$backend_status" "$RESET"
    if [ "$backend_color" = "RED" ]; then
        write_color "  │  → Le backend necessite MongoDB pour demarrer" YELLOW
    fi
    frontend_color_code=$(docker_color_code "$frontend_color")
    printf "  └─ Frontend    %s%s%s\n" "$frontend_color_code" "$frontend_status" "$RESET"
    if [ "$frontend_color" = "RED" ]; then
        write_color "     → Le frontend peut prendre ~30s a compiler" YELLOW
    fi

    echo ""
    write_color "  Environnement" WHITE
    write_color "  ├─ Projet:   $PROJECT_DIR" WHITE
    backend_envfile="✗"
    [ -f "BACKEND/.env" ] && backend_envfile="✓"
    frontend_envfile="✗"
    [ -f "FRONTENDV2/.env" ] && frontend_envfile="✓"
    write_color "  └─ .env:  backend $backend_envfile  frontend $frontend_envfile" WHITE

    echo ""
    write_color "  Logs (dernieres lignes — backend)" WHITE
    docker compose -f "$compose_file" logs --tail 5 backend 2>/dev/null | while IFS= read -r logline; do
        write_color "  │ $logline" WHITE
    done

    write_color "─────────────────────────────────────────" CYAN
}

docker_manager() {
    [ -z "$WIZARD_OS" ] && { write_color "  [✗] Plateforme non détectée" RED; return; }

    clear
    show_submenu_header "Docker Manager"
    write_color "  Selectionnez votre environnement :" WHITE
    echo ""

    pick_menu --style lines \
        --colors "GREEN,YELLOW,RED" \
        "Development" "Production" "Back"

    case $MENU_RESULT in
        0)
            . "$WIZARD_DIR/legacy/dev/ssl.sh"
            . "$WIZARD_DIR/docker/dev.sh"
            docker_dev_menu
            ;;
        1)
            . "$WIZARD_DIR/docker/prod.sh"
            docker_prod_menu
            ;;
        2) return ;;
    esac
}
