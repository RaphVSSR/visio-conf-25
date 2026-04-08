#!/bin/sh
. "$(dirname "$0")/../lib/test_helpers.sh"

testIdentifierNaming() {
    blacklist='cmd cfg tmp buf str num msg err ret val fn func src dst dir env url pid opt args buff cmdt proc envs entr valu indx iter idx'
    failure_count=0
    find "$REPO_ROOT/setup.sh" "$REPO_ROOT/wizard" -name '*.sh' -not -path '*/tests/*' -print | while IFS= read -r target; do
        assignments=$(grep -nE '^[[:space:]]*(local[[:space:]]+)?[a-z_][a-z0-9_]*=' "$target" 2>/dev/null \
            | sed -E 's/^([0-9]+):[[:space:]]*(local[[:space:]]+)?([a-z_][a-z0-9_]*)=.*/\1:\3/')
        functions=$(grep -nE '^[a-z_][a-z0-9_]*\(\)' "$target" 2>/dev/null \
            | sed -E 's/^([0-9]+):([a-z_][a-z0-9_]*)\(\).*/\1:\2/')
        printf '%s\n%s\n' "$assignments" "$functions" | while IFS= read -r entry; do
            [ -z "$entry" ] && continue
            line_number=$(printf '%s' "$entry" | cut -d: -f1)
            identifier=$(printf '%s' "$entry" | cut -d: -f2)
            length=$(printf '%s' "$identifier" | wc -c | tr -d ' ')
            if [ "$length" -lt 4 ]; then
                echo "SHORT: $target:$line_number $identifier"
                failure_count=$((failure_count + 1))
                continue
            fi
            for forbidden in $blacklist; do
                if [ "$identifier" = "$forbidden" ]; then
                    echo "BLACKLIST: $target:$line_number $identifier"
                    failure_count=$((failure_count + 1))
                    break
                fi
            done
        done
    done
    assertEquals 0 "$failure_count"
}
. "$SHUNIT2"
