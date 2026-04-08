#!/bin/sh
. "$(dirname "$0")/../lib/test_helpers.sh"
testNoBashisms() {
    failure_count=0
    find "$REPO_ROOT/setup.sh" "$REPO_ROOT/wizard" -name '*.sh' -not -path '*/tests/*' -print | while IFS= read -r target; do
        shellcheck -s sh -S warning "$target" || failure_count=$((failure_count + 1))
    done
    assertEquals 0 "$failure_count"
}
. "$SHUNIT2"
