#!/bin/sh

_linux_apt_install() {
    pkgs_list="$1"
    guard_apt || return 1
    guard_sudo || return 1
    write_color "  Mise à jour des index apt..." YELLOW
    if ! sudo apt update -qq 2>&1; then
        write_color "  [✗] Échec 'apt update' — vérifiez votre connexion et vos dépôts" RED
        return 1
    fi
    write_color "  Installation des paquets : $pkgs_list" YELLOW
    if ! sudo apt install -y $pkgs_list 2>&1; then
        write_color "  [✗] Échec installation apt : $pkgs_list" RED
        write_color "  → Vérifiez la disponibilité : sudo apt-cache policy $pkgs_list" YELLOW
        return 1
    fi
}

_linux_clean_stale_repo() {
    repo_list="$1"
    repo_key="$2"
    if [ -f "$repo_list" ] && [ ! -s "$repo_key" ]; then
        write_color "  [!] Dépôt obsolète détecté sans clé — nettoyage : $repo_list" YELLOW
        sudo rm -f "$repo_list" 2>/dev/null || rm -f "$repo_list" 2>/dev/null
    fi
}

_linux_add_repo() {
    repo_url="$1"
    repo_key="$2"
    repo_line="$3"
    repo_list="$4"
    _linux_clean_stale_repo "$repo_list" "$repo_key"
    guard_curl || return 1
    guard_gpg || return 1
    guard_sudo || return 1
    write_color "  Téléchargement de la clé GPG : $repo_url" YELLOW
    if ! curl -fsSL "$repo_url" | sudo gpg --dearmor -o "$repo_key" 2>&1; then
        write_color "  [✗] Échec récupération clé GPG depuis $repo_url" RED
        write_color "  → Vérifiez votre accès réseau et les permissions sur $repo_key" YELLOW
        return 1
    fi
    write_color "  Ajout du dépôt apt : $repo_list" YELLOW
    if ! echo "$repo_line" | sudo tee "$repo_list" > /dev/null; then
        write_color "  [✗] Échec écriture du fichier dépôt $repo_list" RED
        return 1
    fi
}

linux_install_docker() {
    guard_curl || { write_color "  → Relancez setup.sh pour installer les prérequis" YELLOW; return 1; }
    docker_code=$(_linux_verify_repo_codename "Docker" \
        "https://download.docker.com/linux/$WIZARD_DISTRO/dists/" \
        "/InRelease" \
        "$WIZARD_CODENAME" \
        "https://docs.docker.com/engine/install/") || return 1
    dock_key="/usr/share/keyrings/docker-archive-keyring.gpg"
    dock_list="/etc/apt/sources.list.d/docker.list"
    dock_line="deb [signed-by=$dock_key] https://download.docker.com/linux/$WIZARD_DISTRO $docker_code stable"
    write_color "  Préparation dépôt Docker ($WIZARD_DISTRO/$docker_code)..." CYAN
    _linux_add_repo "https://download.docker.com/linux/$WIZARD_DISTRO/gpg" "$dock_key" "$dock_line" "$dock_list" || return 1
    _linux_apt_install "docker-ce docker-ce-cli containerd.io docker-compose-plugin" || return 1
    guard_systemd || return 1
    write_color "  Démarrage du service Docker..." YELLOW
    if ! sudo systemctl start docker 2>&1; then
        write_color "  [✗] Échec démarrage du service docker" RED
        write_color "  → Lancez 'sudo journalctl -u docker' pour plus de détails" YELLOW
        return 1
    fi
    if ! user_in_docker_group; then
        write_color "  Ajout de $USER au groupe docker..." YELLOW
        sudo usermod -aG docker "$USER" 2>&1
        write_color "  [!] Redémarrez votre session WSL puis relancez (wsl --shutdown)" YELLOW
    fi
}

linux_install_node() {
    write_color "  Installation de Node.js via apt..." CYAN
    _linux_apt_install "nodejs npm"
}

linux_install_nginx() {
    write_color "  Installation de Nginx via apt..." CYAN
    _linux_apt_install "nginx"
}

_linux_mongo_component() {
    case "$WIZARD_DISTRO" in
        debian) echo "main" ;;
        ubuntu) echo "multiverse" ;;
        *)      echo "main" ;;
    esac
}

_linux_mongo_codename() {
    case "$WIZARD_DISTRO" in
        debian)
            case "$WIZARD_CODENAME" in
                bullseye|bookworm) echo "$WIZARD_CODENAME" ;;
                *)
                    write_color "  [i] MongoDB v8 ne supporte pas $WIZARD_CODENAME — repli sur bookworm" CYAN 1>&2
                    echo "bookworm"
                    ;;
            esac
            ;;
        ubuntu)
            case "$WIZARD_CODENAME" in
                focal|jammy|noble) echo "$WIZARD_CODENAME" ;;
                *)
                    write_color "  [i] MongoDB v8 ne supporte pas $WIZARD_CODENAME — repli sur noble" CYAN 1>&2
                    echo "noble"
                    ;;
            esac
            ;;
        *)
            echo "$WIZARD_CODENAME"
            ;;
    esac
}

