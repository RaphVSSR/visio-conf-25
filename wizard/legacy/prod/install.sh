#!/bin/bash

legacy_prod_install() {
    clear
    write_color "── Installation (Prod) ──" CYAN
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

    write_color "  Vérification de MongoDB (local requis en prod)..." YELLOW
    if ! _install_mongodb; then
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    fi

    if ! ensure_dep "pm2"; then
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    fi

    if ! ensure_dep "nginx" "-v"; then
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    fi

    echo ""
    generate_env "BACKEND/.env.template" "BACKEND/.env" "Backend" \
        "VERBOSE=false" "FLUSH_DB_ON_START=false"
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

    if [[ "$config_ok" == false ]]; then
        write_color "  [!] Configuration incomplète — corrigez le .env" RED
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

    echo ""
    read -p "  Commande de test (Entrée pour passer) : " test_cmd
    if [[ -n "$test_cmd" ]]; then
        write_color "  Exécution des tests..." YELLOW
        if ! eval "$test_cmd" 2>&1; then
            write_color "  [✗] Tests échoués" RED
            read -p "  Appuyez sur Entrée..." dummy
            return 1
        fi
        write_color "  [✓] Tests passés" GREEN
    fi

    echo ""
    write_color "  Build backend..." YELLOW
    (cd BACKEND && npm run build) || {
        write_color "  [✗] Échec build backend" RED
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    }
    write_color "  [✓] Backend build OK" GREEN

    write_color "  Build frontend..." YELLOW
    (cd FRONTENDV2 && npm run build) || {
        write_color "  [✗] Échec build frontend" RED
        read -p "  Appuyez sur Entrée..." dummy
        return 1
    }
    write_color "  [✓] Frontend build OK" GREEN

    echo ""
    read -p "  Nom de domaine (ex. visioconf.example.com) : " DOMAIN_NAME
    PROD_DOMAIN="$DOMAIN_NAME"

    ssl_setup "$DOMAIN_NAME"

    echo ""
    write_color "  Génération de la configuration nginx..." YELLOW
    generate_nginx_config "$DOMAIN_NAME" "${back_port:-3220}"

    echo ""
    write_color "  Configuration pm2 startup..." YELLOW
    case "$WIZARD_OS" in
        linux)   pm2 startup systemd 2>&1 ;;
        windows) npm install -g pm2-startup 2>&1 && pm2-startup install 2>&1 || write_color "  → Installez manuellement : npm install -g pm2-startup && pm2-startup install" YELLOW ;;
        macos)   pm2 startup launchd 2>&1 ;;
    esac

    echo ""
    write_color "  Démarrage pm2 + nginx..." YELLOW
    _prod_start_services
    pm2 save 2>&1
    sleep 5

    echo ""
    prod_health_report

    read -p "  Appuyez sur Entrée..." dummy
}

generate_nginx_config() {
    local domain="$1"
    local back_port="$2"
    local proj_dir
    proj_dir="$(cd "${PROJECT_DIR:-.}" && pwd)"
    [[ "$WIZARD_OS" == "windows" ]] && proj_dir="$(cygpath -m "$proj_dir")"

    local nginx_conf=""
    case "$WIZARD_OS" in
        linux)
            nginx_conf="/etc/nginx/sites-available/$domain"
            ;;
        windows)
            local nginx_path
            nginx_path=$(command -v nginx 2>/dev/null | sed 's|/nginx.*||')
            nginx_conf="${nginx_path:-/c/nginx}/conf/$domain.conf"
            ;;
        macos)
            if [[ -d "/opt/homebrew/etc/nginx" ]]; then
                nginx_conf="/opt/homebrew/etc/nginx/servers/$domain.conf"
            else
                nginx_conf="/usr/local/etc/nginx/servers/$domain.conf"
            fi
            ;;
    esac

    local cert_path=""
    case "$WIZARD_OS" in
        linux|macos) cert_path="/etc/letsencrypt/live/$domain" ;;
        windows)     cert_path="C:/Certbot/live/$domain" ;;
    esac

    local ssl_block=""
    local listen_block="    listen 80;\n    listen [::]:80;"

    if [[ -d "$cert_path" ]]; then
        listen_block="    listen 443 ssl;\n    listen [::]:443 ssl;"
        ssl_block="    ssl_certificate $cert_path/fullchain.pem;\n    ssl_certificate_key $cert_path/privkey.pem;\n"
    fi

    local config_content
    config_content="server {\n${listen_block}\n    server_name $domain;\n\n${ssl_block}\n    location / {\n        root $proj_dir/FRONTENDV2/build;\n        index index.html;\n        try_files \$uri \$uri/ /index.html;\n    }\n\n    location /api {\n        proxy_pass http://localhost:$back_port;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade \$http_upgrade;\n        proxy_set_header Connection \"upgrade\";\n        proxy_set_header Host \$host;\n        proxy_set_header X-Real-IP \$remote_addr;\n    }\n\n    location /socket.io {\n        proxy_pass http://localhost:$back_port;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade \$http_upgrade;\n        proxy_set_header Connection \"upgrade\";\n        proxy_set_header Host \$host;\n    }\n}\n"

    if [[ "$WIZARD_OS" == "linux" ]]; then
        echo -e "$config_content" | sudo tee "$nginx_conf" > /dev/null
        sudo ln -sf "$nginx_conf" "/etc/nginx/sites-enabled/$domain" 2>/dev/null
        sudo nginx -t 2>&1
    else
        echo -e "$config_content" > "$nginx_conf" 2>/dev/null
        nginx -t 2>&1
    fi

    if [[ $? -eq 0 ]]; then
        write_color "  [✓] Configuration nginx générée : $nginx_conf" GREEN
    else
        write_color "  [✗] Erreur dans la configuration nginx" RED
    fi
}
