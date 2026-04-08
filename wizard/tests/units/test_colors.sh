#!/bin/sh
. "$(dirname "$0")/../lib/test_helpers.sh"

testWriteColorEmitsText() {
    (
        cd "$REPO_ROOT" || exit 1
        . ./wizard/core/colors.sh
        failure_count=0
        for color_name in BLACK RED GREEN YELLOW BLUE MAGENTA CYAN WHITE; do
            output=$(write_color "hello" "$color_name" 2>&1)
            case "$output" in
                *hello*) ;;
                *) echo "MISSING hello in $color_name output"; failure_count=$((failure_count + 1)) ;;
            esac
        done
        exit "$failure_count"
    )
    assertEquals 0 $?
}
. "$SHUNIT2"
