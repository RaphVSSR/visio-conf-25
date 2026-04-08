#!/bin/sh
. "$(dirname "$0")/../lib/test_helpers.sh"
setUp() { setup_mocks; }
tearDown() { teardown_mocks; }

testSetEnvLineCreatesAndUpdates() {
    (
        cd "$REPO_ROOT" || exit 1
        . ./wizard/core/colors.sh
        . ./wizard/core/dependencies.sh
        scratch_file=$(mktemp)
        set_env_line "$scratch_file" "FOO" "bar"
        grep -q '^FOO=bar$' "$scratch_file" || { rm -f "$scratch_file"; exit 1; }
        set_env_line "$scratch_file" "FOO" "baz"
        grep -q '^FOO=baz$' "$scratch_file" || { rm -f "$scratch_file"; exit 1; }
        rm -f "$scratch_file"
    )
    assertEquals 0 $?
}

testExtractEnvValFallback() {
    (
        cd "$REPO_ROOT" || exit 1
        . ./wizard/core/colors.sh
        . ./wizard/core/dependencies.sh
        scratch_file=$(mktemp)
        printf 'KEY=value\n' > "$scratch_file"
        result=$(extract_env_val "$scratch_file" "KEY" "fallback")
        [ "$result" = "value" ] || { rm -f "$scratch_file"; exit 1; }
        result=$(extract_env_val "$scratch_file" "MISSING" "fallback")
        [ "$result" = "fallback" ] || { rm -f "$scratch_file"; exit 1; }
        rm -f "$scratch_file"
    )
    assertEquals 0 $?
}

testVerifyCloneOnFixture() {
    (
        cd "$REPO_ROOT" || exit 1
        . ./wizard/core/colors.sh
        . ./wizard/core/dependencies.sh
        cd "$FIXTURE_PROJECT" || exit 1
        verify_clone docker > /dev/null 2>&1 || exit 1
    )
    assertEquals 0 $?
}
. "$SHUNIT2"
