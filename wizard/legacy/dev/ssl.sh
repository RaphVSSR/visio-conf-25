#!/bin/sh

dev_ssl_setup() {
    write_color "  HTTPS local nécessaire ? (o/N)" YELLOW
    printf '%s' "  "
    read -r answer
    answer_lower=$(echo "$answer" | tr '[:upper:]' '[:lower:]')
    if [ "$answer_lower" != "o" ] && [ "$answer_lower" != "oui" ]; then
        write_color "  → HTTP uniquement (défaut)" CYAN
        return
    fi

    existing_certificate=$(extract_env_val "BACKEND/.env" "SSL_CRT_FILE" "")
    if [ -n "$existing_certificate" ] && [ -f "$existing_certificate" ]; then
        certificate_issuer=$(openssl x509 -issuer -noout -in "$existing_certificate" 2>/dev/null)
        if echo "$certificate_issuer" | grep -qi "let's encrypt\|certbot"; then
            write_color "  [!] Certificat Let's Encrypt détecté" YELLOW
            write_color "  → Sera remplacé par un certificat mkcert local" YELLOW
            echo ""
        fi
    fi

    certificate_folder=".certs"
    mkdir -p "$certificate_folder"

    if [ -f "$certificate_folder/localhost.pem" ] && [ -f "$certificate_folder/localhost-key.pem" ] \
       && openssl x509 -checkend 0 -noout -in "$certificate_folder/localhost.pem" 2>/dev/null; then
        write_color "  [✓] Certificats valides dans $certificate_folder/" GREEN
        _dev_ssl_apply "$certificate_folder"
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
    mkcert -cert-file "$certificate_folder/localhost.pem" -key-file "$certificate_folder/localhost-key.pem" localhost 127.0.0.1 ::1 2>&1

    if [ ! -f "$certificate_folder/localhost.pem" ]; then
        write_color "  [✗] Échec de la génération des certificats" RED
        write_color "  → Poursuite en HTTP" YELLOW
        return
    fi

    write_color "  [✓] Certificats générés dans $certificate_folder/" GREEN
    _dev_ssl_apply "$certificate_folder"
}

_dev_ssl_apply() {
    certificate_folder="$1"

    certificate_abspath="$(cd "$certificate_folder" && pwd)"
    [ "$WIZARD_OS" = "windows" ] && certificate_abspath="$(cygpath -m "$certificate_abspath")"

    write_color "  Configuration HTTPS dans les .env..." YELLOW

    certificate_path="${certificate_abspath}/localhost.pem"
    private_key_path="${certificate_abspath}/localhost-key.pem"

    for environment_file in BACKEND/.env FRONTENDV2/.env; do
        set_env_line "$environment_file" "SSL_CRT_FILE" "$certificate_path"
        set_env_line "$environment_file" "SSL_KEY_FILE" "$private_key_path"
    done

    sed_inplace "s|^FRONTEND_URL=http://|FRONTEND_URL=https://|" BACKEND/.env
    sed_inplace "s|^FILE_STORAGE_URL=http://|FILE_STORAGE_URL=https://|" BACKEND/.env
    sed_inplace "s|^PROFILE_PICTURES_URL=http://|PROFILE_PICTURES_URL=https://|" BACKEND/.env

    sed_inplace "s|^REACT_APP_BACKEND_API_URL=http://|REACT_APP_BACKEND_API_URL=https://|" FRONTENDV2/.env
    sed_inplace "s|^REACT_APP_BACKEND_FILE_STORAGE_URL=http://|REACT_APP_BACKEND_FILE_STORAGE_URL=https://|" FRONTENDV2/.env
    sed_inplace "s|^REACT_APP_BACKEND_PROFILE_PICTURES_URL=http://|REACT_APP_BACKEND_PROFILE_PICTURES_URL=https://|" FRONTENDV2/.env

    write_color "  [✓] HTTPS configuré (backend + frontend)" GREEN
}
