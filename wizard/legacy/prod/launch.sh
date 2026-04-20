#!/bin/sh

legacy_prod_launch() {
    clear
    write_color "── Launch (Prod) ──" CYAN
    echo ""

    if ! locate_project; then
        wait_enter
        return
    fi

    if ! verify_prod_build; then
        wait_enter
        return
    fi

    if [ ! -f "BACKEND/.env" ] || [ ! -f "FRONTENDV2/.env" ]; then
        write_color "  [✗] Fichiers .env manquants. Lancez d'abord Installation." YELLOW
        wait_enter
        return
    fi

    _prod_start_services
    sleep 5

    echo ""
    prod_health_report

    wait_enter
}

_prod_start_services() {
    project_folder="$(cd "${PROJECT_DIR:-.}" && pwd)"
    [ "$WIZARD_OS" = "windows" ] && project_folder="$(cygpath -m "$project_folder")"

    pm2 start "$project_folder/BACKEND/node_modules/tsx/dist/cli.mjs" --name visioconf-backend --cwd "$project_folder/BACKEND" --interpreter node -- src/index.ts 2>&1
    write_color "  [✓] pm2: visioconf-backend démarré (tsx)" GREEN

    if start_nginx; then
        write_color "  [✓] nginx démarré" GREEN
    else
        return 1
    fi
}
