#!/bin/bash

ESCAPE_SEQ=$'\x1b'
CURSOR_SAVE="${ESCAPE_SEQ}7"
CURSOR_RESTORE="${ESCAPE_SEQ}8"
CURSOR_HIDE="${ESCAPE_SEQ}[?25l"
CURSOR_SHOW="${ESCAPE_SEQ}[?25h"
CLEAR_BELOW="${ESCAPE_SEQ}[J"

MENU_RESULT=0

show_header() {
    printf '%b' "${WHITE}"
    cat << 'HEADER'
  ███╗   ███╗███╗   ███╗██╗
  ████╗ ████║████╗ ████║██║
  ██╔████╔██║██╔████╔██║██║
  ██║╚██╔╝██║██║╚██╔╝██║██║
  ██║ ╚═╝ ██║██║ ╚═╝ ██║██║
  ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝ VisioConf
HEADER
    printf '%b' "${NC}"
}

show_submenu_header() {
    local title="$1"
    printf '\n  %b╔══════════════════════════════════════╗%b\n' "${WHITE}" "${NC}"
    printf '  %b║       %-31s║%b\n' "${WHITE}" "$title" "${NC}"
    printf '  %b╚══════════════════════════════════════╝%b\n\n' "${WHITE}" "${NC}"
}

arrow_menu() {
    local style="lines"
    local items=()
    local item_colors=()

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --style)  style="$2"; shift 2 ;;
            --colors) IFS=',' read -ra item_colors <<< "$2"; shift 2 ;;
            *)        items+=("$1"); shift ;;
        esac
    done

    local count=${#items[@]}
    local selected=0

    printf '%b' "${CURSOR_HIDE}${CURSOR_SAVE}"

    render_menu() {
        local buff="" formatted
        local iter active_color

        for iter in "${!items[@]}"; do
            active_color="${item_colors[$iter]:-CYAN}"
            active_color="${!active_color}"

            if [[ "$style" == "boxes" ]]; then
                if [[ $iter -eq $selected ]]; then
                    buff+="\n  ${active_color}┌────────────────────────────────────────┐${NC}\n"
                    buff+="  ${active_color}│                                        │${NC}\n"
                    printf -v formatted "  ${active_color}│  ▶ %-36s│${NC}" "${items[$iter]}"
                    buff+="${formatted}\n"
                    buff+="  ${active_color}│                                        │${NC}\n"
                    buff+="  ${active_color}└────────────────────────────────────────┘${NC}"
                else
                    buff+="\n  ${WHITE}┌────────────────────────────────────────┐${NC}\n"
                    buff+="  ${WHITE}│                                        │${NC}\n"
                    printf -v formatted "  ${WHITE}│    %-36s│${NC}" "${items[$iter]}"
                    buff+="${formatted}\n"
                    buff+="  ${WHITE}│                                        │${NC}\n"
                    buff+="  ${WHITE}└────────────────────────────────────────┘${NC}"
                fi
            else
                if [[ $iter -eq $selected ]]; then
                    buff+="  ${active_color}  ▶ ${items[$iter]}${NC}\n"
                else
                    buff+="  ${WHITE}    ${items[$iter]}${NC}\n"
                fi
                buff+="\n"
            fi
        done

        buff+="\n  ${WHITE}↑/↓ Naviguer  ⏎ Sélectionner${NC}"
        printf '%b' "$buff"
    }

    render_menu

    local char=""
    while true; do
        IFS= read -rsn1 char

        case "$char" in
            "$ESCAPE_SEQ")
                read -rsn1 -t 1 char
                read -rsn1 -t 1 char
                case "$char" in
                    A) ((selected--)); [[ $selected -lt 0 ]] && selected=$((count - 1)) ;;
                    B) ((selected++)); [[ $selected -ge $count ]] && selected=0 ;;
                    *) continue ;;
                esac
                printf '%b' "${CURSOR_RESTORE}${CLEAR_BELOW}${CURSOR_SAVE}"
                render_menu
                ;;
            ""|$'\r'|$'\n')
                printf '%b' "${CURSOR_SHOW}"
                MENU_RESULT=$selected
                return
                ;;
        esac
    done
}
