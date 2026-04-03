#!/bin/bash

RED=$(tput setaf 1 2>/dev/null || echo "")
GREEN=$(tput setaf 2 2>/dev/null || echo "")
YELLOW=$(tput setaf 3 2>/dev/null || echo "")
BLUE=$(tput setaf 4 2>/dev/null || echo "")
CYAN=$(tput setaf 6 2>/dev/null || echo "")
WHITE=$(tput setaf 7 2>/dev/null || echo "")
BOLD=$(tput bold 2>/dev/null || echo "")
NC=$(tput sgr0 2>/dev/null || echo "")

HIGHLIGHT_BG=$(tput setab 4 2>/dev/null || echo "")

write_color() {
    local text="$1"
    local color="${!2:-$WHITE}"
    echo -e "${color}${text}${NC}"
}
