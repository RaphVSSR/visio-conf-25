#!/bin/bash

# Force UTF-8 (usually default in modern Linux/macOS)
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

# Color definitions using tput
RED=$(tput setaf 1)
GREEN=$(tput setaf 2)
YELLOW=$(tput setaf 3)
BLUE=$(tput setaf 4)
CYAN=$(tput setaf 6)
WHITE=$(tput setaf 7)
NC=$(tput sgr0) # No Color

write_color() {
    echo "${!2:-$WHITE}${1}${NC}"
}

invoke_compose() {
    local args=("$@")
    "${compose_cmd[@]}" "${args[@]}"
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        write_color "ERREUR: ${compose_cmd[*]} ${args[*]} (code: $exit_code)" RED
        return 1
    fi
    return 0
}

# Main menu
while true; do
    clear
    write_color "=== Gestionnaire MMI-VisioConf ==="
    write_color "1. Gestion avec Docker (recommande)" GREEN
    write_color "2. Installation locale" BLUE
    write_color "3. Fermer le gestionnaire" RED
    read -p "Choix (1 - 3): " choice

    case $choice in
        1)
            clear
            write_color ">> Mode Docker selectionne" CYAN
            # Check Docker
            if ! command -v docker >/dev/null 2>&1; then
                write_color "X Docker non detecte. Installez Docker Desktop : https://www.docker.com/products/docker-desktop" RED
                exit 1
            fi

            # Detect Docker Compose V2 or V1
            compose_cmd=()
            if docker compose version >/dev/null 2>&1; then
                compose_cmd=(docker compose)
                write_color "Compose V2 detecte. Prefix: ${compose_cmd[*]}" GREEN
            elif command -v docker-compose >/dev/null 2>&1 && docker-compose version >/dev/null 2>&1; then
                compose_cmd=(docker-compose)
                write_color "Compose V1 detecte. Prefix: ${compose_cmd[*]}" GREEN
            else
                write_color "Nouvelle version de Docker Compose manquante.." RED
                write_color "Ancienne version de Docker Compose manquante.." RED
                write_color "ERREUR: Docker Compose est manquant sur votre système." RED
                exit 1
            fi

            write_color ">> Verification de Docker Desktop..." YELLOW
            if ! docker info >/dev/null 2>&1; then
                write_color "X Docker Desktop ne semble pas fonctionner correctement." RED
                write_color ">> Assurez-vous que Docker Desktop est lance et que le partage de fichiers est actif." YELLOW
                write_color ">> Assurez-vous que le moteur Docker soit actif et fonctionnel puisque sans le Desktop les conteneurs ne pourront pas etre demarres si ce n'est pas prévu." BLUE
                sleep 10
                #exit 1
            else
                write_color "Docker Desktop detecte !" GREEN
            fi

            write_color "..."
            sleep 5

            # Docker submenu
            while true; do
                clear
                write_color "=== Gestion de MMI-VisioConf ==="
                write_color "0. Retour"
                write_color "1. Demarrer l'application" YELLOW
                write_color "2. Redemarrer l'application" YELLOW
                write_color "3. Arreter l'application" RED
                read -p "Choix (0 - 3): " docker_choice

                case $docker_choice in
                    0)
                        break
                        ;;
                    1)
                        write_color ">> Arret des conteneurs existants..." YELLOW
                        invoke_compose down || true

                        write_color ">> Construction et demarrage des conteneurs..." YELLOW
                        invoke_compose up -d --build
                        if [ $? -eq 0 ]; then
                            write_color ">> Attente du demarrage des services..." YELLOW
                            sleep 15
                            write_color "** Application lancee avec succes !" GREEN
                            write_color "** Frontend: http://localhost:3000" CYAN
                            write_color "** Backend: http://localhost:3220" CYAN
                            write_color "** Connexion suggeree: dev@visioconf.com | d3vV1s10C0nf" YELLOW
                        else
                            write_color "X Erreur au demarrage avec Docker." RED
                        fi
                        ;;
                    2)
                        write_color ">> Redemarrage des conteneurs..." YELLOW
                        invoke_compose restart
                        sleep 15
                        ;;
                    3)
                        write_color ">> Arret des conteneurs ..." YELLOW
                        invoke_compose down
                        sleep 15
                        ;;
                    *)
                        echo "Choix invalide (0-3 seulement)" >&2
                        sleep 2
                        ;;
                esac
            done
            ;;
        2)
            clear
            write_color ">> Mode installation locale selectionne" CYAN
            # Check Node.js
            if ! command -v node >/dev/null 2>&1; then
                write_color "X Node.js non detecte. Telechargez-le sur https://nodejs.org/" RED
                exit 1
            fi

            # Check MongoDB shell
            mongo_available=false
            if command -v mongosh >/dev/null 2>&1 && mongosh --eval 'db.stats()' --quiet >/dev/null 2>&1; then
                mongo_available=true
                write_color "V MongoDB et mongosh detectes." GREEN
            elif command -v mongo >/dev/null 2>&1 && mongo --eval 'db.stats()' --quiet >/dev/null 2>&1; then
                mongo_available=true
                write_color "V MongoDB detecte (mongo)." GREEN
            fi

            if [ "$mongo_available" = false ]; then
                write_color "X MongoDB Shell (mongosh) non detecte." RED
                write_color "Pour l'installation locale, vous devez installer :" YELLOW
                write_color "  1. MongoDB Community Server : https://www.mongodb.com/try/download/community" YELLOW
                write_color "  2. MongoDB Shell (mongosh) : https://www.mongodb.com/try/download/shell" YELLOW
                write_color "  3. Demarrer le service MongoDB" YELLOW
                write_color "  4. Ajouter mongosh au PATH" YELLOW
                write_color "" WHITE
                write_color "Alternative : Utilisez Docker (option 1) pour eviter cette configuration." CYAN
                exit 1
            fi

            # Backend
            write_color ">> Installation des dependances du backend..." YELLOW
            cd BACKEND || exit 1
            if [ ! -f .env.local ] && [ -f .env.example ]; then
                cp .env.example .env.local
                write_color "V Fichier .env.local cree depuis .env.example" GREEN
            fi
            npm install

            # Frontend
            write_color ">> Installation des dependances du frontend..." YELLOW
            cd ../FRONTENDV2 || exit 1
            if [ ! -f .env.local ] && [ -f .env.example ]; then
                cp .env.example .env.local
                write_color "V Fichier .env.local cree depuis .env.example" GREEN
            fi
            npm install

            # Back to root
            cd ../ || exit 1

            # Launch services in background new terminals (using gnome-terminal or similar; adjust for your terminal) [web:5][web:16]
            script_dir=$(pwd)
            gnome-terminal -- bash -c "cd '$script_dir/BACKEND'; echo 'Demarrage du backend...'; npm start; exec bash" &
            sleep 8

            gnome-terminal -- bash -c "cd '$script_dir/FRONTENDV2'; echo 'Demarrage du frontend...'; npm run dev; exec bash" &
            write_color "** Application en cours de lancement..." GREEN
            write_color "** Frontend: http://localhost:3000" CYAN
            write_color "** Backend: http://localhost:3220" CYAN
            write_color "** Connexion suggeree: dev@visioconf.com | d3vV1s10C0nf" YELLOW
            ;;
        3)
            write_color ">> Fermeture du gestionnaire..." CYAN
            exit 0
            ;;
        *)
            clear
            echo "Choix invalide (1-3 seulement)" >&2
            sleep 2
            ;;
    esac
done
