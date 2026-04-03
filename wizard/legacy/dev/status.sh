#!/bin/bash

legacy_dev_status() {
    clear

    if ! locate_project; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    dev_health_report

    read -p "  Appuyez sur Entrée..." dummy
}
