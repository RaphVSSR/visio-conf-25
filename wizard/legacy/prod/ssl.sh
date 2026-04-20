#!/bin/sh

prod_ssl_setup() {
    domain="$1"

    write_color "── Configuration SSL ──" CYAN
    echo ""

    if [ -z "$domain" ]; then
        write_color "  [✗] Domaine requis pour le certificat SSL" RED
        return 1
    fi

    if [ "$WIZARD_OS" = "linux" ] && [ -d /etc/nginx/sites-enabled ]; then
        for enabled_entry in /etc/nginx/sites-enabled/*; do
            [ -L "$enabled_entry" ] && [ -d "$enabled_entry" ] && sudo rm -f "$enabled_entry"
        done
    fi

    dev_cert=$(extract_env_val "BACKEND/.env" "SSL_CRT_FILE" "")
    if [ -z "$dev_cert" ] || [ ! -f "$dev_cert" ]; then
        if [ -f ".certs/localhost.pem" ]; then
            dev_cert=".certs/localhost.pem"
        fi
    fi
    if [ -n "$dev_cert" ] && [ -f "$dev_cert" ]; then
        issuer=$(openssl x509 -issuer -noout -in "$dev_cert" 2>/dev/null)
        if echo "$issuer" | grep -qi "mkcert"; then
            write_color "  [!] Certificat mkcert (dev) détecté" YELLOW
            write_color "  → Sera remplacé par Let's Encrypt si disponible" YELLOW
            echo ""
        fi
    fi

    cert_path=""
    case "$WIZARD_OS" in
        linux|macos) cert_path="/etc/letsencrypt/live/$domain" ;;
        windows)     cert_path="C:/Certbot/live/$domain" ;;
    esac

    if [ -f "$cert_path/fullchain.pem" ] \
       && openssl x509 -checkend 0 -noout -in "$cert_path/fullchain.pem" 2>/dev/null; then
        write_color "  [✓] Certificat Let's Encrypt valide pour $domain" GREEN
        _prod_ssl_apply "$cert_path/fullchain.pem" "$cert_path/privkey.pem"
        return 0
    fi

    if [ -d "$cert_path" ]; then
        write_color "  [!] Certificat expiré pour $domain — renouvellement..." YELLOW
    else
        write_color "  Aucun certificat Let's Encrypt pour $domain" YELLOW
    fi

    if ! command -v certbot > /dev/null 2>&1; then
        write_color "  Installation de certbot..." YELLOW
        case "$WIZARD_OS" in
            linux)   sudo apt install -y certbot python3-certbot-nginx 2>&1 ;;
            windows) _win_install "EFF.Certbot" "certbot" ;;
            macos)   brew install certbot 2>&1 && brew install certbot-nginx 2>&1 ;;
        esac
    fi

    if ! command -v certbot > /dev/null 2>&1; then
        write_color "  [✗] Échec installation certbot" RED
        return 1
    fi

    write_color "  [✓] certbot détecté" GREEN
    write_color "  Génération du certificat..." YELLOW

    case "$WIZARD_OS" in
        windows)
            write_color "  [!] certbot nécessite les droits administrateur" YELLOW
            powershell.exe -Command "Start-Process certbot -ArgumentList 'certonly','--standalone','-d','$domain' -Verb RunAs -Wait" 2>&1
            ;;
        linux)
            sudo certbot --nginx -d "$domain" 2>&1
            ;;
        macos)
            sudo certbot --nginx -d "$domain" 2>&1
            ;;
    esac

    if [ -f "$cert_path/fullchain.pem" ] \
       && openssl x509 -checkend 0 -noout -in "$cert_path/fullchain.pem" 2>/dev/null; then
        write_color "  [✓] Certificat SSL généré pour $domain" GREEN
        _prod_ssl_apply "$cert_path/fullchain.pem" "$cert_path/privkey.pem"
        return 0
    fi

    write_color "  [✗] Échec de la génération SSL" RED
    return 1
}

_prod_ssl_apply() {
    cert_file="$1"
    key_file="$2"

    if [ "$WIZARD_OS" = "windows" ]; then
        cert_file=$(cygpath -m "$cert_file" 2>/dev/null || echo "$cert_file")
        key_file=$(cygpath -m "$key_file" 2>/dev/null || echo "$key_file")
    fi

    for env_file in BACKEND/.env FRONTENDV2/.env; do
        set_env_line "$env_file" "SSL_CRT_FILE" "$cert_file"
        set_env_line "$env_file" "SSL_KEY_FILE" "$key_file"
    done

    sed_inplace "s|^FRONTEND_URL=http://|FRONTEND_URL=https://|" BACKEND/.env 2>/dev/null
    sed_inplace "s|^FILE_STORAGE_URL=http://|FILE_STORAGE_URL=https://|" BACKEND/.env 2>/dev/null
    sed_inplace "s|^PROFILE_PICTURES_URL=http://|PROFILE_PICTURES_URL=https://|" BACKEND/.env 2>/dev/null
    sed_inplace "s|^REACT_APP_BACKEND_API_URL=http://|REACT_APP_BACKEND_API_URL=https://|" FRONTENDV2/.env 2>/dev/null
    sed_inplace "s|^REACT_APP_BACKEND_FILE_STORAGE_URL=http://|REACT_APP_BACKEND_FILE_STORAGE_URL=https://|" FRONTENDV2/.env 2>/dev/null
    sed_inplace "s|^REACT_APP_BACKEND_PROFILE_PICTURES_URL=http://|REACT_APP_BACKEND_PROFILE_PICTURES_URL=https://|" FRONTENDV2/.env 2>/dev/null
}
