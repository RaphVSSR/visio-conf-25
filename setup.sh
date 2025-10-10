#!/bin/bash

# Script de demarrage interactif pour MMI-VisioConf (Linux/macOS)
# Ce script propose un choix entre Docker et installation locale

echo "=== Demarrage de MMI-VisioConf ==="
echo "1. Demarrer avec Docker (recommande)"
echo "2. Installation locale"

while true; do
    read -p "Choix (1 ou 2): " choice
    case $choice in
        [1] ) break;;
        [2] ) break;;
        * ) echo "Veuillez entrer 1 ou 2.";;
    esac
done

echo ""

if [ "$choice" = "1" ]; then
    echo ">> Mode Docker selectionne"
      # Verifier Docker
    if ! command -v docker &> /dev/null; then
        echo "X Docker non detecte. Installez Docker Desktop : https://www.docker.com/products/docker-desktop/"
        exit 1
    fi    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "X Docker Compose manquant."
        exit 1
    fi
    
    # Arreter les conteneurs existants
    echo ">> Arret des conteneurs existants..."
    docker-compose down 2>/dev/null

    # Vérifier que Docker Desktop fonctionne
    echo ">> Verification de Docker Desktop..."
    if ! docker info >/dev/null 2>&1; then
        echo "X Docker Desktop ne semble pas fonctionner correctement."
        echo ">> Assurez-vous que Docker Desktop est lance et que le partage de fichiers est active."
        exit 1
    fi
    
    # Construire et demarrer les conteneurs
    echo ">> Construction et demarrage des conteneurs..."
    docker-compose up -d --build    
    if [ $? -eq 0 ]; then
        echo ">> Attente du demarrage des services..."
        sleep 15
        
        echo ">> Initialisation de la base de donnees..."
        docker exec backend node initDb.js
        
        echo ""
        echo "** Application lancee avec succes !"
        echo "** Frontend: http://localhost:3000"
        echo "**  Backend: http://localhost:3220"
        echo "** Connexion suggeree: john.doe@example.com | mdp"
    else
        echo "X Erreur au demarrage avec Docker."
    fi
    
else
    echo ">> Mode installation locale selectionne"
      # Verification Node.js
    if ! command -v node &> /dev/null; then
        echo "X Node.js non detecte. Telechargez-le sur https://nodejs.org/"
        exit 1
    fi
    
    # Verification MongoDB et mongosh
    mongoAvailable=false
    
    # Essayer mongosh d'abord (nouveau shell MongoDB)
    if command -v mongosh &> /dev/null; then
        if mongosh --eval "db.stats()" --quiet mongodb://localhost:27017/test &>/dev/null; then
            mongoAvailable=true
            echo "V MongoDB et mongosh detectes."
        else
            echo "!! mongosh detecte mais MongoDB service non demarre."
        fi
    # Essayer mongo (ancien shell) si mongosh ne fonctionne pas
    elif command -v mongo &> /dev/null; then
        if mongo --eval "db.stats()" --quiet mongodb://localhost:27017/test &>/dev/null; then
            mongoAvailable=true
            echo "V MongoDB detecte (mongo)."
        else
            echo "!! mongo detecte mais MongoDB service non demarre."
        fi
    fi
    
    if [ "$mongoAvailable" = false ]; then
        echo "X MongoDB Shell (mongosh) non detecte."
        echo "Pour l'installation locale, vous devez installer :"
        echo "  1. MongoDB Community Server : https://www.mongodb.com/try/download/community"
        echo "  2. MongoDB Shell (mongosh) : https://www.mongodb.com/try/download/shell"
        echo "  3. Demarrer le service MongoDB"
        echo "  4. Ajouter mongosh au PATH"
        echo ""
        echo "Alternative : Utilisez Docker (option 1) pour eviter cette configuration."
        exit 1
    fi    # Backend
    echo ">> Installation des dependances du backend..."
    cd BACKEND
    if [ ! -f .env ] && [ -f .env.example ]; then
        cp .env.example .env
        echo "V Fichier .env cree depuis .env.example"
    fi
    npm install    
    # Frontend
    echo ">> Installation des dependances du frontend..."
    cd ../FRONTEND
    if [ ! -f .env.local ] && [ -f .env.example ]; then
        cp .env.example .env.local
        echo "V Fichier .env.local cree depuis .env.example"
    fi
    npm install
    
    # Retour au dossier racine
    cd ..
    
    # Lancer les services
    echo ">> Lancement des services..."
    scriptDir=$(pwd)
    
    # Demarrer le backend
    cd "$scriptDir/BACKEND" && npm start &
    
    # Attendre que le backend soit pret
    sleep 8
    
    # Initialiser la base de donnees
    echo ">> Initialisation de la base de donnees..."
    cd "$scriptDir/BACKEND" && node initDb.js
      # Demarrer le frontend
    cd "$scriptDir/FRONTEND" && npm run dev &
    
    echo ""
    echo "** Application en cours de lancement..."
    echo "** Frontend: http://localhost:3000"
    echo "**  Backend: http://localhost:3220"
    echo "** Connexion suggeree: john.doe@example.com | mdp"
fi