_linux_verify_repo_codename() {
    repo_label="$1"
    url_prefix="$2"
    url_suffix="$3"
    initial_code="$4"
    docs_url="$5"

    code_try="$initial_code"
    attempts=0
    while :; do
        test_url="${url_prefix}${code_try}${url_suffix}"
        write_color "  Vérification du dépôt $repo_label ($WIZARD_DISTRO/$code_try)..." YELLOW 1>&2
        if curl -fsI --max-time 5 "$test_url" > /dev/null 2>&1; then
            write_color "  [✓] Dépôt $repo_label accessible" GREEN 1>&2
            echo "$code_try"
            return 0
        fi
        write_color "  [✗] Dépôt indisponible : $test_url" RED 1>&2
        attempts=$((attempts + 1))
        if [ "$attempts" -ge 3 ]; then
            write_color "  [✗] 3 tentatives échouées — abandon" RED 1>&2
            write_color "  → Consultez $docs_url" YELLOW 1>&2
            return 1
        fi
        printf '  Entrez un codename alternatif (laissez vide puis Entrée pour annuler et revenir au menu) : ' 1>&2
        read -r new_code
        if [ -z "$new_code" ]; then
            write_color "  [!] Installation $repo_label annulée" YELLOW 1>&2
            return 1
        fi
        code_try="$new_code"
    done
}

linux_install_mongo() {
    guard_curl || { write_color "  → Relancez setup.sh pour installer les prérequis" YELLOW; return 1; }
    mongo_component=$(_linux_mongo_component)
    mongo_input=$(_linux_mongo_codename)
    mongo_code=$(_linux_verify_repo_codename "MongoDB" \
        "https://repo.mongodb.org/apt/$WIZARD_DISTRO/dists/" \
        "/mongodb-org/8.0/InRelease" \
        "$mongo_input" \
        "https://www.mongodb.com/docs/manual/installation/") || return 1
    mong_key="/usr/share/keyrings/mongodb-server-8.0.gpg"
    mong_list="/etc/apt/sources.list.d/mongodb-org-8.0.list"
    mong_line="deb [signed-by=$mong_key] https://repo.mongodb.org/apt/$WIZARD_DISTRO $mongo_code/mongodb-org/8.0 $mongo_component"
    write_color "  Préparation dépôt MongoDB ($WIZARD_DISTRO/$mongo_code/$mongo_component)..." CYAN
    _linux_add_repo "https://www.mongodb.org/static/pgp/server-8.0.asc" "$mong_key" "$mong_line" "$mong_list" || return 1
    _linux_apt_install "mongodb-org"
}

linux_start_mongo() {
    guard_systemd || return 1
    write_color "  Démarrage du service mongod..." YELLOW
    if ! sudo systemctl start mongod 2>&1; then
        write_color "  [✗] Échec démarrage du service mongod" RED
        write_color "  → Lancez 'sudo journalctl -u mongod' pour plus de détails" YELLOW
        return 1
    fi
}

linux_start_nginx() {
    guard_systemd || return 1
    write_color "  Démarrage du service nginx..." YELLOW
    if ! sudo systemctl start nginx 2>&1; then
        write_color "  [✗] Échec démarrage du service nginx" RED
        write_color "  → Lancez 'sudo nginx -t' pour vérifier la config" YELLOW
        return 1
    fi
}

linux_stop_nginx() {
    guard_systemd || return 1
    write_color "  Arrêt du service nginx..." YELLOW
    if ! sudo systemctl stop nginx 2>&1; then
        write_color "  [✗] Échec arrêt du service nginx" RED
        return 1
    fi
}

linux_reload_nginx() {
    write_color "  Rechargement de la configuration nginx..." YELLOW
    if ! sudo nginx -s reload 2>&1; then
        write_color "  [✗] Échec reload nginx" RED
        write_color "  → Lancez 'sudo nginx -t' pour vérifier la config" YELLOW
        return 1
    fi
}

linux_check_mongo() {
    if systemctl is-active mongod > /dev/null 2>&1; then
        echo "running"
        return
    fi
    if systemctl list-unit-files 2>/dev/null | grep -q mongod; then
        echo "stopped"
        return
    fi
    if command -v mongod > /dev/null 2>&1; then
        echo "stopped"
        return
    fi
    echo "missing"
}

linux_check_nginx() {
    systemctl is-active nginx > /dev/null 2>&1
}

linux_install_pm2() {
    if ! command -v npm > /dev/null 2>&1; then
        write_color "  [✗] npm manquant — installez node d'abord" RED
        return 1
    fi
    npm install -g pm2 2>&1 || { write_color "  [✗] Échec install pm2" RED; return 1; }
}

linux_install_mkcert() {
    _linux_apt_install "mkcert"
}

linux_install_certbot() {
    _linux_apt_install "certbot python3-certbot-nginx"
}
