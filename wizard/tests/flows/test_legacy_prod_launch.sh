#!/bin/sh
# Verifie wizard.specs/pipelines.md — Legacy prod launch
. "$(dirname "$0")/../lib/test_helpers.sh"

setUp() {
    setup_mocks
    WORK=$(mktemp -d)
    cp -r "$FIXTURE_PROJECT/." "$WORK/"
    export PROJECT_DIR="$WORK" WIZARD_OS=linux
}
tearDown() { teardown_mocks; rm -rf "$WORK"; }

testLegacyProdLaunchInvokesPm2Start() {
    ( cd "$REPO_ROOT" && printf '2\n1\n2\n2\n6\n4\n' | timeout 5 sh ./setup.sh > /dev/null 2>&1 || true )
    assert_mock_called pm2 "start"
}

. "$SHUNIT2"
