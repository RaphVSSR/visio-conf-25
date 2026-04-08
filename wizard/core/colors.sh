#!/bin/sh
RED=$(tput setaf 1 2>/dev/null || printf '')
GREEN=$(tput setaf 2 2>/dev/null || printf '')
YELLOW=$(tput setaf 3 2>/dev/null || printf '')
BLUE=$(tput setaf 4 2>/dev/null || printf '')
CYAN=$(tput setaf 6 2>/dev/null || printf '')
WHITE=$(tput setaf 7 2>/dev/null || printf '')
BOLD=$(tput bold 2>/dev/null || printf '')
RESET=$(tput sgr0 2>/dev/null || printf '')
HIGHLIGHT_BG=$(tput setab 4 2>/dev/null || printf '')

write_color() {
    message="$1"
    color_name="$2"
    case "$color_name" in
        RED)    color_code="$RED" ;;
        GREEN)  color_code="$GREEN" ;;
        YELLOW) color_code="$YELLOW" ;;
        BLUE)   color_code="$BLUE" ;;
        CYAN)   color_code="$CYAN" ;;
        BOLD)   color_code="$BOLD" ;;
        *)      color_code="$WHITE" ;;
    esac
    printf '%s%s%s\n' "$color_code" "$message" "$RESET"
}
