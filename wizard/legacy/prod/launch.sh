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

    pm2 start "$project_folder/BACKEND/dist/index.js" --name visioconf-backend --cwd "$project_folder/BACKEND" 2>&1
    write_color "  [✓] pm2: visioconf-backend démarré" GREEN

    nginx_result=0
    case "$WIZARD_OS" in
        linux)
            sudo systemctl start nginx 2>&1 || nginx_result=1
            ;;
        windows)
            nginx_folder=$(_win_nginx_dir)
            if [ -z "$nginx_folder" ]; then
                write_color "  [✗] nginx introuvable" RED
                return 1
            fi
            (cd "$nginx_folder" && "./nginx.exe" < /dev/null > /dev/null 2>&1 &)
            ;;
        macos)
            brew services start nginx 2>&1 || nginx_result=1
            ;;
    esac
    if [ "$nginx_result" -eq 0 ]; then
        write_color "  [✓] nginx démarré" GREEN
    else
        write_color "  [✗] Échec démarrage nginx" RED
    fi
}
