#!/bin/sh

legacy_dev_install() {
    clear
    write_color "── Installation (Dev) ──" CYAN
    echo ""

    printf '%s' "  Répertoire d'installation [./] : "
    read -r install_path
    install_path="${install_path:-./}"
    install_path="${install_path%/}"

    if ! resolve_project "$install_path"; then
        if ! clone_project "$PROJECT_DIR"; then
            wait_enter
            return 1
        fi
    fi
    cd "$PROJECT_DIR" || return 1

    echo ""
    if ! verify_clone "legacy"; then
        wait_enter
        return 1
    fi

    echo ""
    write_color "  Vérification des dépendances..." YELLOW
    if ! ensure_dep "node"; then
        wait_enter
        return 1
    fi

    echo ""
    write_color "  Vérification de MongoDB..." YELLOW
    mongo_mode="none"
    mongo_uri_override=""
    mongo_state=$(_mongo_check)

    if [ "$mongo_state" = "running" ]; then
        write_color "  [✓] MongoDB local prêt" GREEN
        mongo_mode="local"
    elif [ "$mongo_state" = "stopped" ]; then
        if _mongo_setup; then
            mongo_mode="local"
        else
            wait_enter
            return 1
        fi
    else
        echo ""
        write_color "  Quelle base de données utiliser ?" WHITE
        echo ""

        pick_menu --style lines \
            --colors "CYAN,CYAN,RED" \
            "MongoDB Local (installer)" \
            "MongoDB Atlas (connexion distante)" \
            "Annuler"

        case $MENU_RESULT in
            0)
                if ! _mongo_setup; then
                    wait_enter
                    return 1
                fi
                mongo_mode="local"
                ;;
            1)
                mongo_mode="atlas"
                echo ""
                write_color "  Entrez votre URI MongoDB Atlas :" WHITE
                write_color "  (ex: mongodb+srv://user:pass@cluster.mongodb.net/visioconf)" WHITE
                printf '%s' "  MONGO_URI : "
                read -r mongo_uri_override
                if [ -z "$mongo_uri_override" ]; then
                    write_color "  [✗] URI vide, installation annulée" RED
                    wait_enter
                    return 1
                fi
                write_color "  [✓] Atlas configuré" GREEN
                ;;
            2)
                return 1
                ;;
        esac
    fi

    echo ""
    if [ -n "$mongo_uri_override" ]; then
        generate_env "BACKEND/.env.template" "BACKEND/.env" "Backend" \
            "VERBOSE=true" "VERBOSE_LVL=3" "FLUSH_DB_ON_START=true" \
            "MONGO_URI=$mongo_uri_override"
    else
        generate_env "BACKEND/.env.template" "BACKEND/.env" "Backend" \
            "VERBOSE=true" "VERBOSE_LVL=3" "FLUSH_DB_ON_START=true"
    fi
    generate_env "FRONTENDV2/.env.template" "FRONTENDV2/.env" "Frontend"

    echo ""
    write_color "  Vérification de la configuration..." YELLOW
    config_okay=true

    mongodb_uri=$(extract_env_val "BACKEND/.env" "MONGO_URI" "")
    if [ -z "$mongodb_uri" ]; then
        write_color "  [✗] MONGO_URI manquant dans BACKEND/.env" RED
        config_okay=false
    else
        write_color "  [✓] MONGO_URI configuré" GREEN
    fi

    backend_port=$(extract_env_val "BACKEND/.env" "PORT" "")
    if [ -z "$backend_port" ]; then
        write_color "  [✗] PORT manquant dans BACKEND/.env" RED
        config_okay=false
    else
        write_color "  [✓] PORT backend : $backend_port" GREEN
    fi

    frontend_url=$(extract_env_val "BACKEND/.env" "FRONTEND_URL" "")
    if [ -z "$frontend_url" ]; then
        write_color "  [!] FRONTEND_URL manquant — CORS pourrait échouer" YELLOW
    else
        write_color "  [✓] FRONTEND_URL : $frontend_url" GREEN
    fi

    backend_address=$(extract_env_val "FRONTENDV2/.env" "REACT_APP_BACKEND_API_URL" "")
    if [ -z "$backend_address" ]; then
        write_color "  [✗] REACT_APP_BACKEND_API_URL manquant dans FRONTENDV2/.env" RED
        config_okay=false
    else
        write_color "  [✓] Frontend → Backend : $backend_address" GREEN
    fi

    if [ "$config_okay" = "false" ]; then
        write_color "" WHITE
        write_color "  [!] Configuration incomplète — corrigez les .env avant de continuer" RED
        wait_enter
        return 1
    fi

    echo ""
    write_color "  Installation des dépendances backend..." YELLOW
    if ! (cd BACKEND && npm install); then
        write_color "  [✗] Échec npm install backend" RED
        wait_enter
        return 1
    fi
    write_color "  [✓] Backend node_modules installé" GREEN

    write_color "  Installation des dépendances frontend..." YELLOW
    if ! (cd FRONTENDV2 && npm install); then
        write_color "  [✗] Échec npm install frontend" RED
        wait_enter
        return 1
    fi
    write_color "  [✓] Frontend node_modules installé" GREEN

    if ! verify_node_deps; then
        write_color "  [✗] Installation des dépendances incomplète" RED
        wait_enter
        return 1
    fi

    echo ""
    dev_ssl_setup

    echo ""
    write_color "  Lancement des services..." YELLOW
    _dev_launch_terminals
    sleep 10

    echo ""
    dev_health_report

    wait_enter
}
