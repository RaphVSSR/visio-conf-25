#!/bin/sh

WIZARD_OS=""
WIZARD_DISTRO=""
WIZARD_CODENAME=""

detect_os() {
    case "$(uname -s 2>/dev/null)" in
        Linux*)                   WIZARD_OS="linux" ;;
        Darwin*)                  WIZARD_OS="macos" ;;
        MINGW*|MSYS*|CYGWIN*|*NT) WIZARD_OS="windows" ;;
        *)                        WIZARD_OS="" ;;
    esac
}

detect_distro() {
    WIZARD_DISTRO=""
    WIZARD_CODENAME=""
    [ "$WIZARD_OS" != "linux" ] && return 0

    if [ -r /etc/os-release ]; then
        distro_id=$(grep '^ID=' /etc/os-release | head -1 | cut -d= -f2 | tr -d '"')
        distro_like=$(grep '^ID_LIKE=' /etc/os-release | head -1 | cut -d= -f2 | tr -d '"')
        distro_code=$(grep '^VERSION_CODENAME=' /etc/os-release | head -1 | cut -d= -f2 | tr -d '"')

        case "$distro_id" in
            ubuntu) WIZARD_DISTRO="ubuntu" ;;
            debian) WIZARD_DISTRO="debian" ;;
            *)
                case "$distro_like" in
                    *ubuntu*) WIZARD_DISTRO="ubuntu" ;;
                    *debian*) WIZARD_DISTRO="debian" ;;
                    *)        WIZARD_DISTRO="other" ;;
                esac
                ;;
        esac

        WIZARD_CODENAME="$distro_code"
    fi

    if [ -z "$WIZARD_CODENAME" ] && command -v lsb_release > /dev/null 2>&1; then
        WIZARD_CODENAME=$(lsb_release -cs 2>/dev/null)
    fi
}

_prompt_codename() {
    if [ "$WIZARD_DISTRO" = "debian" ]; then
        pick_menu "bookworm (12)" "bullseye (11)" "trixie (13)"
        case "$MENU_RESULT" in
            0) WIZARD_CODENAME="bookworm" ;;
            1) WIZARD_CODENAME="bullseye" ;;
            2) WIZARD_CODENAME="trixie" ;;
        esac
    elif [ "$WIZARD_DISTRO" = "ubuntu" ]; then
        pick_menu "noble (24.04)" "jammy (22.04)" "focal (20.04)"
        case "$MENU_RESULT" in
            0) WIZARD_CODENAME="noble" ;;
            1) WIZARD_CODENAME="jammy" ;;
            2) WIZARD_CODENAME="focal" ;;
        esac
    fi
}

confirm_os_interactive() {
    clear
    show_submenu_header "Détection plateforme"

    detected_label="inconnu"
    case "$WIZARD_OS" in
        linux)
            if [ "$WIZARD_DISTRO" = "other" ] || [ -z "$WIZARD_CODENAME" ]; then
                detected_label="Linux (distribution non reconnue)"
            else
                detected_label="Linux ($WIZARD_DISTRO $WIZARD_CODENAME)"
            fi
            ;;
        windows) detected_label="Windows" ;;
        macos)   detected_label="macOS" ;;
    esac

    write_color "  Plateforme détectée : $detected_label" CYAN
    echo ""
    write_color "  Confirmer ou corriger :" WHITE
    pick_menu --style lines \
        --colors "GREEN,CYAN,CYAN,CYAN,RED" \
        "Confirmer ($detected_label)" \
        "Linux — Debian" \
        "Linux — Ubuntu" \
        "Windows" \
        "macOS"

    case "$MENU_RESULT" in
        0) ;;
        1) WIZARD_OS="linux";   WIZARD_DISTRO="debian"; _prompt_codename ;;
        2) WIZARD_OS="linux";   WIZARD_DISTRO="ubuntu"; _prompt_codename ;;
        3) WIZARD_OS="windows"; WIZARD_DISTRO=""; WIZARD_CODENAME="" ;;
        4) WIZARD_OS="macos";   WIZARD_DISTRO=""; WIZARD_CODENAME="" ;;
    esac

    export WIZARD_OS WIZARD_DISTRO WIZARD_CODENAME
    clear
}

setup_platform() {
    detect_os
    detect_distro
    confirm_os_interactive
}
