#!/bin/sh
# Verifie wizard.specs/pipelines.md — Docker dev status
. "$(dirname "$0")/../lib/test_helpers.sh"

setUp() {
    setup_mocks
    WORK=$(mktemp -d)
    cp -r "$FIXTURE_PROJECT/." "$WORK/"
    export PROJECT_DIR="$WORK" WIZARD_OS=linux
}
tearDown() { teardown_mocks; rm -rf "$WORK"; }

testDockerDevStatusInvokesComposePs() {
    ( cd "$REPO_ROOT" && printf '1\n1\n4\n5\n4\n' | timeout 5 sh ./setup.sh > /dev/null 2>&1 || true )
    assert_mock_called docker "ps"
}

. "$SHUNIT2"
