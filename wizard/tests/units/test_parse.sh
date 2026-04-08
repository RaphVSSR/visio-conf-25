#!/bin/sh
. "$(dirname "$0")/../lib/test_helpers.sh"
testAllFilesParse() {
    failure_count=0
    find "$REPO_ROOT/setup.sh" "$REPO_ROOT/wizard" -name '*.sh' -not -path '*/tests/*' -print | while IFS= read -r target; do
        sh -n "$target" 2>&1 || { echo "PARSE FAIL: $target"; failure_count=$((failure_count + 1)); }
    done
    assertEquals 0 "$failure_count"
}
. "$SHUNIT2"
