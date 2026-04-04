#!/bin/bash

legacy_prod_launch() {
    clear
    write_color "── Launch (Prod) ──" CYAN
    echo ""

    if ! locate_project; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    if ! verify_prod_build; then
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    if [[ ! -f "BACKEND/.env" ]] || [[ ! -f "FRONTENDV2/.env" ]]; then
        write_color "  [✗] Fichiers .env manquants. Lancez d'abord Installation." YELLOW
        read -p "  Appuyez sur Entrée..." dummy
        return
    fi

    _prod_start_services
    sleep 5

    echo ""
    prod_health_report

    read -p "  Appuyez sur Entrée..." dummy
}

_prod_start_services() {
    local proj_dir
    proj_dir="$(cd "${PROJECT_DIR:-.}" && pwd)"
    [[ "$WIZARD_OS" == "windows" ]] && proj_dir="$(cygpath -m "$proj_dir")"

    pm2 start "$proj_dir/BACKEND/dist/index.js" --name visioconf-backend --cwd "$proj_dir/BACKEND" 2>&1
    write_color "  [✓] pm2: visioconf-backend démarré" GREEN

    case "$WIZARD_OS" in
        linux)
            sudo systemctl start nginx 2>&1
            ;;
        windows)
            local nginx_dir
            nginx_dir=$(_win_nginx_dir)
            (cd "$nginx_dir" && "./nginx.exe" < /dev/null > /dev/null 2>&1 &)
            ;;
        macos)
            brew services start nginx 2>&1
            ;;
    esac
    write_color "  [✓] nginx démarré" GREEN
}

