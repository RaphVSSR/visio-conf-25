#!/bin/sh

PROD_COMPOSE="compose.prod.yaml"

docker_prod_menu() {
    while true; do
        cd "$SCRIPT_DIR"
        clear
        show_submenu_header "Docker — Prod"

        pick_menu --style lines \
            --colors "GREEN,GREEN,RED,CYAN,RED" \
            "Installation" "Launch" "Stop" "Status" "Back"

        case $MENU_RESULT in
            0) docker_prod_install ;;
            1) docker_prod_launch ;;
            2) docker_prod_stop ;;
            3) docker_prod_status ;;
            4) return ;;
        esac
    done
}

docker_prod_install() {
    clear
    write_color "── Installation (Docker Prod) ──" CYAN
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
    generate_env "BACKEND/.env.template" "BACKEND/.env" "Backend" \
        "VERBOSE=false" "FLUSH_DB_ON_START=false"
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
    if [ -z "$backend_port" ]; then
        write_color "  [✗] PORT manquant dans BACKEND/.env" RED
        config_ready=false
    else
        write_color "  [✓] PORT backend : $backend_port" GREEN
    fi

    if [ "$config_ready" = "false" ]; then
        write_color "  [!] Configuration incomplete — corrigez les .env" RED
        wait_enter
        return 1
    fi

    echo ""
    _prod_ssl_detect

    echo ""
    write_color "  Construction et demarrage..." YELLOW
    if ! docker compose -f "$PROD_COMPOSE" up --build -d 2>&1; then
        write_color "  [✗] Echec de docker compose" RED
        wait_enter
        return 1
    fi

    echo ""
    write_color "  Attente du demarrage des services..." YELLOW
    sleep 10
    docker_health_report "$PROD_COMPOSE"

    wait_enter
}

docker_prod_launch() {
    clear
    write_color "── Launch (Docker Prod) ──" CYAN
    echo ""

    if ! locate_project; then
        wait_enter
        return
    fi

    if ! docker_has_containers "$PROD_COMPOSE"; then
        write_color "  Aucun conteneur trouve. Lancez d'abord Installation." YELLOW
        wait_enter
        return
    fi

    docker compose -f "$PROD_COMPOSE" up -d 2>&1

    echo ""
    write_color "  Attente du demarrage..." YELLOW
    sleep 5
    docker_health_report "$PROD_COMPOSE"

    wait_enter
}

docker_prod_stop() {
    clear
    write_color "── Stop (Docker Prod) ──" CYAN
    echo ""

    if ! locate_project; then
        wait_enter
        return
    fi

    if ! docker_has_containers "$PROD_COMPOSE"; then
        write_color "  Aucun conteneur en cours d'execution." YELLOW
        wait_enter
        return
    fi

    docker compose -f "$PROD_COMPOSE" down 2>&1
    write_color "  [✓] Conteneurs arretes" GREEN
    wait_enter
}

docker_prod_status() {
    clear

    if ! locate_project; then
        wait_enter
        return
    fi

    docker_health_report "$PROD_COMPOSE"
    wait_enter
}

