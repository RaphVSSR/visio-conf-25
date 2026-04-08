#!/bin/sh
# Verifie wizard.specs/pipelines.md — Generate .env files
. "$(dirname "$0")/../lib/test_helpers.sh"

setUp() {
    setup_mocks
    WORK=$(mktemp -d)
    cp -r "$FIXTURE_PROJECT/." "$WORK/"
    export PROJECT_DIR="$WORK" WIZARD_OS=linux
}
tearDown() { teardown_mocks; rm -rf "$WORK"; }

testGenerateEnvCreatesEnvFiles() {
    ( cd "$WORK" && printf '3\n\n\n\n\n\n\n4\n' | timeout 5 sh "$REPO_ROOT/setup.sh" > /dev/null 2>&1 || true )
    assertTrue "BACKEND/.env exists" "[ -f '$WORK/BACKEND/.env' ]"
    assertTrue "FRONTENDV2/.env exists" "[ -f '$WORK/FRONTENDV2/.env' ]"
}

. "$SHUNIT2"
