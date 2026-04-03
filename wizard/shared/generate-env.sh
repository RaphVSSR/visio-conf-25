#!/bin/bash

generate_env() {
    local template="$1"
    local output="$2"
    local label="$3"
    shift 3

    declare -A overrides
    while [[ $# -gt 0 ]]; do
        overrides["${1%%=*}"]="${1#*=}"
        shift
    done

    if [[ ! -f "$template" ]]; then
        write_color "  [✗] Template introuvable : $template" RED
        return 1
    fi

    if [[ -f "$output" ]]; then
        write_color "  Le fichier $output existe déjà." YELLOW
        local answer=""
        read -p "  Écraser ? (o/N) : " answer
        if [[ "${answer,,}" != "o" && "${answer,,}" != "oui" ]]; then
            write_color "  → Conservation du fichier existant" CYAN
            return 0
        fi
    fi

    write_color "  ── Configuration $label ──" CYAN
    > "$output"

    while IFS= read -r line <&3 || [[ -n "$line" ]]; do
        line="${line//$'\r'/}"

        [[ -z "$line" || "$line" =~ ^# ]] && continue
        [[ "$line" != *=* ]] && continue

        local key="${line%%=*}"
        local raw_value="${line#*=}"

        local default_value="$raw_value"
        local hint=""
        if [[ "$raw_value" == *" #"* ]]; then
            default_value="${raw_value%% #*}"
            hint="${raw_value#*#}"
        fi

        if [[ -n "${overrides[$key]+set}" ]]; then
            default_value="${overrides[$key]}"
        fi

        printf "  %b[%s]%b %b%s%b [%b%s%b]" "$BLUE" "$label" "$NC" "$CYAN" "$key" "$NC" "$YELLOW" "$default_value" "$NC"
        [[ -n "$hint" ]] && printf " (%b%s%b)" "$GREEN" "$hint" "$NC"
        printf ": "
        read user_value
        [[ -z "$user_value" ]] && user_value="$default_value"

        echo "${key}=${user_value}" >> "$output"
    done 3< "$template"

    write_color "  [✓] $label configuré → $output" GREEN
}

run_generate_env() {
    clear
    write_color "── Génération des fichiers .env ──" CYAN
    echo ""

    if ! locate_project; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    generate_env "BACKEND/.env.template" "BACKEND/.env" "Backend"
    echo ""
    generate_env "FRONTENDV2/.env.template" "FRONTENDV2/.env" "Frontend"
    echo ""
    write_color "  [✓] Génération terminée" GREEN
    read -p "  Appuyez sur Entrée pour continuer..." dummy
}
