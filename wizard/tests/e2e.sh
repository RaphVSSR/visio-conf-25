#!/bin/sh
# Wizard E2E test suite — drives setup.sh like a real user.
# Design: specs/2026-04-19-wizard-e2e-test-plan-design.md
# Impl:   specs/2026-04-19-wizard-e2e-impl-plan.md

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SETUP_SCRIPT="$REPO_ROOT/setup.sh"

RUN_ID="$(date +%Y-%m-%dT%H-%M-%S)"
LOG_DIR="$SCRIPT_DIR/e2e-logs/$RUN_ID"
SCRATCH_DIR="$SCRIPT_DIR/e2e-logs/$RUN_ID/scratch"

SKIP_BUDGET=2
SKIP_COUNT=0
CLEAN_SYSTEM="${CLEAN_SYSTEM:-0}"

PHASE=""
JOURNEY_NAME=""
JOURNEY_LOG=""
JOURNEY_INSTALL_LOG=""
JOURNEY_CLEAN_LOG=""

mkdir -p "$LOG_DIR"
mkdir -p "$SCRATCH_DIR"

SUITE_LOG="$LOG_DIR/suite.log"
: > "$SUITE_LOG"

log_suite() {
    printf '%s\n' "$*" | tee -a "$SUITE_LOG"
}

log_suite "=== Wizard E2E Suite — Run $RUN_ID ==="
log_suite ""

# === helpers (Tasks 4-9) ===

run_with_timeout() {
    rwt_seconds="$1"
    shift
    if command -v timeout > /dev/null 2>&1; then
        timeout "$rwt_seconds" "$@"
        return $?
    fi
    "$@" &
    rwt_pid=$!
    (
        sleep "$rwt_seconds"
        kill -0 "$rwt_pid" 2>/dev/null && kill "$rwt_pid" 2>/dev/null
    ) &
    rwt_watcher=$!
    wait "$rwt_pid" 2>/dev/null
    rwt_rc=$?
    kill "$rwt_watcher" 2>/dev/null
    return "$rwt_rc"
}

drive_wizard() {
    dw_name="$1"
    dw_input="$2"
    dw_timeout="$3"
    dw_log="$LOG_DIR/${dw_name}.log"
    dw_cwd="$SCRATCH_DIR/$dw_name"
    mkdir -p "$dw_cwd"
    (
        cd "$dw_cwd" || exit 1
        printf '%b' "$dw_input" | run_with_timeout "$dw_timeout" sh "$SETUP_SCRIPT"
    ) > "$dw_log" 2>&1
    return $?
}

strip_ansi() {
    sed 's/\x1b\[[0-9;]*[a-zA-Z]//g'
}

is_port_free() {
    ipf_port="$1"
    if command -v lsof > /dev/null 2>&1; then
        ! lsof -i ":$ipf_port" > /dev/null 2>&1
        return
    fi
    if command -v ss > /dev/null 2>&1; then
        ! ss -ltn "sport = :$ipf_port" 2>/dev/null | grep -q ":$ipf_port"
        return
    fi
    if command -v netstat > /dev/null 2>&1; then
        ! netstat -an 2>/dev/null | grep -q "[:.]$ipf_port .*LISTEN"
        return
    fi
    return 0
}

verify_clean() {
    vc_dirty=""
    for vc_port in 3000 3220 27017 80 443; do
        if ! is_port_free "$vc_port"; then
            vc_dirty="$vc_dirty port-$vc_port-busy"
        fi
    done
    if command -v docker > /dev/null 2>&1; then
        if [ -n "$(docker ps -a --filter 'name=visio' -q 2>/dev/null)" ]; then
            vc_dirty="$vc_dirty docker-visio-container-remains"
        fi
        if [ -n "$(docker image ls --format '{{.Repository}}' 2>/dev/null | grep '^visio')" ]; then
            vc_dirty="$vc_dirty docker-visio-image-remains"
        fi
    fi
    if command -v pm2 > /dev/null 2>&1; then
        if pm2 list 2>/dev/null | grep -q 'visioconf'; then
            vc_dirty="$vc_dirty pm2-visioconf-remains"
        fi
    fi
    if [ "$PHASE" = "linux" ]; then
        if pgrep -f 'node.*visioconf\|mongod' > /dev/null 2>&1; then
            vc_dirty="$vc_dirty node-or-mongod-proc-remains"
        fi
    else
        if command -v tasklist > /dev/null 2>&1; then
            if tasklist 2>/dev/null | grep -iE 'node\.exe|mongod\.exe' > /dev/null; then
                vc_dirty="$vc_dirty win-node-mongod-proc-remains"
            fi
        fi
    fi
    if [ -d "$SCRATCH_DIR/$JOURNEY_NAME/visio-conf-25" ]; then
        vc_dirty="$vc_dirty scratch-clone-remains"
    fi
    if [ -n "$vc_dirty" ]; then
        printf 'DIRTY after %s:%s\n' "$JOURNEY_NAME" "$vc_dirty" > "$LOG_DIR/dirty.log"
        return 1
    fi
    return 0
}

SKIP_REASON=""

mark_skip() {
    SKIP_REASON="$1"
    SKIP_COUNT=$((SKIP_COUNT + 1))
}

