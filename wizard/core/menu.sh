#!/bin/sh
MENU_RESULT=0

show_header() {
    printf '%s' "$WHITE"
    cat <<'HEADER'
  ███╗   ███╗███╗   ███╗██╗
  ████╗ ████║████╗ ████║██║
  ██╔████╔██║██╔████╔██║██║
  ██║╚██╔╝██║██║╚██╔╝██║██║
  ██║ ╚═╝ ██║██║ ╚═╝ ██║██║
  ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝ VisioConf
HEADER
    printf '%s' "$RESET"
}

show_submenu_header() {
    title="$1"
    printf '\n  %s╔══════════════════════════════════════╗%s\n' "$WHITE" "$RESET"
    printf '  %s║       %-31s║%s\n' "$WHITE" "$title" "$RESET"
    printf '  %s╚══════════════════════════════════════╝%s\n\n' "$WHITE" "$RESET"
}

pick_menu() {
    while [ $# -gt 0 ]; do
        case "$1" in
            --style)  shift 2 ;;
            --colors) shift 2 ;;
            *) break ;;
        esac
    done

    total=$#
    position=1
    printf '\n'
    for label in "$@"; do
        printf '  %s[%d]%s %s\n' "$CYAN" "$position" "$RESET" "$label"
        position=$((position + 1))
    done
    printf '\n'

    while :; do
        printf '  Choix [1-%d] : ' "$total"
        read -r answer || answer=""
        case "$answer" in
            ''|*[!0-9]*) continue ;;
        esac
        if [ "$answer" -ge 1 ] && [ "$answer" -le "$total" ]; then
            MENU_RESULT=$((answer - 1))
            return
        fi
    done
}
