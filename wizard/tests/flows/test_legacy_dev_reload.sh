#!/bin/sh
# Verifie wizard.specs/pipelines.md — Legacy dev reload
. "$(dirname "$0")/../lib/test_helpers.sh"

setUp() {
    setup_mocks
    WORK=$(mktemp -d)
    cp -r "$FIXTURE_PROJECT/." "$WORK/"
    printf 'PORT=3220\nMONGO_URI=mongodb://localhost:27017/visioconf\n' > "$WORK/BACKEND/.env"
    printf 'REACT_APP_BACKEND_API_URL=http://localhost:3220\n' > "$WORK/FRONTENDV2/.env"
    export PROJECT_DIR="$WORK" WIZARD_OS=linux
}
tearDown() { teardown_mocks; rm -rf "$WORK"; }

testLegacyDevReloadInvokesLsof() {
    ( cd "$REPO_ROOT" && printf '2\n1\n1\n3\n6\n4\n' | timeout 10 sh ./setup.sh > /dev/null 2>&1 || true )
    assert_mock_called lsof ""
}

. "$SHUNIT2"