skip_if_no_internet() {
    if ! curl -fsSL --max-time 5 https://example.com > /dev/null 2>&1; then
        mark_skip "no internet"
        return 0
    fi
    return 1
}

skip_if_no_docker() {
    if ! command -v docker > /dev/null 2>&1; then
        mark_skip "docker CLI absent"
        return 0
    fi
    if ! docker info > /dev/null 2>&1; then
        mark_skip "docker daemon not responding (Docker Desktop not running?)"
        return 0
    fi
    return 1
}

skip_if_no_systemd() {
    if [ "$PHASE" != "linux" ]; then
        return 1
    fi
    if ! command -v systemctl > /dev/null 2>&1; then
        mark_skip "no systemctl"
        return 0
    fi
    if [ ! -d /run/systemd/system ]; then
        mark_skip "systemd not PID 1"
        return 0
    fi
    return 1
}

skip_if_over_budget() {
    if [ "$SKIP_COUNT" -gt "$SKIP_BUDGET" ]; then
        log_suite "ABORT: skip budget exceeded ($SKIP_COUNT > $SKIP_BUDGET)"
        exit 3
    fi
}

diagnose_why() {
    dw_log="$1"
    [ -f "$dw_log" ] || { echo "unknown — log missing"; return; }
    dw_text="$(strip_ansi < "$dw_log")"

    case "$dw_text" in
        *"[✗]"*"introuvable"*)
            dw_tool="$(echo "$dw_text" | grep -oE '\[✗\][^[:cntrl:]]*introuvable' | head -1)"
            printf 'missing tool: %s\n' "$dw_tool"
            return
            ;;
    esac
    case "$dw_text" in
        *"Échec installation apt"*)    echo "apt install failure"; return ;;
        *"winget a échoué"*)            echo "winget install failure"; return ;;
        *"Port"*"occupé"*)              echo "port already in use"; return ;;
        *"clone a échoué"*|*"Échec du clonage"*) echo "git clone failure"; return ;;
        *"sudo requis"*)                echo "sudo unavailable"; return ;;
    esac
    if echo "$dw_text" | grep -qi "docker compose.*error"; then
        echo "docker compose failure"
        return
    fi
    echo "unknown — see $dw_log"
}

split_install_log() {
    sil_log="$1"
    sil_out="$LOG_DIR/${JOURNEY_NAME}.install.log"
    [ -f "$sil_log" ] || return 0
    awk '/Lancement/ { exit } { print }' "$sil_log" > "$sil_out"
}

report_journey() {
    rj_status="$1"
    rj_duration="$2"
    rj_extra="$3"
    if [ -n "$rj_extra" ]; then
        log_suite "$(printf '  %-30s %-7s %6s   %s' "$JOURNEY_NAME" "$rj_status" "$rj_duration" "$rj_extra")"
    else
        log_suite "$(printf '  %-30s %-7s %6s' "$JOURNEY_NAME" "$rj_status" "$rj_duration")"
    fi
}

duration_since() {
    ds_start="$1"
    ds_now="$(date +%s)"
    ds_diff=$((ds_now - ds_start))
    ds_min=$((ds_diff / 60))
    ds_sec=$((ds_diff % 60))
    printf '%02d:%02d' "$ds_min" "$ds_sec"
}

# === journeys (Tasks 10-16) ===

journey_boot() {
    JOURNEY_NAME="boot"
    jb_start="$(date +%s)"
    SKIP_REASON=""
    skip_if_no_internet && { report_journey SKIP "$(duration_since "$jb_start")" "$SKIP_REASON"; return 0; }

    jb_input="\n1\nO\n4\n"
    drive_wizard "boot" "$jb_input" 120
    jb_rc=$?

    jb_log="$LOG_DIR/boot.log"
    if [ "$jb_rc" -ne 0 ]; then
        report_journey FAIL "$(duration_since "$jb_start")" "exit $jb_rc — $(diagnose_why "$jb_log")"
        return 1
    fi

    if ! strip_ansi < "$jb_log" | grep -q "VisioConf"; then
        report_journey FAIL "$(duration_since "$jb_start")" "header not printed"
        return 1
    fi
    if ! strip_ansi < "$jb_log" | grep -q "Docker Manager"; then
        report_journey FAIL "$(duration_since "$jb_start")" "main menu not rendered"
        return 1
    fi

    report_journey PASS "$(duration_since "$jb_start")" ""
    return 0
}

pre_boot() { return 0; }
cleanup_boot_linux() { return 0; }
cleanup_boot_windows() { return 0; }

journey_quit() {
    JOURNEY_NAME="quit"
    jq_start="$(date +%s)"
    jq_input="\n1\nO\n4\n"
    drive_wizard "quit" "$jq_input" 120
    jq_rc=$?
    if [ "$jq_rc" -ne 0 ]; then
        report_journey FAIL "$(duration_since "$jq_start")" "exit $jq_rc"
        return 1
    fi
    if ! strip_ansi < "$LOG_DIR/quit.log" | grep -q "Au revoir"; then
        report_journey FAIL "$(duration_since "$jq_start")" "goodbye message not seen"
        return 1
    fi
    report_journey PASS "$(duration_since "$jq_start")" ""
    return 0
}

cleanup_quit_linux() { return 0; }
cleanup_quit_windows() { return 0; }

# === driver main loop (Task 17) ===

exit 0
