#!/bin/sh
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WIZARD_DIR="$SCRIPT_DIR/wizard"
REPO_URL="https://github.com/RaphVSSR/visio-conf-25.git"
PROJECT_DIR="${PROJECT_DIR:-}"
WIZARD_LOG_DIR="${WIZARD_LOG_DIR:-$HOME/.visioconf/logs}"
mkdir -p "$WIZARD_LOG_DIR"
export WIZARD_LOG_DIR

. "$WIZARD_DIR/core/colors.sh"
. "$WIZARD_DIR/core/guard.sh"
. "$WIZARD_DIR/core/menu.sh"
. "$WIZARD_DIR/core/os_detection.sh"
. "$WIZARD_DIR/core/services.sh"
. "$WIZARD_DIR/os/linux.sh"
. "$WIZARD_DIR/os/windows.sh"
. "$WIZARD_DIR/os/macos.sh"
. "$WIZARD_DIR/core/dependencies.sh"
. "$WIZARD_DIR/shared/generate-env.sh"

setup_platform

[ "$WIZARD_OS" = "windows" ] && _win_refresh_path

if ! setup_prereqs; then
    write_color "  [!] Prérequis système incomplets — certaines fonctionnalités pourraient échouer" YELLOW
    write_color "  → Vous pourrez réessayer depuis le menu" CYAN
fi

echo ""
if ! ensure_services; then
    write_color "  [!] Dépendance de base incomplète — certains flows pourraient échouer" YELLOW
    write_color "  → Les installations les réclameront à nouveau si besoin" CYAN
fi

init_project_dir
sleep 3

while :; do
    cd "$SCRIPT_DIR" || exit 1
    clear
    show_header
    pick_menu --style boxes --colors "CYAN,YELLOW,CYAN,RED" \
        "Docker Manager (recommandé)" \
        "Legacy Manager" \
        "Générer les fichiers .env" \
        "Quitter"
    case "$MENU_RESULT" in
        0) . "$WIZARD_DIR/docker/manager.sh"; docker_manager ;;
        1) . "$WIZARD_DIR/legacy/manager.sh"; legacy_manager ;;
        2) run_generate_env ;;
        3) write_color "  Au revoir !" CYAN; exit 0 ;;
    esac
done
