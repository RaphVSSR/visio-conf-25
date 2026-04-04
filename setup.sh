#!/bin/bash

export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

SCRIPT_DIR="$(pwd)"
WIZARD_DIR="$SCRIPT_DIR/wizard"
REPO_URL="https://github.com/RaphVSSR/visio-conf-25.git"
PROJECT_DIR=""

source "$WIZARD_DIR/core/colors.sh"
source "$WIZARD_DIR/core/menu.sh"
source "$WIZARD_DIR/core/dependencies.sh"
source "$WIZARD_DIR/shared/generate-env.sh"

case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) _win_refresh_path ;; esac

while true; do
    cd "$SCRIPT_DIR"
    clear
    show_header

    arrow_menu --style boxes \
        --colors "CYAN,YELLOW,CYAN,RED" \
        "Docker Manager (recommended)" \
        "Legacy Manager" \
        "Generate .env files" \
        "Quit"

    case $MENU_RESULT in
        0)
            source "$WIZARD_DIR/docker/manager.sh"
            docker_manager
            ;;
        1)
            source "$WIZARD_DIR/legacy/manager.sh"
            legacy_manager
            ;;
        2)
            run_generate_env
            ;;
        3)
            write_color "  Au revoir !" CYAN
            exit 0
            ;;
    esac
done
