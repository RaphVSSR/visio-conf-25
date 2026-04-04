#!/bin/bash

dev_ssl_setup() {
    write_color "  HTTPS local nécessaire ? (o/N)" YELLOW
    local answer
    read -p "  " answer
    if [[ "${answer,,}" != "o" && "${answer,,}" != "oui" ]]; then
        write_color "  → HTTP uniquement (défaut)" CYAN
        return
    fi

    local existing_cert
    existing_cert=$(extract_env_val "BACKEND/.env" "SSL_CRT_FILE" "")
    if [[ -n "$existing_cert" && -f "$existing_cert" ]]; then
        local issuer
        issuer=$(openssl x509 -issuer -noout -in "$existing_cert" 2>/dev/null)
        if echo "$issuer" | grep -qi "let's encrypt\|certbot"; then
            write_color "  [!] Certificat Let's Encrypt détecté" YELLOW
            write_color "  → Sera remplacé par un certificat mkcert local" YELLOW
            echo ""
        fi
    fi

    local cert_dir=".certs"
    mkdir -p "$cert_dir"

    if [[ -f "$cert_dir/localhost.pem" ]] && [[ -f "$cert_dir/localhost-key.pem" ]] \
       && openssl x509 -checkend 0 -noout -in "$cert_dir/localhost.pem" 2>/dev/null; then
        write_color "  [✓] Certificats valides dans $cert_dir/" GREEN
        _dev_ssl_apply "$cert_dir"
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

    mkcert -install 2>&1
    mkcert -cert-file "$cert_dir/localhost.pem" -key-file "$cert_dir/localhost-key.pem" localhost 127.0.0.1 ::1 2>&1

    if [[ ! -f "$cert_dir/localhost.pem" ]]; then
        write_color "  [✗] Échec de la génération des certificats" RED
        write_color "  → Poursuite en HTTP" YELLOW
        return
    fi

    write_color "  [✓] Certificats générés dans $cert_dir/" GREEN
    _dev_ssl_apply "$cert_dir"
}

_dev_ssl_apply() {
    local cert_dir="$1"

    local cert_abspath
    cert_abspath="$(cd "$cert_dir" && pwd)"
    [[ "$WIZARD_OS" == "windows" ]] && cert_abspath="$(cygpath -m "$cert_abspath")"

    write_color "  Configuration HTTPS dans les .env..." YELLOW

    local cert_path="${cert_abspath}/localhost.pem"
    local key_path="${cert_abspath}/localhost-key.pem"

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