_prod_ssl_detect() {
    write_color "── Configuration SSL ──" CYAN
    echo ""

    dev_cert_found=false
    if [ -f ".certs/localhost.pem" ]; then
        cert_issuer=$(openssl x509 -issuer -noout -in ".certs/localhost.pem" 2>/dev/null)
        if printf '%s' "$cert_issuer" | grep -qi "mkcert"; then
            write_color "  [!] Certificats mkcert (dev) detectes dans .certs/" YELLOW
            write_color "  → Utilisables pour tester, mais non valides en production" YELLOW
            dev_cert_found=true
        fi
    fi

    cert_folder=""
    case "$WIZARD_OS" in
        linux|macos) cert_folder="/etc/letsencrypt" ;;
        windows)     cert_folder="C:/Certbot" ;;
    esac

    if [ -d "$cert_folder" ]; then
        domain_entries=$(ls "$cert_folder/live/" 2>/dev/null | head -5)
        if [ -n "$domain_entries" ]; then
            write_color "  [✓] Certificats Let's Encrypt detectes :" GREEN
            printf '%s\n' "$domain_entries" | while IFS= read -r domain_entry; do
                [ -z "$domain_entry" ] && continue
                write_color "  ├─ $domain_entry" WHITE
            done
            echo ""
            write_color "  Les certificats seront montes via compose.prod.yaml" CYAN
            return 0
        fi
    fi

    if [ "$dev_cert_found" = "true" ]; then
        write_color "  → Aucun certificat prod trouve, les certs dev seront utilises" YELLOW
        return 0
    fi

    write_color "  [!] Aucun certificat SSL detecte" YELLOW
    echo ""
    printf '%s' "  Nom de domaine pour generer un certificat (Entree pour passer) : "
    read -r domain_name

    if [ -z "$domain_name" ]; then
        write_color "  → SSL ignore, le service demarrera sans HTTPS" YELLOW
        return 0
    fi

    _prod_ssl_generate "$domain_name"
}

_prod_ssl_generate() {
    domain_name="$1"

    cert_folder=""
    case "$WIZARD_OS" in
        linux|macos) cert_folder="/etc/letsencrypt/live/$domain_name" ;;
        windows)     cert_folder="C:/Certbot/live/$domain_name" ;;
    esac

    if [ -f "$cert_folder/fullchain.pem" ] \
       && openssl x509 -checkend 0 -noout -in "$cert_folder/fullchain.pem" 2>/dev/null; then
        write_color "  [✓] Certificat Let's Encrypt valide pour $domain_name" GREEN
        _prod_ssl_apply_env "$cert_folder/fullchain.pem" "$cert_folder/privkey.pem"
        return 0
    fi

    if ! command -v certbot > /dev/null 2>&1; then
        write_color "  [!] certbot non installe — installation..." YELLOW
        case "$WIZARD_OS" in
            linux)   sudo apt install -y certbot 2>&1 ;;
            windows) write_color "  → Installez certbot manuellement : https://certbot.eff.org" YELLOW ;;
            macos)   brew install certbot 2>&1 ;;
        esac
    fi

    if ! command -v certbot > /dev/null 2>&1; then
        write_color "  [✗] certbot indisponible — SSL ignore" RED
        return 1
    fi

    write_color "  Generation du certificat pour $domain_name..." YELLOW
    case "$WIZARD_OS" in
        windows)
            write_color "  [!] certbot necessite les droits administrateur" YELLOW
            powershell.exe -Command "Start-Process certbot -ArgumentList 'certonly','--standalone','-d','$domain_name' -Verb RunAs -Wait" 2>&1
            ;;
        *)
            sudo certbot certonly --standalone -d "$domain_name" 2>&1
            ;;
    esac

    if [ -f "$cert_folder/fullchain.pem" ] \
       && openssl x509 -checkend 0 -noout -in "$cert_folder/fullchain.pem" 2>/dev/null; then
        write_color "  [✓] Certificat SSL genere pour $domain_name" GREEN
        _prod_ssl_apply_env "$cert_folder/fullchain.pem" "$cert_folder/privkey.pem"
        return 0
    fi

    write_color "  [✗] Echec de la generation SSL" RED
    return 1
}

_prod_ssl_apply_env() {
    cert_file="$1"
    key_file="$2"

    if [ "$WIZARD_OS" = "windows" ]; then
        cert_file=$(cygpath -m "$cert_file" 2>/dev/null || echo "$cert_file")
        key_file=$(cygpath -m "$key_file" 2>/dev/null || echo "$key_file")
    fi

    for env_file in BACKEND/.env FRONTENDV2/.env; do
        [ -f "$env_file" ] || continue
        set_env_line "$env_file" "SSL_CRT_FILE" "$cert_file"
        set_env_line "$env_file" "SSL_KEY_FILE" "$key_file"
    done

    write_color "  [✓] Chemins SSL configures dans les .env" GREEN
}
