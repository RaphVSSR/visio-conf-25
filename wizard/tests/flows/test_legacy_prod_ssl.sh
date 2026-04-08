#!/bin/sh
# Verifie wizard.specs/pipelines.md — Legacy prod SSL (prod_ssl_setup function)
. "$(dirname "$0")/../lib/test_helpers.sh"

setUp() {
    setup_mocks
    WORK_PARENT=$(mktemp -d)
    WORK="$WORK_PARENT/visio-conf-25"
    mkdir -p "$WORK"
    cp -r "$FIXTURE_PROJECT/." "$WORK/"
    export PROJECT_DIR="$WORK" WIZARD_OS=linux
}
tearDown() { teardown_mocks; rm -rf "$WORK_PARENT"; }

testLegacyProdSslInvokesCertbot() {
    (
        cd "$WORK" || exit 1
        . "$REPO_ROOT/wizard/core/colors.sh"
        . "$REPO_ROOT/wizard/core/dependencies.sh"
        . "$REPO_ROOT/wizard/legacy/prod/ssl.sh"
        prod_ssl_setup "example.com" > /dev/null 2>&1
    )
    assert_mock_called certbot ""
}

. "$SHUNIT2"
