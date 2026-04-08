#!/bin/sh
. "$(dirname "$0")/../lib/test_helpers.sh"
setUp() { setup_mocks; }
tearDown() { teardown_mocks; }

testRunGenerateEnvCreatesEnvFiles() {
    (
        cd "$REPO_ROOT" || exit 1
        . ./wizard/core/colors.sh
        . ./wizard/core/dependencies.sh
        . ./wizard/shared/generate-env.sh
        scratch_root=$(mktemp -d)
        mkdir -p "$scratch_root/visio-conf-25"
        cp -r "$FIXTURE_PROJECT"/. "$scratch_root/visio-conf-25/"
        export PROJECT_DIR="$scratch_root/visio-conf-25"
        cd "$scratch_root/visio-conf-25" || exit 1
        printf '\n\n\n\n\n\n\n\n\n\n' | run_generate_env > /dev/null 2>&1
        result=0
        [ -f "$scratch_root/visio-conf-25/BACKEND/.env" ] || result=1
        [ -f "$scratch_root/visio-conf-25/FRONTENDV2/.env" ] || result=1
        rm -rf "$scratch_root"
        exit "$result"
    )
    assertEquals 0 $?
}
. "$SHUNIT2"
