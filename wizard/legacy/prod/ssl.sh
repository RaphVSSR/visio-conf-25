#!/bin/bash

ssl_setup() {
    local domain="$1"

    write_color "── Configuration SSL ──" CYAN
    echo ""

    if [[ -z "$domain" ]]; then
        write_color "  [✗] Domaine requis pour le certificat SSL" RED
        return 1
    fi

    local cert_path=""
    case "$WIZARD_OS" in
        linux|macos) cert_path="/etc/letsencrypt/live/$domain" ;;
        windows)     cert_path="C:/Certbot/live/$domain" ;;
    esac

    if [[ -f "$cert_path/fullchain.pem" ]] \
       && openssl x509 -checkend 0 -noout -in "$cert_path/fullchain.pem" 2>/dev/null; then
        write_color "  [✓] Certificat SSL valide pour $domain" GREEN
        return 0
    fi

    if [[ -d "$cert_path" ]]; then
        write_color "  [!] Certificat expiré pour $domain — renouvellement..." YELLOW
    else
        write_color "  Aucun certificat trouvé pour $domain" YELLOW
    fi

    if ! command -v certbot > /dev/null 2>&1; then
        write_color "  Installation de certbot..." YELLOW
        case "$WIZARD_OS" in
            linux)   sudo apt install -y certbot python3-certbot-nginx 2>&1 ;;
            windows) _win_install "" "certbot" ;;
            macos)   brew install certbot 2>&1 ;;
        esac
    fi

    if ! command -v certbot > /dev/null 2>&1; then
        write_color "  [✗] Échec installation certbot" RED
        return 1
    fi

    write_color "  [✓] certbot détecté" GREEN
    write_color "  Génération du certificat..." YELLOW

    if certbot --nginx -d "$domain" 2>&1; then
        write_color "  [✓] Certificat SSL généré pour $domain" GREEN
        return 0
    fi

    write_color "  [✗] Échec de la génération SSL" RED
    return 1
}
