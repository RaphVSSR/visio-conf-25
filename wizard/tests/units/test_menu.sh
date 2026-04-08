#!/bin/sh
. "$(dirname "$0")/../lib/test_helpers.sh"

testValidNumericInput() {
    (
        cd "$REPO_ROOT" || exit 1
        . ./wizard/core/colors.sh
        . ./wizard/core/menu.sh
        pick_menu alpha beta gamma > /dev/null 2>&1 <<INPUT
2
INPUT
        [ "$MENU_RESULT" = "1" ] || exit 1
    )
    assertEquals 0 $?
}

testInvalidThenValidInput() {
    (
        cd "$REPO_ROOT" || exit 1
        . ./wizard/core/colors.sh
        . ./wizard/core/menu.sh
        pick_menu alpha beta gamma > /dev/null 2>&1 <<INPUT
xyz
9
1
INPUT
        [ "$MENU_RESULT" = "0" ] || exit 1
    )
    assertEquals 0 $?
}
. "$SHUNIT2"
