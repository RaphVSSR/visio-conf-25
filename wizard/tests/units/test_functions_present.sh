#!/bin/sh
. "$(dirname "$0")/../lib/test_helpers.sh"
setUp() { setup_mocks; }
tearDown() { teardown_mocks; }

testCorePublicFunctionsDefined() {
    (
        cd "$REPO_ROOT" || exit 1
        . ./wizard/core/colors.sh
        . ./wizard/core/menu.sh
        . ./wizard/core/dependencies.sh
        . ./wizard/shared/generate-env.sh
        for required_name in write_color pick_menu show_header show_submenu_header \
                             check_dep verify_clone locate_project resolve_project clone_project \
                             verify_node_deps verify_prod_build set_env_line extract_env_val \
                             nginx_is_active pm2_get_status run_generate_env; do
            command -v "$required_name" > /dev/null 2>&1 || { echo "MISSING: $required_name"; exit 1; }
        done
    )
    assertEquals 0 $?
}
. "$SHUNIT2"
