#!/bin/bash

docker_manager() {
    while true; do
        cd "$SCRIPT_DIR"
        clear
        show_submenu_header "Docker Manager"

        arrow_menu --style lines \
            --colors "GREEN,GREEN,RED,CYAN,RED" \
            "Installation" "Launch" "Stop" "Status" "Back"

        case $MENU_RESULT in
            0) docker_install ;;
            1) docker_launch ;;
            2) docker_stop ;;
            3) docker_status ;;
            4) return ;;
        esac
    done
}

docker_install() {
    clear
    write_color "── Installation (Docker) ──" CYAN
    echo ""

    read -p "  Répertoire d'installation [./] : " install_path
    install_path="${install_path:-./}"
    install_path="${install_path%/}"

    if ! resolve_project "$install_path"; then
        if ! clone_project "$PROJECT_DIR"; then
            read -p "  Appuyez sur Entrée..." dummy
            return 1
        fi
    fi
    cd "$PROJECT_DIR" || return 1

    echo ""
    if ! verify_clone "docker"; then
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    fi

    echo ""
    write_color "  Vérification des dépendances..." YELLOW
    if ! check_dependency "docker"; then
        write_color "  Installation de Docker..." YELLOW
        case "$(uname -s)" in
            Linux*)  sudo apt update -qq 2>&1 && sudo apt install -y docker.io docker-compose-plugin 2>&1 && sudo systemctl start docker 2>&1 ;;
            MINGW*|MSYS*|CYGWIN*) _win_install "Docker.DockerDesktop" "docker-desktop" ;;
            Darwin*) brew install --cask docker 2>&1 ;;
        esac
        if ! check_dependency "docker"; then
            read -p "  Appuyez sur Entrée..." dummy
            return 1
        fi
    fi

    if ! docker compose version > /dev/null 2>&1; then
        write_color "  [✗] Docker Compose introuvable" RED
        write_color "  Docker Compose est inclus avec Docker Desktop" YELLOW
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    fi
    write_color "  [✓] Docker Compose détecté" GREEN

    echo ""
    generate_env "BACKEND/.env.template" "BACKEND/.env" "Backend"
    generate_env "FRONTENDV2/.env.template" "FRONTENDV2/.env" "Frontend"

    echo ""
    write_color "  Vérification de la configuration..." YELLOW
    local config_ok=true

    local mongo_uri
    mongo_uri=$(_extract_env_val "BACKEND/.env" "MONGO_URI" "")
    if [[ -z "$mongo_uri" ]]; then
        write_color "  [✗] MONGO_URI manquant dans BACKEND/.env" RED
        config_ok=false
    else
        write_color "  [✓] MONGO_URI configuré" GREEN
    fi

    local back_port
    back_port=$(_extract_env_val "BACKEND/.env" "PORT" "")
    if [[ -n "$back_port" ]]; then
        write_color "  [✓] PORT backend : $back_port" GREEN
    fi

    local back_api
    back_api=$(_extract_env_val "FRONTENDV2/.env" "REACT_APP_BACKEND_API_URL" "")
    if [[ -z "$back_api" ]]; then
        write_color "  [✗] REACT_APP_BACKEND_API_URL manquant" RED
        config_ok=false
    else
        write_color "  [✓] Frontend → Backend : $back_api" GREEN
    fi

    if [[ "$config_ok" == false ]]; then
        write_color "  [!] Configuration incomplète — corrigez les .env" RED
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    fi

    echo ""
    write_color "  Construction et démarrage..." YELLOW
    if ! docker compose up --build -d 2>&1; then
        write_color "  [✗] Échec de docker compose" RED
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    fi

    echo ""
    write_color "  Attente du démarrage des services..." YELLOW
    sleep 10
    docker_health_report

    read -p "  Appuyez sur Entrée..." dummy
}

docker_launch() {
    clear
    write_color "── Launch (Docker) ──" CYAN
    echo ""

    if ! locate_project; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    if ! docker compose ps --quiet 2>/dev/null | grep -q .; then
        write_color "  Aucun conteneur trouvé. Lancez d'abord Installation." YELLOW
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    docker compose up -d 2>&1

    echo ""
    write_color "  Attente du démarrage..." YELLOW
    sleep 5
    docker_health_report

    read -p "  Appuyez sur Entrée..." dummy
}

