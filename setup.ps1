# Configuration UTF-8 complete pour l'affichage correct des caracteres
# Forcer la page de code UTF-8 dans la console
chcp 65001 > $null

# Configuration de l'encodage pour PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Variables globales pour l'encodage
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$env:PYTHONIOENCODING = "utf-8"

$global:composeCmd = $null

function Write-Color($text, $color = "White") {
    Write-Host $text -ForegroundColor $color
}

function Invoke-Compose {
    param($Arguments)

    try{

        Invoke-Expression "$global:composeCmd $($Arguments -join " ")"
        if ($LASTEXITCODE -ne 0) {
            Write-Color "ERREUR: $global:composeCmd $($Arguments -join ' ') (code: $LASTEXITCODE)" Red
            return $false
        }

    }catch {

        Write-Color "ERREUR: $global:composeCmd $Arguments (code: $LASTEXITCODE)" Red
        Write-Color "ERREUR: $($_.Exception.Message)" Red
        return $false
    }
}

:menuPrincipal while ($true) {

    Clear-Host
    Write-Color "=== Gestionnaire MMI-VisioConf ==="
    Write-Color "1. Gestion avec Docker (recommande)" Green
    Write-Color "2. Installation locale" Blue
    Write-Color "3. Fermer le gestionnaire" Red
    $choice = Read-Host "Choix (1 - 3)"

    switch ($choice) {

        1 {

            Clear-Host
            Write-Color ">> Mode Docker selectionne" Cyan
            # Verifier Docker
            if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
                Write-Color "X Docker non detecte. Installez Docker Desktop : https://www.docker.com/products/docker-desktop" Red
                exit 1
            }

            # Docker Compose
            docker compose version 2>$null
            if ($LASTEXITCODE -eq 0) {

                $global:composeCmd = @("docker", "compose")
                Write-Color "Compose V2 detecte. Prefix: $global:composeCmd" Green

            }else{

                Write-Color "Nouvelle version de Docker Compose manquante.." Red

                docker-compose version 2>$null
                if ($LASTEXITCODE -eq 0) {

                    $global:composeCmd = @("docker-compose")
                    Write-Color "Compose V1 detecte. Prefix: $global:composeCmd" Green

                }else{

                    Write-Color "Ancienne version de Docker Compose manquante.." Red
                    Write-Color "ERREUR: Docker Compose est manquant sur votre système." Red
                    exit 1

                }
            }

            # Vérifier que Docker Desktop fonctionne
            Write-Color ">> Verification de Docker Desktop..." Yellow
            try {
                docker info >$null 2>&1
                if ($LASTEXITCODE -ne 0) {
                    Write-Color "X Docker Desktop ne semble pas fonctionner correctement." Red
                    Write-Color ">> Assurez-vous que Docker Desktop est lance et que le partage de fichiers est actif." Yellow
                    Write-Color ">> Assurez-vous que le moteur Docker soit actif et fonctionnel puisque sans le Desktop les conteneurs ne pourront pas etre demarres si ce n'est pas prévu." Blue
                    Start-Sleep 10
                    #exit 1

                }else {

                    Write-Color "Docker Desktop detecte !" Green
                }
            }
            catch {
                Write-Color "X Impossible de communiquer avec Docker." Red
                exit 1
            }

            Write-Color "..."
            Start-Sleep 5

            :menuDocker while ($true) {

                Clear-Host
                Write-Color "=== Gestion de MMI-VisioConf ==="
                Write-Color "0. Retour"
                Write-Color "1. Demarrer l'application" Yellow
                Write-Color "2. Redemarrer l'application" Yellow
                Write-Color "3. Arreter l'application" Red
                $dockerChoice = Read-Host "Choix (0 - 3)"

                switch ($dockerChoice) {

                    0 { 
                        $choice = $null
                        break menuDocker
                    }
                    1 {

                        # Arreter les conteneurs existants
                        Write-Color ">> Arret des conteneurs existants..." Yellow
                        Invoke-Compose @("down")

                        # Construire et demarrer les conteneurs
                        Write-Color ">> Construction et demarrage des conteneurs..." Yellow
                        Invoke-Compose @("up", "-d", "--build")
                        
                        if ($LASTEXITCODE -eq 0) {
                            Write-Color ">> Attente du demarrage des services..." Yellow
                            Start-Sleep -Seconds 15
                            
                            Write-Color "`n** Application lancee avec succes !" Green
                            Write-Color "** Frontend: http://localhost:3000" Cyan
                            Write-Color "** Backend: http://localhost:3220" Cyan
                            Write-Color "** Connexion suggeree: dev@visioconf.com | d3vV1s10C0nf" Yellow
                        }
                        else {
                            Write-Color "X Erreur au demarrage avec Docker." Red
                        }
                    }
                    2 {

                        Write-Color ">> Redemarrage des conteneurs..." Yellow
                        Invoke-Compose @("restart")
                        Start-Sleep -Seconds 15
                    }
                    3 {

                        Write-Color ">> Arret des conteneurs ..." Yellow
                        Invoke-Compose @("down")
                        Start-Sleep -Seconds 15
                    }
                    default { 
                        Write-Warning "Choix invalide (0-3 seulement)"
                        Start-Sleep 2
                        $dockerChoice = $null
                    }
                }

            }
            
        }
        2 {

            Clear-Host
            Write-Color ">> Mode installation locale selectionne" Cyan
            # Verification Node.js
            if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
                Write-Color "X Node.js non detecte. Telechargez-le sur https://nodejs.org/" Red
                exit 1
            }
            
            # Verification MongoDB et mongosh
            $mongoAvailable = $false
            
            # Essayer mongosh d'abord (nouveau shell MongoDB)
            if (Get-Command mongosh -ErrorAction SilentlyContinue) {
                try {
                    & mongosh --eval 'db.stats()' --quiet > $null 2>&1
                    $mongoAvailable = $true
                    Write-Color "V MongoDB et mongosh detectes." Green
                }
                catch {
                    Write-Color "!! mongosh detecte mais MongoDB service non demarre." Yellow
                }
            }
            # Essayer mongo (ancien shell) si mongosh ne fonctionne pas
            elseif (Get-Command mongo -ErrorAction SilentlyContinue) {
                try {
                    & mongo --eval 'db.stats()' --quiet > $null 2>&1
                    $mongoAvailable = $true
                    Write-Color "V MongoDB detecte (mongo)." Green
                }
                catch {
                    Write-Color "!! mongo detecte mais MongoDB service non demarre." Yellow
                }
            }
            
            if (-not $mongoAvailable) {
                Write-Color "X MongoDB Shell (mongosh) non detecte." Red
                Write-Color "Pour l'installation locale, vous devez installer :" Yellow
                Write-Color "  1. MongoDB Community Server : https://www.mongodb.com/try/download/community" Yellow
                Write-Color "  2. MongoDB Shell (mongosh) : https://www.mongodb.com/try/download/shell" Yellow
                Write-Color "  3. Demarrer le service MongoDB" Yellow        Write-Color "  4. Ajouter mongosh au PATH" Yellow
                Write-Color "" White
                Write-Color "Alternative : Utilisez Docker (option 1) pour eviter cette configuration." Cyan
                exit 1
            }

            # Backend - Installation des dependances
            Write-Color ">> Installation des dependances du backend..." Yellow
            Set-Location BACKEND
            if (!(Test-Path ".env") -and (Test-Path ".env.example")) {
                Copy-Item ".env.example" ".env.local"
                Write-Color "V Fichier .env.local cree depuis .env.example" Green
            }
            npm install

            # Frontend - Installation des dependances
            Write-Color ">> Installation des dependances du frontend..." Yellow
            Set-Location ../FRONTENDV2
            if (!(Test-Path ".env.local") -and (Test-Path ".env.example")) {
                Copy-Item ".env.example" ".env.local"
                Write-Color "V Fichier .env.local cree depuis .env.example" Green
            }
            npm install

            # Retour au dossier racine
            Set-Location ..

            # Lancer les services
            Write-Color ">> Lancement des services..." Yellow
            $scriptDir = Get-Location
            
            # Demarrer le backend
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\BACKEND'; Write-Host 'Demarrage du backend...' -ForegroundColor Green; npm start"
            
            # Attendre que le backend soit pret
            Start-Sleep -Seconds 8
            
            ## Initialiser la base de donnees
            #Write-Color ">> Initialisation de la base de donnees..." Yellow
            #Set-Location BACKEND
            #node initDb.js
            #Set-Location ..
            
            # Demarrer le frontend
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\FRONTENDV2'; Write-Host 'Demarrage du frontend...' -ForegroundColor Green; npm run dev"
            Write-Color "`n** Application en cours de lancement..." Green
            Write-Color "** Frontend: http://localhost:3000" Cyan
            Write-Color "**  Backend: http://localhost:3220" Cyan
            Write-Color "** Connexion suggeree: dev@visioconf.com | d3vV1s10C0nf" Yellow
        }
        3 {

            Write-Color ">> Fermeture du gestionnaire..." Cyan
            exit 0
        }
        default {

            Clear-Host
            Write-Warning "Choix invalide (1-3 seulement)"
            Start-Sleep 2
            $choice = $null
        }
    }

}
