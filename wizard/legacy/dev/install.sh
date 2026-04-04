#!/bin/bash

legacy_dev_install() {
    clear
    write_color "── Installation (Dev) ──" CYAN
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
    if ! verify_clone "legacy"; then
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    fi

    echo ""
    write_color "  Vérification des dépendances..." YELLOW
    if ! ensure_dep "node"; then
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    fi

    echo ""
    write_color "  Vérification de MongoDB..." YELLOW
    local mongo_mode="none"
    local mongo_uri_override=""
    local mongo_state
    mongo_state=$(_mongo_check)

    if [[ "$mongo_state" == "running" ]]; then
        write_color "  [✓] MongoDB local prêt" GREEN
        mongo_mode="local"
    elif [[ "$mongo_state" == "stopped" ]]; then
        if _mongo_setup; then
            mongo_mode="local"
        else
            read -p "  Appuyez sur Entrée..." dummy
            return 1
        fi
    else
        echo ""
        write_color "  Quelle base de données utiliser ?" WHITE
        echo ""

        arrow_menu --style lines \
            --colors "CYAN,CYAN,RED" \
            "MongoDB Local (installer)" \
            "MongoDB Atlas (connexion distante)" \
            "Annuler"

        case $MENU_RESULT in
            0)
                if ! _mongo_setup; then
                    read -p "  Appuyez sur Entrée..." dummy
                    return 1
                fi
                mongo_mode="local"
                ;;
            1)
                mongo_mode="atlas"
                echo ""
                write_color "  Entrez votre URI MongoDB Atlas :" WHITE
                write_color "  (ex: mongodb+srv://user:pass@cluster.mongodb.net/visioconf)" WHITE
                read -p "  MONGO_URI : " mongo_uri_override
                if [[ -z "$mongo_uri_override" ]]; then
                    write_color "  [✗] URI vide, installation annulée" RED
                    read -p "  Appuyez sur Entrée..." dummy
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
    local env_overrides=("VERBOSE=true" "VERBOSE_LVL=3" "FLUSH_DB_ON_START=true")
    [[ -n "$mongo_uri_override" ]] && env_overrides+=("MONGO_URI=$mongo_uri_override")

    generate_env "BACKEND/.env.template" "BACKEND/.env" "Backend" "${env_overrides[@]}"
    generate_env "FRONTENDV2/.env.template" "FRONTENDV2/.env" "Frontend"

    echo ""
    write_color "  Vérification de la configuration..." YELLOW
    local config_ok=true

    local mongo_uri
    mongo_uri=$(extract_env_val "BACKEND/.env" "MONGO_URI" "")
    if [[ -z "$mongo_uri" ]]; then
        write_color "  [✗] MONGO_URI manquant dans BACKEND/.env" RED
        config_ok=false
    else
        write_color "  [✓] MONGO_URI configuré" GREEN
    fi

    local back_port
    back_port=$(extract_env_val "BACKEND/.env" "PORT" "")
    if [[ -z "$back_port" ]]; then
        write_color "  [✗] PORT manquant dans BACKEND/.env" RED
        config_ok=false
    else
        write_color "  [✓] PORT backend : $back_port" GREEN
    fi

    local front_url
    front_url=$(extract_env_val "BACKEND/.env" "FRONTEND_URL" "")
    if [[ -z "$front_url" ]]; then
        write_color "  [!] FRONTEND_URL manquant — CORS pourrait échouer" YELLOW
    else
        write_color "  [✓] FRONTEND_URL : $front_url" GREEN
    fi

    local back_api
    back_api=$(extract_env_val "FRONTENDV2/.env" "REACT_APP_BACKEND_API_URL" "")
    if [[ -z "$back_api" ]]; then
        write_color "  [✗] REACT_APP_BACKEND_API_URL manquant dans FRONTENDV2/.env" RED
        config_ok=false
    else
        write_color "  [✓] Frontend → Backend : $back_api" GREEN
    fi

    if [[ "$config_ok" == false ]]; then
        write_color "" WHITE
        write_color "  [!] Configuration incomplète — corrigez les .env avant de continuer" RED
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    fi

    echo ""
    write_color "  Installation des dépendances backend..." YELLOW
    (cd BACKEND && npm install) || {
        write_color "  [✗] Échec npm install backend" RED
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    }
    write_color "  [✓] Backend node_modules installé" GREEN

    write_color "  Installation des dépendances frontend..." YELLOW
    (cd FRONTENDV2 && npm install) || {
        write_color "  [✗] Échec npm install frontend" RED
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    }
    write_color "  [✓] Frontend node_modules installé" GREEN

    if ! verify_node_deps; then
        write_color "  [✗] Installation des dépendances incomplète" RED
        read -p "  Appuyez sur Entrée..." dummy
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

    read -p "  Appuyez sur Entrée..." dummy
}
