#!/bin/sh

PREREQS_LINUX="sudo ca-certificates curl gpg git openssl make python3"
PREREQS_MACOS="brew git"
PREREQS_WINDOWS="git"

_prereq_is_installed() {
    check_name="$1"
    case "$check_name" in
        ca-certificates) [ -f /etc/ssl/certs/ca-certificates.crt ] ;;
        *)               command -v "$check_name" > /dev/null 2>&1 ;;
    esac
}

_guard_windows_installer() {
    if command -v winget > /dev/null 2>&1 || command -v choco > /dev/null 2>&1; then
        return 0
    fi
    write_color "  [✗] Aucun gestionnaire de paquets Windows (winget ou choco)" RED
    write_color "  → Installez winget via le Microsoft Store (recherchez 'App Installer')" YELLOW
    write_color "  → Ou installez Chocolatey : https://chocolatey.org/install" YELLOW
    return 1
}

_guard_macos_installer() {
    if command -v brew > /dev/null 2>&1; then
        return 0
    fi
    write_color "  [✗] Homebrew requis pour installer les prérequis" RED
    write_color "  → Installez Homebrew : https://brew.sh" YELLOW
    return 1
}

setup_prereqs() {
    case "$WIZARD_OS" in
        linux)
            prereqs_list="$PREREQS_LINUX"
            ;;
        macos)
            _guard_macos_installer || return 1
            prereqs_list="$PREREQS_MACOS"
            ;;
        windows)
            _guard_windows_installer || return 1
            prereqs_list="$PREREQS_WINDOWS"
            ;;
        *)
            prereqs_list=""
            ;;
    esac

    [ -z "$prereqs_list" ] && return 0

    write_color "  Vérification des prérequis système ($WIZARD_OS)..." CYAN
    ask_install_prereqs $prereqs_list
}

guard_cmd() {
    tool_name="$1"
    hint_msg="$2"
    if command -v "$tool_name" > /dev/null 2>&1; then
        return 0
    fi
    write_color "  [✗] $tool_name introuvable" RED
    [ -n "$hint_msg" ] && write_color "  → $hint_msg" YELLOW
    return 1
}

guard_curl()    { guard_cmd curl    "Installez curl avant de continuer"; }
guard_gpg()     { guard_cmd gpg     "Installez gnupg avant de continuer"; }
guard_openssl() { guard_cmd openssl "Installez openssl avant de continuer"; }
guard_apt()     { guard_cmd apt     "Cette opération requiert apt (Debian/Ubuntu)"; }
guard_brew()    { guard_cmd brew    "Installez Homebrew avant de continuer"; }
guard_sudo()    { guard_cmd sudo    "sudo requis pour cette opération"; }

guard_lsb() {
    if command -v lsb_release > /dev/null 2>&1; then
        return 0
    fi
    if [ -r /etc/os-release ]; then
        return 0
    fi
    write_color "  [✗] Impossible de détecter la distribution" RED
    return 1
}

guard_systemd() {
    if ! command -v systemctl > /dev/null 2>&1; then
        write_color "  [✗] systemctl introuvable" RED
        return 1
    fi
    if [ -d /run/systemd/system ]; then
        return 0
    fi
    write_color "  [!] systemd absent (init PID 1 différent)" YELLOW
    return 1
}

guard_port() {
    port_num="$1"
    if command -v lsof > /dev/null 2>&1; then
        lsof -i ":$port_num" > /dev/null 2>&1 && return 1
        return 0
    fi
    if command -v ss > /dev/null 2>&1; then
        ss -ltn "sport = :$port_num" 2>/dev/null | grep -q ":$port_num" && return 1
        return 0
    fi
    if command -v netstat > /dev/null 2>&1; then
        netstat -an 2>/dev/null | grep -q "[:.]$port_num .*LISTEN" && return 1
        return 0
    fi
    write_color "  [!] Aucun outil pour vérifier le port $port_num" YELLOW
    return 0
}

find_port_pid() {
    port_num="$1"
    if command -v lsof > /dev/null 2>&1; then
        lsof -ti ":$port_num" 2>/dev/null | head -1
        return
    fi
    if command -v ss > /dev/null 2>&1; then
        ss -ltnp "sport = :$port_num" 2>/dev/null | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2
        return
    fi
    if command -v netstat > /dev/null 2>&1; then
        netstat -tlnp 2>/dev/null | grep ":$port_num " | awk '{print $NF}' | cut -d/ -f1 | head -1
        return
    fi
    echo ""
}

