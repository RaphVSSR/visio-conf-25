#!/bin/sh
# Verifie wizard.specs/pipelines.md — Docker prod stop
. "$(dirname "$0")/../lib/test_helpers.sh"

setUp() {
    setup_mocks
    WORK=$(mktemp -d)
    cp -r "$FIXTURE_PROJECT/." "$WORK/"
    export PROJECT_DIR="$WORK" WIZARD_OS=linux
}
tearDown() { teardown_mocks; rm -rf "$WORK"; }

testDockerProdStopInvokesComposeDown() {
    ( cd "$REPO_ROOT" && printf '1\n2\n3\n5\n4\n' | timeout 5 sh ./setup.sh > /dev/null 2>&1 || true )
    assert_mock_called docker "down"
}

. "$SHUNIT2"
