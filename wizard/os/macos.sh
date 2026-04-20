#!/bin/sh

macos_install_docker() {
    guard_brew || return 1
    write_color "  Installation de Docker Desktop via brew cask..." CYAN
    if ! brew install --cask docker 2>&1; then
        write_color "  [✗] Échec installation de Docker Desktop" RED
        return 1
    fi
    write_color "  Lancement de Docker Desktop..." YELLOW
    open -a Docker 2>&1
    sleep 5
    write_color "  [!] Docker Desktop peut prendre du temps à démarrer" YELLOW
}

macos_install_node() {
    guard_brew || return 1
    write_color "  Installation de Node.js via brew..." CYAN
    if ! brew install node 2>&1; then
        write_color "  [✗] Échec installation de Node.js" RED
        return 1
    fi
}

macos_install_nginx() {
    guard_brew || return 1
    write_color "  Installation de Nginx via brew..." CYAN
    if ! brew install nginx 2>&1; then
        write_color "  [✗] Échec installation de Nginx" RED
        return 1
    fi
}

macos_install_mongo() {
    guard_brew || return 1
    write_color "  Ajout du tap mongodb/brew..." CYAN
    if ! brew tap mongodb/brew 2>&1; then
        write_color "  [✗] Échec ajout du tap mongodb/brew" RED
        return 1
    fi
    write_color "  Installation de mongodb-community..." CYAN
    if ! brew install mongodb-community 2>&1; then
        write_color "  [✗] Échec installation de mongodb-community" RED
        return 1
    fi
}

macos_start_mongo() {
    guard_brew || return 1
    write_color "  Démarrage du service mongodb-community..." YELLOW
    if ! brew services start mongodb-community 2>&1; then
        write_color "  [✗] Échec démarrage du service mongodb-community" RED
        write_color "  → Lancez 'brew services list' pour l'état détaillé" YELLOW
        return 1
    fi
}

macos_start_nginx() {
    guard_brew || return 1
    write_color "  Démarrage du service nginx..." YELLOW
    if ! brew services start nginx 2>&1; then
        write_color "  [✗] Échec démarrage du service nginx" RED
        return 1
    fi
}

macos_stop_nginx() {
    guard_brew || return 1
    write_color "  Arrêt du service nginx..." YELLOW
    if ! brew services stop nginx 2>&1; then
        write_color "  [✗] Échec arrêt du service nginx" RED
        return 1
    fi
}

macos_reload_nginx() {
    write_color "  Rechargement de la configuration nginx..." YELLOW
    if ! nginx -s reload 2>&1; then
        write_color "  [✗] Échec reload nginx" RED
        return 1
    fi
}

macos_check_mongo() {
    guard_brew || { echo "missing"; return 0; }
    if brew services list 2>/dev/null | grep mongodb | grep -q started; then
        echo "running"
        return 0
    fi
    if brew list mongodb-community >/dev/null 2>&1; then
        echo "stopped"
        return 0
    fi
    echo "missing"
}

macos_check_nginx() {
    guard_brew || return 1
    brew services list 2>/dev/null | grep nginx | grep -q started
}

macos_install_pm2() {
    if ! command -v npm > /dev/null 2>&1; then
        write_color "  [✗] npm manquant — installez node d'abord" RED
        return 1
    fi
    npm install -g pm2 2>&1 || { write_color "  [✗] Échec install pm2" RED; return 1; }
}

macos_install_mkcert() {
    guard_brew || return 1
    brew install mkcert 2>&1 || { write_color "  [✗] Échec install mkcert" RED; return 1; }
}

macos_install_certbot() {
    guard_brew || return 1
    brew install certbot 2>&1 || { write_color "  [✗] Échec install certbot" RED; return 1; }
}
