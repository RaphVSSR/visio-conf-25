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
        if _install_mongodb; then
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
                if ! _install_mongodb; then
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
    mongo_uri=$(_extract_env_val "BACKEND/.env" "MONGO_URI" "")
    if [[ -z "$mongo_uri" ]]; then
        write_color "  [✗] MONGO_URI manquant dans BACKEND/.env" RED
        config_ok=false
    else
        write_color "  [✓] MONGO_URI configuré" GREEN
    fi

    local back_port
    back_port=$(_extract_env_val "BACKEND/.env" "PORT" "")
    if [[ -z "$back_port" ]]; then
        write_color "  [✗] PORT manquant dans BACKEND/.env" RED
        config_ok=false
    else
        write_color "  [✓] PORT backend : $back_port" GREEN
    fi

    local front_url
    front_url=$(_extract_env_val "BACKEND/.env" "FRONTEND_URL" "")
    if [[ -z "$front_url" ]]; then
        write_color "  [!] FRONTEND_URL manquant — CORS pourrait échouer" YELLOW
    else
        write_color "  [✓] FRONTEND_URL : $front_url" GREEN
    fi

    local back_api
    back_api=$(_extract_env_val "FRONTENDV2/.env" "REACT_APP_BACKEND_API_URL" "")
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
    dev_ssl_mkcert

    echo ""
    write_color "  Lancement des services..." YELLOW
    _dev_launch_terminals
    sleep 10

    echo ""
    dev_health_report

    read -p "  Appuyez sur Entrée..." dummy
}

dev_ssl_mkcert() {
    write_color "  HTTPS local nécessaire ? (o/N)" YELLOW
    local answer
    read -p "  " answer
    if [[ "${answer,,}" != "o" && "${answer,,}" != "oui" ]]; then
        write_color "  → HTTP uniquement (défaut)" CYAN
        return
    fi

    if ! command -v mkcert > /dev/null 2>&1; then
        write_color "  [✗] mkcert introuvable — installation..." YELLOW
        case "$WIZARD_OS" in
            linux)   sudo apt install -y mkcert 2>&1 ;;
            windows) _win_install "FiloSottile.mkcert" "mkcert" ;;
            macos)   brew install mkcert 2>&1 ;;
        esac
    fi

    if ! command -v mkcert > /dev/null 2>&1; then
        write_color "  [✗] Échec installation mkcert" RED
        write_color "  → Poursuite en HTTP" YELLOW
        return
    fi

    write_color "  [✓] mkcert détecté" GREEN

    local cert_dir=".certs"
    mkdir -p "$cert_dir"

    if [[ -f "$cert_dir/localhost.pem" ]] && [[ -f "$cert_dir/localhost-key.pem" ]] \
       && openssl x509 -checkend 0 -noout -in "$cert_dir/localhost.pem" 2>/dev/null; then
        write_color "  [✓] Certificats valides dans $cert_dir/" GREEN
    else
        mkcert -install 2>&1
        mkcert -cert-file "$cert_dir/localhost.pem" -key-file "$cert_dir/localhost-key.pem" localhost 127.0.0.1 ::1 2>&1

        if [[ ! -f "$cert_dir/localhost.pem" ]]; then
            write_color "  [✗] Échec de la génération des certificats" RED
            write_color "  → Poursuite en HTTP" YELLOW
            return
        fi
        write_color "  [✓] Certificats générés dans $cert_dir/" GREEN
    fi

    local cert_abs
    cert_abs="$(cd "$cert_dir" && pwd)"
    [[ "$WIZARD_OS" == "windows" ]] && cert_abs="$(cygpath -m "$cert_abs")"

    write_color "  Configuration HTTPS dans les .env..." YELLOW

    local cert_path="${cert_abs}/localhost.pem"
    local key_path="${cert_abs}/localhost-key.pem"

    sed -i "s|^SSL_CRT_FILE=.*|SSL_CRT_FILE=${cert_path}|" FRONTENDV2/.env
    sed -i "s|^SSL_KEY_FILE=.*|SSL_KEY_FILE=${key_path}|" FRONTENDV2/.env

    sed -i "s|^SSL_CRT_FILE=.*|SSL_CRT_FILE=${cert_path}|" BACKEND/.env
    sed -i "s|^SSL_KEY_FILE=.*|SSL_KEY_FILE=${key_path}|" BACKEND/.env
    sed -i "s|^FRONTEND_URL=http://localhost|FRONTEND_URL=https://localhost|" BACKEND/.env
    sed -i "s|^FILE_STORAGE_URL=http://localhost|FILE_STORAGE_URL=https://localhost|" BACKEND/.env
    sed -i "s|^PROFILE_PICTURES_URL=http://localhost|PROFILE_PICTURES_URL=https://localhost|" BACKEND/.env

    sed -i "s|^REACT_APP_BACKEND_API_URL=http://localhost|REACT_APP_BACKEND_API_URL=https://localhost|" FRONTENDV2/.env
    sed -i "s|^REACT_APP_BACKEND_FILE_STORAGE_URL=http://localhost|REACT_APP_BACKEND_FILE_STORAGE_URL=https://localhost|" FRONTENDV2/.env
    sed -i "s|^REACT_APP_BACKEND_PROFILE_PICTURES_URL=http://localhost|REACT_APP_BACKEND_PROFILE_PICTURES_URL=https://localhost|" FRONTENDV2/.env

    write_color "  [✓] HTTPS configuré (backend + frontend)" GREEN
}
