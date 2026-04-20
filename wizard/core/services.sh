#!/bin/sh

BASE_DEPS_LINUX="node"
BASE_DEPS_MACOS="node"
BASE_DEPS_WINDOWS="node"

DEV_DEPS_LINUX="mkcert"
DEV_DEPS_MACOS="mkcert"
DEV_DEPS_WINDOWS="mkcert"

PROD_DEPS_LINUX="pm2 nginx certbot"
PROD_DEPS_MACOS="pm2 nginx certbot"
PROD_DEPS_WINDOWS="pm2 nginx certbot"

_dispatch() {
    action_name="$1"
    shift
    handler_fn="${WIZARD_OS}_${action_name}"
    if ! command -v "$handler_fn" > /dev/null 2>&1; then
        write_color "  [✗] Action '$action_name' non supportée sur $WIZARD_OS" RED
        return 1
    fi
    "$handler_fn" "$@"
}

install_docker()  { _dispatch install_docker  "$@"; }
install_node()    { _dispatch install_node    "$@"; }
install_nginx()   { _dispatch install_nginx   "$@"; }
install_mongo()   { _dispatch install_mongo   "$@"; }
install_pm2()     { _dispatch install_pm2     "$@"; }
install_mkcert()  { _dispatch install_mkcert  "$@"; }
install_certbot() { _dispatch install_certbot "$@"; }

start_mongo()    { _dispatch start_mongo    "$@"; }
start_nginx()    { _dispatch start_nginx    "$@"; }
stop_nginx()     { _dispatch stop_nginx     "$@"; }
reload_nginx()   { _dispatch reload_nginx   "$@"; }

check_mongo()    { _dispatch check_mongo    "$@"; }
check_nginx()    { _dispatch check_nginx    "$@"; }

user_in_docker_group() {
    id -nG "${USER:-$(id -un)}" 2>/dev/null | tr ' ' '\n' | grep -qx docker
}

ensure_docker_access() {
    docker_err=$(docker info 2>&1 > /dev/null)
    if [ -z "$docker_err" ]; then
        write_color "  [✓] Accès docker OK" GREEN
        return 0
    fi
    case "$docker_err" in
        *permission\ denied*|*Permission\ denied*)
            write_color "  [✗] Accès docker refusé — session non rafraîchie" RED
            if user_in_docker_group; then
                write_color "  → Groupe docker OK mais session stale. Lancez 'wsl --shutdown' depuis Windows puis relancez setup.sh" YELLOW
            else
                write_color "  → Ajoutez l'utilisateur : sudo usermod -aG docker \$USER" YELLOW
                write_color "  → Puis 'wsl --shutdown' depuis Windows et relancez" YELLOW
            fi
            ;;
        *Cannot\ connect*|*daemon*)
            write_color "  [✗] Daemon Docker injoignable" RED
            write_color "  → Démarrez Docker Desktop (ou sudo systemctl start docker)" YELLOW
            ;;
        *)
            write_color "  [✗] Erreur docker : $docker_err" RED
            ;;
    esac
    return 1
}

_service_is_installed() {
    svc_name="$1"
    case "$svc_name" in
        nginx)
            if [ "$WIZARD_OS" = "windows" ]; then
                nginx_exe=$(_win_nginx_exe 2>/dev/null)
                [ -n "$nginx_exe" ] && [ -f "$nginx_exe" ]
                return
            fi
            command -v nginx > /dev/null 2>&1
            ;;
        *)
            command -v "$svc_name" > /dev/null 2>&1
            ;;
    esac
}

_install_service_by_name() {
    svc_name="$1"
    case "$svc_name" in
        node)    install_node ;;
        pm2)     install_pm2 ;;
        nginx)   install_nginx ;;
        mkcert)  install_mkcert ;;
        certbot) install_certbot ;;
        docker)  install_docker ;;
        mongo)   install_mongo ;;
        *)       write_color "  [✗] Service inconnu : $svc_name" RED; return 1 ;;
    esac
}