is_port_listening() {
    port_num="$1"
    if command -v lsof > /dev/null 2>&1; then
        lsof -i ":$port_num" > /dev/null 2>&1
        return
    fi
    if command -v ss > /dev/null 2>&1; then
        ss -ltn "sport = :$port_num" 2>/dev/null | grep -q ":$port_num"
        return
    fi
    if command -v netstat > /dev/null 2>&1; then
        netstat -an 2>/dev/null | grep -q "[:.]$port_num .*LISTEN"
        return
    fi
    return 1
}

guard_net() {
    host_url="$1"
    if command -v curl > /dev/null 2>&1; then
        curl -fsSL --max-time 5 -o /dev/null "$host_url" 2>/dev/null && return 0
        return 1
    fi
    if command -v wget > /dev/null 2>&1; then
        wget -q --timeout=5 --tries=1 -O /dev/null "$host_url" 2>/dev/null && return 0
        return 1
    fi
    write_color "  [!] Aucun outil réseau (curl/wget)" YELLOW
    return 1
}

guard_all() {
    failure_flag=0
    for tool_name in "$@"; do
        guard_cmd "$tool_name" || failure_flag=1
    done
    return "$failure_flag"
}

_prereq_pkg_name() {
    tool_name="$1"
    case "$tool_name" in
        gpg)  echo "gnupg" ;;
        make) echo "build-essential" ;;
        *)    echo "$tool_name" ;;
    esac
}

install_prereqs() {
    tools_list="$*"
    [ -z "$tools_list" ] && return 0

    case "$WIZARD_OS" in
        linux)
            pkgs_list=""
            for tool_name in $tools_list; do
                pkgs_list="$pkgs_list $(_prereq_pkg_name "$tool_name")"
            done
            command -v sudo > /dev/null 2>&1 || {
                write_color "  [✗] sudo requis pour installer les prérequis" RED
                return 1
            }
            write_color "  Mise à jour des index apt..." YELLOW
            if ! sudo apt update 2>&1; then
                write_color "  [!] 'apt update' a signalé des erreurs (dépôts tiers) — tentative d'installation malgré tout" YELLOW
            fi
            write_color "  Installation :$pkgs_list" YELLOW
            sudo apt install -y $pkgs_list 2>&1 || {
                write_color "  [✗] Échec installation apt :$pkgs_list" RED
                return 1
            }
            ;;
        macos)
            command -v brew > /dev/null 2>&1 || {
                write_color "  [✗] brew requis pour installer les prérequis" RED
                return 1
            }
            for tool_name in $tools_list; do
                pkg_name=$(_prereq_pkg_name "$tool_name")
                write_color "  Installation via brew : $pkg_name" YELLOW
                brew install "$pkg_name" 2>&1 || {
                    write_color "  [✗] Échec brew install $pkg_name" RED
                    return 1
                }
            done
            ;;
        windows)
            write_color "  [!] Prérequis à installer manuellement sur Windows :$tools_list" YELLOW
            return 1
            ;;
        *)
            write_color "  [✗] OS inconnu — installation automatique impossible" RED
            return 1
            ;;
    esac

    return 0
}

ask_install_prereqs() {
    write_color "── Vérification des prérequis ──" CYAN
    missing_tools=""
    for tool_name in "$@"; do
        if _prereq_is_installed "$tool_name"; then
            write_color "  [✓] $tool_name déjà présent" GREEN
        else
            write_color "  [!] $tool_name manquant" YELLOW
            missing_tools="$missing_tools $tool_name"
        fi
    done
    missing_tools="${missing_tools# }"

    if [ -z "$missing_tools" ]; then
        write_color "  Tous les prérequis sont en place" CYAN
        return 0
    fi

    echo ""
    printf '%s' "  Installer les manquants ? [O/n] : "
    read -r consent_answer
    case "$consent_answer" in
        n|N|no|NO|non|NON)
            write_color "  [✗] Installation refusée, opération annulée" RED
            sleep 3
            return 1
            ;;
    esac

    install_prereqs $missing_tools || return 1

    for tool_name in $missing_tools; do
        if _prereq_is_installed "$tool_name"; then
            write_color "  [✓] $tool_name installé avec succès" GREEN
        else
            write_color "  [✗] $tool_name toujours absent après installation" RED
            return 1
        fi
    done
    return 0
}
