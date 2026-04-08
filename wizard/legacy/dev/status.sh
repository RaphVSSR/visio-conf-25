#!/bin/sh

legacy_dev_status() {
    clear

    if ! locate_project; then
        wait_enter
        return
    fi

    dev_health_report

    wait_enter
}
