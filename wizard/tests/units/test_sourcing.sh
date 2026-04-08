#!/bin/sh
. "$(dirname "$0")/../lib/test_helpers.sh"
testSourcingChainResolves() {
    failure_count=0
    find "$REPO_ROOT/setup.sh" "$REPO_ROOT/wizard" -name '*.sh' -not -path '*/tests/*' -print | while IFS= read -r target; do
        target_folder=$(dirname "$target")
        grep -nE '^[[:space:]]*(\.|source)[[:space:]]+' "$target" 2>/dev/null | while IFS= read -r matched_line; do
            source_path=$(printf '%s' "$matched_line" | sed -E 's/^[0-9]+:[[:space:]]*(\.|source)[[:space:]]+//' | awk '{print $1}' | tr -d '"'"'"'')
            case "$source_path" in
                *'$'*) continue ;;
            esac
            case "$source_path" in
                /*) resolved_path="$source_path" ;;
                *)  resolved_path="$target_folder/$source_path" ;;
            esac
            if [ ! -f "$resolved_path" ]; then
                echo "MISSING SOURCE: $target -> $source_path"
                failure_count=$((failure_count + 1))
            fi
        done
    done
    assertEquals 0 "$failure_count"
}
. "$SHUNIT2"
