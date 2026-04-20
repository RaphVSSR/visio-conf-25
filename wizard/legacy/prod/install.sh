#!/bin/sh

legacy_prod_install() {
    clear
    write_color "── Installation (Prod) ──" CYAN
    echo ""

    if [ ! -d "$PROJECT_DIR/.git" ]; then
        clone_project "$PROJECT_DIR" || { wait_enter; return 1; }
    fi
    cd "$PROJECT_DIR" || return 1
    pull_project

    echo ""
    if ! verify_clone "legacy"; then
        wait_enter
        return 1
    fi

    echo ""
    if ! ensure_services prod; then
        wait_enter
        return 1
    fi

    echo ""
    write_color "  Vérification de MongoDB (local requis en prod)..." YELLOW
    if ! setup_mongo; then
        wait_enter
        return 1
    fi

    echo ""
    generate_env "BACKEND/.env.template" "BACKEND/.env" "Backend" \
        "VERBOSE=false" "FLUSH_DB_ON_START=false"
    generate_env "FRONTENDV2/.env.template" "FRONTENDV2/.env" "Frontend"

    echo ""
    write_color "  Vérification de la configuration..." YELLOW
    config_ok=true

    mongo_uri=$(extract_env_val "BACKEND/.env" "MONGO_URI" "")
    if [ -z "$mongo_uri" ]; then
        write_color "  [✗] MONGO_URI manquant dans BACKEND/.env" RED
        config_ok=false
    else
        write_color "  [✓] MONGO_URI configuré" GREEN
    fi

    back_port=$(extract_env_val "BACKEND/.env" "PORT" "")
    if [ -z "$back_port" ]; then
        write_color "  [✗] PORT manquant dans BACKEND/.env" RED
        config_ok=false
    else
        write_color "  [✓] PORT backend : $back_port" GREEN
    fi

    front_url=$(extract_env_val "BACKEND/.env" "FRONTEND_URL" "")
    if [ -z "$front_url" ]; then
        write_color "  [!] FRONTEND_URL manquant — CORS pourrait échouer" YELLOW
    else
        write_color "  [✓] FRONTEND_URL : $front_url" GREEN
    fi

    if [ "$config_ok" = "false" ]; then
        write_color "  [!] Configuration incomplète — corrigez le .env" RED
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

    echo ""
    printf '%s' "  Commande de test (Entrée pour passer) : "
    read -r test_command
    if [ -n "$test_command" ]; then
        write_color "  Exécution des tests..." YELLOW
        if ! eval "$test_command" 2>&1; then
            write_color "  [✗] Tests échoués" RED
            wait_enter
            return 1
        fi
        write_color "  [✓] Tests passés" GREEN
    fi

    echo ""
    [ -e BACKEND/src/models/core ] || ln -s Core BACKEND/src/models/core
    write_color "  [✓] Backend prêt (tsx runtime)" GREEN

    write_color "  Build frontend..." YELLOW
    if ! (cd FRONTENDV2 && npm run build); then
        write_color "  [✗] Échec build frontend" RED
        wait_enter
        return 1
    fi
    write_color "  [✓] Frontend build OK" GREEN

    echo ""
    printf '%s' "  Nom de domaine (ex. visioconf.example.com) : "
    read -r DOMAIN_NAME

    prod_ssl_setup "$DOMAIN_NAME"

    echo ""
    write_color "  Génération de la configuration nginx..." YELLOW
    prod_nginx_generate "$DOMAIN_NAME" "${back_port:-3220}"

    echo ""
    write_color "  Configuration pm2 startup..." YELLOW
    case "$WIZARD_OS" in
        linux)   pm2 startup systemd 2>&1 ;;
        windows) npm install -g pm2-windows-startup 2>&1 && pm2-windows-startup install 2>&1 || write_color "  → pm2 auto-startup non disponible sur Windows" YELLOW ;;
        macos)   pm2 startup launchd 2>&1 ;;
    esac

    prompt_launch legacy_prod_launch
    wait_enter
}