docker_stop() {
    clear
    write_color "── Stop (Docker) ──" CYAN
    echo ""

    if ! locate_project; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    if ! docker compose ps --quiet 2>/dev/null | grep -q .; then
        write_color "  Aucun conteneur en cours d'exécution." YELLOW
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    docker compose down 2>&1
    write_color "  [✓] Conteneurs arrêtés" GREEN
    read -p "  Appuyez sur Entrée..." dummy
}

docker_status() {
    clear

    if ! locate_project; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    docker_health_report
    read -p "  Appuyez sur Entrée..." dummy
}

docker_health_report() {
    write_color "── Status (Docker) ──────────────────────" CYAN
    echo ""

    if ! docker compose ps --quiet 2>/dev/null | grep -q .; then
        write_color "  Aucun conteneur trouvé. Lancez d'abord Installation." YELLOW
        return
    fi

    write_color "  Conteneurs" WHITE
    local containers
    containers=$(docker compose ps --format "{{.Name}}|{{.Status}}|{{.Ports}}" 2>/dev/null)

    while IFS='|' read -r name status ports; do
        [[ -z "$name" ]] && continue
        local icon="●" color="RED"
        if [[ "$status" == *"Up"* || "$status" == *"running"* ]]; then
            icon="●"; color="GREEN"
        fi
        write_color "  ├─ $name  ${!color}$icon${NC} $status" WHITE
    done <<< "$containers"

    echo ""
    write_color "  Services" WHITE

    local mongo_status="✗ unreachable" mongo_color="RED"
    if docker compose exec -T mongodb mongosh --eval 'db.runCommand({ping:1})' --quiet > /dev/null 2>&1; then
        mongo_status="✓ connected"; mongo_color="GREEN"
    fi
    write_color "  ├─ MongoDB     ${!mongo_color}$mongo_status${NC}" WHITE
    if [[ "$mongo_color" == "RED" ]]; then
        write_color "  │  → Le conteneur MongoDB n'a peut-être pas fini de démarrer" YELLOW
    fi

    local back_port
    back_port=$(docker compose port backend 3220 2>/dev/null | grep -oE '[0-9]+$' || echo "3220")
    local back_status="✗ not responding" back_color="RED"
    if curl -s -o /dev/null --connect-timeout 3 "http://localhost:$back_port" 2>/dev/null; then
        back_status="✓ responding :$back_port"; back_color="GREEN"
    fi
    write_color "  ├─ Backend     ${!back_color}$back_status${NC}" WHITE
    if [[ "$back_color" == "RED" ]]; then
        write_color "  │  → Le backend nécessite MongoDB pour démarrer" YELLOW
    fi

    local front_port
    front_port=$(docker compose port frontendv2 3000 2>/dev/null | grep -oE '[0-9]+$' || echo "3000")
    local front_status="✗ not responding" front_color="RED"
    if curl -s -o /dev/null --connect-timeout 3 "http://localhost:$front_port" 2>/dev/null; then
        front_status="✓ responding :$front_port"; front_color="GREEN"
    fi
    write_color "  └─ Frontend    ${!front_color}$front_status${NC}" WHITE
    if [[ "$front_color" == "RED" ]]; then
        write_color "     → Le frontend peut prendre ~30s à compiler" YELLOW
    fi

    echo ""
    write_color "  Environnement" WHITE
    write_color "  ├─ Projet:   $PROJECT_DIR" WHITE
    local env_back="✗"; [[ -f "BACKEND/.env" ]] && env_back="✓"
    local env_front="✗"; [[ -f "FRONTENDV2/.env" ]] && env_front="✓"
    write_color "  └─ .env:  backend $env_back  frontend $env_front" WHITE

    echo ""
    write_color "  Logs (dernières lignes — backend)" WHITE
    docker compose logs --tail 5 backend 2>/dev/null | while IFS= read -r line; do
        write_color "  │ $line" WHITE
    done

    write_color "─────────────────────────────────────────" CYAN
}
