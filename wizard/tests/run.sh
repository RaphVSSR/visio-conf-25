#!/bin/sh
set -eu
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TESTS_DIR="$REPO_ROOT/wizard/tests"
LAYER="all"

while [ $# -gt 0 ]; do
    case "$1" in
        --layer) LAYER="$2"; shift 2 ;;
        --matrix) exec "$TESTS_DIR/matrix.sh" ;;
        *) echo "Usage: $0 [--layer 1|2|all] [--matrix]" >&2; exit 2 ;;
    esac
done

command -v shellcheck > /dev/null 2>&1 || { echo "shellcheck introuvable" >&2; exit 2; }

run_dir() {
    target_dir="$1"
    failure_count=0
    for test_file in "$target_dir"/test_*.sh; do
        [ -f "$test_file" ] || continue
        echo "==> $test_file"
        sh "$test_file" || failure_count=$((failure_count + 1))
    done
    return "$failure_count"
}

total_failures=0
if [ "$LAYER" = "all" ] || [ "$LAYER" = "1" ]; then
    run_dir "$TESTS_DIR/units" || total_failures=$((total_failures + $?))
fi
if [ "$LAYER" = "all" ] || [ "$LAYER" = "2" ]; then
    run_dir "$TESTS_DIR/flows" || total_failures=$((total_failures + $?))
fi

[ "$total_failures" -gt 0 ] && { echo "FAIL: $total_failures file(s)"; exit 1; }
echo "PASS"
exit 0
