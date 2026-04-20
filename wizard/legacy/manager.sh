#!/bin/sh

legacy_manager() {
    [ -z "$WIZARD_OS" ] && { write_color "  [✗] Plateforme non détectée" RED; return; }

    legacy_select_env
    selected_environment="$MENU_ENV_RESULT"
    [ -z "$selected_environment" ] && return

    if [ "$selected_environment" = "dev" ]; then
        . "$WIZARD_DIR/legacy/dev/install.sh"
        . "$WIZARD_DIR/legacy/dev/ssl.sh"
        . "$WIZARD_DIR/legacy/dev/launch.sh"
        . "$WIZARD_DIR/legacy/dev/reload.sh"
        . "$WIZARD_DIR/legacy/dev/stop.sh"
        . "$WIZARD_DIR/legacy/dev/status.sh"
        legacy_dev_menu
    elif [ "$selected_environment" = "prod" ]; then
        . "$WIZARD_DIR/legacy/prod/install.sh"
        . "$WIZARD_DIR/legacy/prod/launch.sh"
        . "$WIZARD_DIR/legacy/prod/reload.sh"
        . "$WIZARD_DIR/legacy/prod/stop.sh"
        . "$WIZARD_DIR/legacy/prod/status.sh"
        . "$WIZARD_DIR/legacy/prod/ssl.sh"
        legacy_prod_menu
    fi
}

legacy_select_env() {
    clear
    show_submenu_header "Legacy Manager"
    write_color "  Sélectionnez votre environnement :" WHITE
    echo ""

    pick_menu --style lines \
        --colors "GREEN,YELLOW,RED" \
        "Development" "Production" "Back"

    case $MENU_RESULT in
        0) MENU_ENV_RESULT="dev" ;;
        1) MENU_ENV_RESULT="prod" ;;
        *) MENU_ENV_RESULT="" ;;
    esac
}

legacy_dev_menu() {
    while true; do
        cd "$SCRIPT_DIR" || return
        clear
        show_submenu_header "Legacy Manager — Dev"

        pick_menu --style lines \
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
        cd "$SCRIPT_DIR" || return
        clear
        show_submenu_header "Legacy Manager — Prod"

        pick_menu --style lines \
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