prod_nginx_generate() {
    domain="$1"
    back_port="$2"
    project_folder="$(cd "${PROJECT_DIR:-.}" && pwd)"
    [ "$WIZARD_OS" = "windows" ] && project_folder="$(cygpath -m "$project_folder")"

    if [ "$WIZARD_OS" = "linux" ] && [ -d /etc/nginx/sites-enabled ]; then
        for enabled_entry in /etc/nginx/sites-enabled/*; do
            [ -L "$enabled_entry" ] && [ -d "$enabled_entry" ] && sudo rm -f "$enabled_entry"
        done
    fi

    if [ -z "$domain" ]; then
        conf_name="default"
        server_name_directive="server_name _;"
        listen_block="    listen 80 default_server;\n    listen [::]:80 default_server;"
        ssl_block=""
    else
        conf_name="$domain"
        server_name_directive="server_name $domain;"
        cert_path=""
        case "$WIZARD_OS" in
            linux|macos) cert_path="/etc/letsencrypt/live/$domain" ;;
            windows)     cert_path="C:/Certbot/live/$domain" ;;
        esac

        ssl_block=""
        listen_block="    listen 80;\n    listen [::]:80;"
        if [ -d "$cert_path" ]; then
            listen_block="    listen 443 ssl;\n    listen [::]:443 ssl;"
            ssl_block="    ssl_certificate $cert_path/fullchain.pem;\n    ssl_certificate_key $cert_path/privkey.pem;\n"
        fi
    fi

    nginx_conf=""
    case "$WIZARD_OS" in
        linux)
            if [ -d "/etc/nginx/sites-available" ]; then
                nginx_conf="/etc/nginx/sites-available/$conf_name"
            else
                nginx_conf="/etc/nginx/conf.d/$conf_name.conf"
                sudo mkdir -p /etc/nginx/conf.d 2>/dev/null
            fi
            ;;
        windows)
            nginx_folder=$(_win_nginx_dir)
            nginx_conf="${nginx_folder}/conf/servers/${conf_name}.conf"
            ;;
        macos)
            if [ -d "/opt/homebrew/etc/nginx" ]; then
                nginx_conf="/opt/homebrew/etc/nginx/servers/$conf_name.conf"
            else
                nginx_conf="/usr/local/etc/nginx/servers/$conf_name.conf"
            fi
            ;;
    esac

    config_content="server {\n${listen_block}\n    ${server_name_directive}\n\n${ssl_block}\n    location / {\n        root $project_folder/FRONTENDV2/build;\n        index index.html;\n        try_files \$uri \$uri/ /index.html;\n    }\n\n    location /api {\n        proxy_pass http://localhost:$back_port;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade \$http_upgrade;\n        proxy_set_header Connection \"upgrade\";\n        proxy_set_header Host \$host;\n        proxy_set_header X-Real-IP \$remote_addr;\n    }\n\n    location /socket.io {\n        proxy_pass http://localhost:$back_port;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade \$http_upgrade;\n        proxy_set_header Connection \"upgrade\";\n        proxy_set_header Host \$host;\n    }\n}\n"

    if [ "$WIZARD_OS" = "linux" ]; then
        printf '%b\n' "$config_content" | sudo tee "$nginx_conf" > /dev/null
        case "$nginx_conf" in
            *sites-available*)
                sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null
                sudo ln -sf "$nginx_conf" "/etc/nginx/sites-enabled/$conf_name" 2>/dev/null
                ;;
        esac
        sudo nginx -t 2>&1
        nginx_result=$?
    elif [ "$WIZARD_OS" = "windows" ]; then
        nginx_folder=$(_win_nginx_dir)
        mkdir -p "${nginx_folder}/conf/servers" 2>/dev/null
        printf '%b\n' "$config_content" > "$nginx_conf" 2>/dev/null
        main_conf="${nginx_folder}/conf/nginx.conf"
        if ! grep -q 'include servers/' "$main_conf" 2>/dev/null; then
            sed_inplace '/http[[:space:]]*{/a\    include servers/*.conf;' "$main_conf" 2>/dev/null
        fi
        "$(_win_nginx_exe)" -p "$nginx_folder" -t 2>&1
        nginx_result=$?
    else
        printf '%b\n' "$config_content" > "$nginx_conf" 2>/dev/null
        nginx -t 2>&1
        nginx_result=$?
    fi

    if [ "$nginx_result" -eq 0 ]; then
        write_color "  [✓] Configuration nginx générée : $nginx_conf" GREEN
    else
        write_color "  [✗] Erreur dans la configuration nginx" RED
    fi
}
