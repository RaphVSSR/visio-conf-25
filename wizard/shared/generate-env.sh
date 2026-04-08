#!/bin/sh

generate_env() {
    template="$1"
    output="$2"
    label="$3"
    shift 3
    overrides_list=""
    for entry in "$@"; do
        overrides_list="${overrides_list}${entry}
"
    done

    if [ ! -f "$template" ]; then
        write_color "  [✗] Template introuvable : $template" RED
        return 1
    fi

    if [ -f "$output" ]; then
        write_color "  Le fichier $output existe déjà." YELLOW
        answer=""
        printf "  Écraser ? (o/N) : "
        read -r answer
        answer_lower=$(printf '%s' "$answer" | tr 'A-Z' 'a-z')
        if [ "$answer_lower" != "o" ] && [ "$answer_lower" != "oui" ]; then
            write_color "  → Conservation du fichier existant" CYAN
            return 0
        fi
    fi

    write_color "  ── Configuration $label ──" CYAN
    : > "$output"

    while IFS= read -r line <&3 || [ -n "$line" ]; do
        line=$(printf '%s' "$line" | tr -d '\r')

        [ -z "$line" ] && continue
        case "$line" in
            \#*) continue ;;
        esac
        case "$line" in
            *=*) ;;
            *) continue ;;
        esac

        field="${line%%=*}"
        raw_value="${line#*=}"

        default_value="$raw_value"
        hint=""
        case "$raw_value" in
            *" #"*)
                default_value="${raw_value%% #*}"
                hint="${raw_value#*#}"
                ;;
        esac

        if [ -n "$overrides_list" ]; then
            old_ifs="$IFS"
            IFS='
'
            for override_entry in $overrides_list; do
                override_key="${override_entry%%=*}"
                override_val="${override_entry#*=}"
                if [ "$override_key" = "$field" ]; then
                    default_value="$override_val"
                    break
                fi
            done
            IFS="$old_ifs"
        fi

        printf "  %b[%s]%b %b%s%b [%b%s%b]" "$BLUE" "$label" "$RESET" "$CYAN" "$field" "$RESET" "$YELLOW" "$default_value" "$RESET"
        [ -n "$hint" ] && printf " (%b%s%b)" "$GREEN" "$hint" "$RESET"
        printf ": "
        read -r user_value
        [ -z "$user_value" ] && user_value="$default_value"

        echo "${field}=${user_value}" >> "$output"
    done 3< "$template"

    write_color "  [✓] $label configuré → $output" GREEN
}

run_generate_env() {
    clear
    write_color "── Génération des fichiers .env ──" CYAN
    echo ""

    if ! locate_project; then
        wait_enter
        return
    fi

    generate_env "BACKEND/.env.template" "BACKEND/.env" "Backend"
    echo ""
    generate_env "FRONTENDV2/.env.template" "FRONTENDV2/.env" "Frontend"
    echo ""
    write_color "  [✓] Génération terminée" GREEN
    wait_enter
}
