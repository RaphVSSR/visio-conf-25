#!/bin/bash

legacy_manager() {
    legacy_select_os
    [[ -z "$WIZARD_OS" ]] && return

    legacy_select_env
    local selected_env="$MENU_ENV_RESULT"
    [[ -z "$selected_env" ]] && return

    if [[ "$selected_env" == "dev" ]]; then
        source "$WIZARD_DIR/legacy/dev/install.sh"
        source "$WIZARD_DIR/legacy/dev/launch.sh"
        source "$WIZARD_DIR/legacy/dev/reload.sh"
        source "$WIZARD_DIR/legacy/dev/stop.sh"
        source "$WIZARD_DIR/legacy/dev/status.sh"
        legacy_dev_menu
    elif [[ "$selected_env" == "prod" ]]; then
        source "$WIZARD_DIR/legacy/prod/install.sh"
        source "$WIZARD_DIR/legacy/prod/launch.sh"
        source "$WIZARD_DIR/legacy/prod/reload.sh"
        source "$WIZARD_DIR/legacy/prod/stop.sh"
        source "$WIZARD_DIR/legacy/prod/status.sh"
        source "$WIZARD_DIR/legacy/prod/ssl.sh"
        legacy_prod_menu
    fi
}

legacy_select_os() {
    clear
    show_submenu_header "Legacy Manager"
    write_color "  Sélectionnez votre plateforme :" WHITE
    echo ""

    arrow_menu --style lines \
        --colors "CYAN,CYAN,CYAN,RED" \
        "Linux" "Windows" "macOS" "Back"

    local platforms=("linux" "windows" "macos" "")
    WIZARD_OS="${platforms[$MENU_RESULT]}"
}

legacy_select_env() {
    clear
    show_submenu_header "Legacy Manager"
    write_color "  Sélectionnez votre environnement :" WHITE
    echo ""

    arrow_menu --style lines \
        --colors "GREEN,YELLOW,RED" \
        "Development" "Production" "Back"

    local envs=("dev" "prod" "")
    MENU_ENV_RESULT="${envs[$MENU_RESULT]}"
}

legacy_dev_menu() {
    while true; do
        cd "$SCRIPT_DIR"
        clear
        show_submenu_header "Legacy Manager — Dev"

        arrow_menu --style lines \
            --colors "GREEN,GREEN,YELLOW,RED,CYAN,RED" \
            "Installation" "Launch" "Reload" "Stop" "Status" "Back"

        case $MENU_RESULT in
            0) legacy_dev_install ;;
            1) legacy_dev_launch ;;
            2) legacy_dev_reload ;;
            3) legacy_dev_stop ;;
            4) legacy_dev_status ;;
            5) return ;;
        esac
    done
}

legacy_prod_menu() {
    while true; do
        cd "$SCRIPT_DIR"
        clear
        show_submenu_header "Legacy Manager — Prod"

        arrow_menu --style lines \
            --colors "GREEN,GREEN,YELLOW,RED,CYAN,RED" \
            "Installation" "Launch" "Reload" "Stop" "Status" "Back"

        case $MENU_RESULT in
            0) legacy_prod_install ;;
            1) legacy_prod_launch ;;
            2) legacy_prod_reload ;;
            3) legacy_prod_stop ;;
            4) legacy_prod_status ;;
            5) return ;;
        esac
    done
}
