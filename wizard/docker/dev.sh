#!/bin/sh

DEV_COMPOSE="compose.yaml"

docker_dev_menu() {
    while true; do
        cd "$SCRIPT_DIR"
        clear
        show_submenu_header "Docker — Dev"

        pick_menu --style lines \
            --colors "GREEN,GREEN,RED,CYAN,RED" \
            "Installation" "Launch" "Stop" "Status" "Back"

        case $MENU_RESULT in
            0) docker_dev_install ;;
            1) docker_dev_launch ;;
            2) docker_dev_stop ;;
            3) docker_dev_status ;;
            4) return ;;
        esac
    done
}

docker_dev_install() {
    clear
    write_color "── Installation (Docker Dev) ──" CYAN
    echo ""

    printf '%s' "  Repertoire d'installation [./] : "
    read -r install_folder
    install_folder="${install_folder:-./}"
    install_folder="${install_folder%/}"

    if ! resolve_project "$install_folder"; then
        if ! clone_project "$PROJECT_DIR"; then
            wait_enter
            return 1
        fi
    fi
    cd "$PROJECT_DIR" || return 1

    echo ""
    if ! verify_clone "docker"; then
        wait_enter
        return 1
    fi

    echo ""
    write_color "  Verification des dependances..." YELLOW
    if ! ensure_dep "docker"; then
        wait_enter
        return 1
    fi

    if ! docker compose version > /dev/null 2>&1; then
        write_color "  [✗] Docker Compose introuvable" RED
        write_color "  Docker Compose est inclus avec Docker Desktop" YELLOW
        wait_enter
        return 1
    fi
    write_color "  [✓] Docker Compose detecte" GREEN

    echo ""
    generate_env "BACKEND/.env.template" "BACKEND/.env" "Backend"
    generate_env "FRONTENDV2/.env.template" "FRONTENDV2/.env" "Frontend"

    echo ""
    write_color "  Verification de la configuration..." YELLOW
    config_ready=true

    mongo_address=$(extract_env_val "BACKEND/.env" "MONGO_URI" "")
    if [ -z "$mongo_address" ]; then
        write_color "  [✗] MONGO_URI manquant dans BACKEND/.env" RED
        config_ready=false
    else
        write_color "  [✓] MONGO_URI configure" GREEN
    fi

    backend_port=$(extract_env_val "BACKEND/.env" "PORT" "")
    if [ -n "$backend_port" ]; then
        write_color "  [✓] PORT backend : $backend_port" GREEN
    fi

    backend_api=$(extract_env_val "FRONTENDV2/.env" "REACT_APP_BACKEND_API_URL" "")
    if [ -z "$backend_api" ]; then
        write_color "  [✗] REACT_APP_BACKEND_API_URL manquant" RED
        config_ready=false
    else
        write_color "  [✓] Frontend → Backend : $backend_api" GREEN
    fi

    if [ "$config_ready" = "false" ]; then
        write_color "  [!] Configuration incomplete — corrigez les .env" RED
        wait_enter
        return 1
    fi

    echo ""
    dev_ssl_setup

    echo ""
    write_color "  Construction et demarrage..." YELLOW
    if ! docker compose -f "$DEV_COMPOSE" up --build -d 2>&1; then
        write_color "  [✗] Echec de docker compose" RED
        wait_enter
        return 1
    fi

    echo ""
    write_color "  Attente du demarrage des services..." YELLOW
    sleep 10
    docker_health_report "$DEV_COMPOSE"

    wait_enter
}

docker_dev_launch() {
    clear
    write_color "── Launch (Docker Dev) ──" CYAN
    echo ""

    if ! locate_project; then
        wait_enter
        return
    fi

    if ! docker_has_containers "$DEV_COMPOSE"; then
        write_color "  Aucun conteneur trouve. Lancez d'abord Installation." YELLOW
        wait_enter
        return
    fi

    docker compose -f "$DEV_COMPOSE" up -d 2>&1

    echo ""
    write_color "  Attente du demarrage..." YELLOW
    sleep 5
    docker_health_report "$DEV_COMPOSE"

    wait_enter
}

docker_dev_stop() {
    clear
    write_color "── Stop (Docker Dev) ──" CYAN
    echo ""

    if ! locate_project; then
        wait_enter
        return
    fi

    if ! docker_has_containers "$DEV_COMPOSE"; then
        write_color "  Aucun conteneur en cours d'execution." YELLOW
        wait_enter
        return
    fi

    docker compose -f "$DEV_COMPOSE" down 2>&1
    write_color "  [✓] Conteneurs arretes" GREEN
    wait_enter
}

docker_dev_status() {
    clear

    if ! locate_project; then
        wait_enter
        return
    fi

    docker_health_report "$DEV_COMPOSE"
    wait_enter
}
