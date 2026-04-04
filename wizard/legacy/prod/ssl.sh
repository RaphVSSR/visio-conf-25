#!/bin/bash

prod_ssl_setup() {
    local domain="$1"

    write_color "── Configuration SSL ──" CYAN
    echo ""

    if [[ -z "$domain" ]]; then
        write_color "  [✗] Domaine requis pour le certificat SSL" RED
        return 1
    fi

    local dev_cert
    dev_cert=$(extract_env_val "BACKEND/.env" "SSL_CRT_FILE" "")
    [[ -z "$dev_cert" || ! -f "$dev_cert" ]] && [[ -f ".certs/localhost.pem" ]] && dev_cert=".certs/localhost.pem"
    if [[ -n "$dev_cert" && -f "$dev_cert" ]]; then
        local issuer
        issuer=$(openssl x509 -issuer -noout -in "$dev_cert" 2>/dev/null)
        if echo "$issuer" | grep -qi "mkcert"; then
            write_color "  [!] Certificat mkcert (dev) détecté" YELLOW
            write_color "  → Sera remplacé par Let's Encrypt si disponible" YELLOW
            echo ""
        fi
    fi

    local cert_path=""
    case "$WIZARD_OS" in
        linux|macos) cert_path="/etc/letsencrypt/live/$domain" ;;
        windows)     cert_path="C:/Certbot/live/$domain" ;;
    esac

    if [[ -f "$cert_path/fullchain.pem" ]] \
       && openssl x509 -checkend 0 -noout -in "$cert_path/fullchain.pem" 2>/dev/null; then
        write_color "  [✓] Certificat Let's Encrypt valide pour $domain" GREEN
        _prod_ssl_apply "$cert_path/fullchain.pem" "$cert_path/privkey.pem"
        return 0
    fi

    if [[ -d "$cert_path" ]]; then
        write_color "  [!] Certificat expiré pour $domain — renouvellement..." YELLOW
    else
        write_color "  Aucun certificat Let's Encrypt pour $domain" YELLOW
    fi

    if ! command -v certbot > /dev/null 2>&1; then
        write_color "  Installation de certbot..." YELLOW
        case "$WIZARD_OS" in
            linux)   sudo apt install -y certbot python3-certbot-nginx 2>&1 ;;
            windows) _win_install "EFF.Certbot" "certbot" ;;
            macos)   brew install certbot 2>&1 ;;
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
            certbot --nginx -d "$domain" 2>&1
            ;;
        macos)
            certbot --nginx -d "$domain" 2>&1
            ;;
    esac

    if [[ -f "$cert_path/fullchain.pem" ]] \
       && openssl x509 -checkend 0 -noout -in "$cert_path/fullchain.pem" 2>/dev/null; then
        write_color "  [✓] Certificat SSL généré pour $domain" GREEN
        _prod_ssl_apply "$cert_path/fullchain.pem" "$cert_path/privkey.pem"
        return 0
    fi

    write_color "  [✗] Échec de la génération SSL" RED
    return 1
}

_prod_ssl_apply() {
    local cert_file="$1"
    local key_file="$2"

    [[ "$WIZARD_OS" == "windows" ]] && {
        cert_file=$(cygpath -m "$cert_file" 2>/dev/null || echo "$cert_file")
        key_file=$(cygpath -m "$key_file" 2>/dev/null || echo "$key_file")
    }

    sed -i "s|^SSL_CRT_FILE=.*|SSL_CRT_FILE=${cert_file}|" BACKEND/.env 2>/dev/null
    sed -i "s|^SSL_KEY_FILE=.*|SSL_KEY_FILE=${key_file}|" BACKEND/.env 2>/dev/null
    sed -i "s|^FRONTEND_URL=http://|FRONTEND_URL=https://|" BACKEND/.env 2>/dev/null
    sed -i "s|^FILE_STORAGE_URL=http://|FILE_STORAGE_URL=https://|" BACKEND/.env 2>/dev/null
    sed -i "s|^PROFILE_PICTURES_URL=http://|PROFILE_PICTURES_URL=https://|" BACKEND/.env 2>/dev/null

    sed -i "s|^SSL_CRT_FILE=.*|SSL_CRT_FILE=${cert_file}|" FRONTENDV2/.env 2>/dev/null
    sed -i "s|^SSL_KEY_FILE=.*|SSL_KEY_FILE=${key_file}|" FRONTENDV2/.env 2>/dev/null
    sed -i "s|^REACT_APP_BACKEND_API_URL=http://|REACT_APP_BACKEND_API_URL=https://|" FRONTENDV2/.env 2>/dev/null
    sed -i "s|^REACT_APP_BACKEND_FILE_STORAGE_URL=http://|REACT_APP_BACKEND_FILE_STORAGE_URL=https://|" FRONTENDV2/.env 2>/dev/null
    sed -i "s|^REACT_APP_BACKEND_PROFILE_PICTURES_URL=http://|REACT_APP_BACKEND_PROFILE_PICTURES_URL=https://|" FRONTENDV2/.env 2>/dev/null
}
