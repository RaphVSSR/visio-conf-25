#!/bin/bash

ssl_setup() {
    local domain="$1"

    write_color "── Configuration SSL ──" CYAN
    echo ""

    if [[ -z "$domain" ]]; then
        write_color "  Pas de domaine fourni, HTTP uniquement." YELLOW
        return
    fi

    local cert_path=""
    case "$WIZARD_OS" in
        linux|macos) cert_path="/etc/letsencrypt/live/$domain" ;;
        windows)     cert_path="C:/Certbot/live/$domain" ;;
    esac

    if [[ -d "$cert_path" ]]; then
        write_color "  [✓] Certificat SSL existant détecté pour $domain" GREEN
        write_color "  → Utilisation du certificat existant" CYAN
        return 0
    fi

    write_color "  Aucun certificat trouvé pour $domain" YELLOW

    if command -v certbot > /dev/null 2>&1; then
        write_color "  [✓] certbot détecté" GREEN
        echo ""
        write_color "  Génération automatique du certificat..." YELLOW
        if certbot --nginx -d "$domain" 2>&1; then
            write_color "  [✓] Certificat SSL généré" GREEN
            return 0
        else
            write_color "  [✗] Échec de la génération SSL" RED
            write_color "  → Poursuite en HTTP uniquement" YELLOW
            return 1
        fi
    fi

    write_color "  [✗] certbot introuvable" RED
    echo ""
    write_color "  Installer certbot ? (o/N)" YELLOW
    local answer
    read -p "  " answer

    if [[ "${answer,,}" == "o" || "${answer,,}" == "oui" ]]; then
        write_color "  Installation de certbot..." YELLOW
        case "$WIZARD_OS" in
            linux)
                sudo apt install -y certbot python3-certbot-nginx 2>&1
                ;;
            windows)
                _win_install "" "certbot"
                ;;
            macos)
                brew install certbot 2>&1
                brew install certbot --nginx 2>&1 || true
                ;;
        esac

        if command -v certbot > /dev/null 2>&1; then
            write_color "  Génération du certificat..." YELLOW
            if certbot --nginx -d "$domain" 2>&1; then
                write_color "  [✓] Certificat SSL généré" GREEN
                return 0
            fi
        fi
    fi

    write_color "  [!] Poursuite en HTTP uniquement" YELLOW
    write_color "  → HTTPS fortement recommandé en production" RED
    return 1
}