ensure_services() {
    mode_name="${1:-base}"
    services_list=""
    case "$mode_name" in
        base)
            case "$WIZARD_OS" in
                linux)   services_list="$BASE_DEPS_LINUX" ;;
                macos)   services_list="$BASE_DEPS_MACOS" ;;
                windows) services_list="$BASE_DEPS_WINDOWS" ;;
            esac
            header_label="dépendances — base"
            ;;
        dev)
            case "$WIZARD_OS" in
                linux)   services_list="$BASE_DEPS_LINUX $DEV_DEPS_LINUX" ;;
                macos)   services_list="$BASE_DEPS_MACOS $DEV_DEPS_MACOS" ;;
                windows) services_list="$BASE_DEPS_WINDOWS $DEV_DEPS_WINDOWS" ;;
            esac
            header_label="dépendances — développement"
            ;;
        prod)
            case "$WIZARD_OS" in
                linux)   services_list="$BASE_DEPS_LINUX $PROD_DEPS_LINUX" ;;
                macos)   services_list="$BASE_DEPS_MACOS $PROD_DEPS_MACOS" ;;
                windows) services_list="$BASE_DEPS_WINDOWS $PROD_DEPS_WINDOWS" ;;
            esac
            header_label="dépendances — production"
            ;;
        *)
            write_color "  [✗] Mode inconnu : $mode_name" RED
            return 1
            ;;
    esac
    [ -z "$services_list" ] && return 0

    write_color "── Vérification des $header_label ──" CYAN
    missing_services=""
    for svc_name in $services_list; do
        if _service_is_installed "$svc_name"; then
            write_color "  [✓] $svc_name déjà présent" GREEN
        else
            write_color "  [!] $svc_name manquant" YELLOW
            missing_services="$missing_services $svc_name"
        fi
    done
    missing_services="${missing_services# }"

    if [ -z "$missing_services" ]; then
        write_color "  Toutes les $header_label sont en place" CYAN
        return 0
    fi

    echo ""
    printf '%s' "  Installer les dépendances manquantes ? [O/n] : "
    read -r consent_answer
    case "$consent_answer" in
        n|N|no|NO|non|NON)
            write_color "  [✗] Installation refusée" RED
            sleep 3
            return 1
            ;;
    esac

    for svc_name in $missing_services; do
        echo ""
        write_color "  → Installation de $svc_name..." YELLOW
        if ! _install_service_by_name "$svc_name"; then
            write_color "  [✗] Échec installation $svc_name" RED
            return 1
        fi
    done

    echo ""
    for svc_name in $missing_services; do
        if _service_is_installed "$svc_name"; then
            write_color "  [✓] $svc_name installé avec succès" GREEN
        else
            write_color "  [✗] $svc_name toujours absent après installation" RED
            return 1
        fi
    done
    return 0
}

prompt_launch() {
    launch_fn="$1"
    echo ""
    write_color "  [✓] Installation terminée" GREEN
    echo ""
    printf '%s' "  Lancer maintenant ? [O/n] : "
    read -r launch_answer
    case "$launch_answer" in
        n|N|no|NO|non|NON)
            write_color "  → Utilisez le menu Launch quand vous serez prêt" CYAN
            return 0
            ;;
    esac
    if command -v "$launch_fn" > /dev/null 2>&1; then
        "$launch_fn"
    else
        write_color "  [!] Fonction launch introuvable : $launch_fn" YELLOW
    fi
}

setup_mongo() {
    mongo_state=$(check_mongo)
    case "$mongo_state" in
        running)
            write_color "  [✓] MongoDB local prêt" GREEN
            return 0
            ;;
        stopped)
            write_color "  [!] MongoDB installé mais non démarré" YELLOW
            if start_mongo; then
                write_color "  [✓] MongoDB local prêt" GREEN
                return 0
            fi
            write_color "  [✗] Impossible de démarrer le service MongoDB" RED
            return 1
            ;;
        missing)
            install_mongo || return 1
            if start_mongo; then
                write_color "  [✓] MongoDB local prêt" GREEN
                return 0
            fi
            write_color "  [✗] MongoDB installé mais le service ne démarre pas" RED
            return 1
            ;;
    esac
}
