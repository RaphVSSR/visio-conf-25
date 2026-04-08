#!/bin/sh
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WIZARD_DIR="$SCRIPT_DIR/wizard"
REPO_URL="https://github.com/RaphVSSR/visio-conf-25.git"
PROJECT_DIR=""

. "$WIZARD_DIR/core/colors.sh"
. "$WIZARD_DIR/core/menu.sh"
. "$WIZARD_DIR/core/dependencies.sh"
. "$WIZARD_DIR/shared/generate-env.sh"

case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*) _win_refresh_path ;;
esac

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
