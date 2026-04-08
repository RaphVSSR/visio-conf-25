#!/bin/sh
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
export REPO_ROOT
export MOCK_BIN="$REPO_ROOT/wizard/tests/mocks"
export FIXTURE_PROJECT="$REPO_ROOT/wizard/tests/fixtures/fake-project"
export SHUNIT2="$REPO_ROOT/wizard/tests/lib/shunit2"

setup_mocks() {
    MOCK_LOG="$(mktemp -d)"
    MOCK_PATH_DIR="$(mktemp -d)"
    export MOCK_LOG MOCK_PATH_DIR
    for mock_file in "$MOCK_BIN"/*; do
        [ -f "$mock_file" ] || continue
        base_name=$(basename "$mock_file")
        case "$base_name" in
            _*) continue ;;
        esac
        cp "$mock_file" "$MOCK_PATH_DIR/$base_name"
        chmod +x "$MOCK_PATH_DIR/$base_name" 2>/dev/null
        case "$base_name" in
            *.exe|*.cmd|*.bat) ;;
            *)
                cp "$mock_file" "$MOCK_PATH_DIR/$base_name.exe"
                chmod +x "$MOCK_PATH_DIR/$base_name.exe" 2>/dev/null
                ;;
        esac
    done
    export PATH="$MOCK_PATH_DIR:$PATH"
}
teardown_mocks() {
    [ -n "$MOCK_LOG" ] && rm -rf "$MOCK_LOG"
    [ -n "$MOCK_PATH_DIR" ] && rm -rf "$MOCK_PATH_DIR"
}
assert_mock_called() {
    mock_name="$1"
    expected_args="$2"
    log_file="$MOCK_LOG/$mock_name.log"
    if [ ! -f "$log_file" ]; then
        fail "Mock '$mock_name' was never called"
        return 1
    fi
    if ! grep -qF -- "$expected_args" "$log_file"; then
        fail "Mock '$mock_name' not called with: $expected_args
Actual: $(cat "$log_file")"
        return 1
    fi
    return 0
}
assert_mock_not_called() {
    mock_name="$1"
    log_file="$MOCK_LOG/$mock_name.log"
    if [ -f "$log_file" ] && [ -s "$log_file" ]; then
        fail "Mock '$mock_name' was called unexpectedly
Log: $(cat "$log_file")"
        return 1
    fi
    return 0
}
