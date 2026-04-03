# Matrice de commandes par OS

L'OS est sélectionné une seule fois à l'entrée du Legacy Manager. Toutes les commandes s'adaptent en conséquence.

## Lancement de terminal (dev launch)

| OS | Commande |
|---|---|
| Linux | `gnome-terminal -- bash -c "cd '<path>'; <cmd>; exec bash"` |
| Windows | `Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '<path>'; <cmd>"` |
| macOS | `osascript -e 'tell app "Terminal" to do script "cd <path> && <cmd>"'` |

## Gestion des processus

| Action | Linux | Windows | macOS |
|---|---|---|---|
| Tuer par PID | `kill <pid>` | `taskkill /PID <pid> /F` | `kill <pid>` |
| Trouver par port | `lsof -i :<port>` | `netstat -ano \| findstr :<port>` | `lsof -i :<port>` |
| Vérifier port ouvert | `curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>` | `Invoke-WebRequest` | `curl` (idem Linux) |

## Indications d'installation des dépendances

| Outil | Linux (apt) | Windows | macOS (brew) |
|---|---|---|---|
| Node.js | `apt install nodejs` | nodejs.org installer | `brew install node` |
| MongoDB | `apt install mongod` | mongodb.com installer | `brew install mongodb-community` |
| pm2 | `npm install -g pm2` | `npm install -g pm2` | `npm install -g pm2` |
| nginx | `apt install nginx` | nginx.org download | `brew install nginx` |
| certbot | `apt install certbot` | `choco install certbot` | `brew install certbot` |
| mkcert | `apt install mkcert` | `choco install mkcert` | `brew install mkcert` |

## Chemins de configuration nginx

| OS | Chemin de configuration |
|---|---|
| Linux | `/etc/nginx/sites-available/` |
| Windows | `<nginx-dir>/conf/` |
| macOS | `/usr/local/etc/nginx/` ou `/opt/homebrew/etc/nginx/` |

## Chemins des certificats SSL (certbot)

| OS | Chemin |
|---|---|
| Linux | `/etc/letsencrypt/live/<domain>/` |
| Windows | `C:\Certbot\live\<domain>\` |
| macOS | `/etc/letsencrypt/live/<domain>/` |

## Démarrage pm2

| OS | Commande |
|---|---|
| Linux | `pm2 startup systemd` |
| Windows | `pm2-startup` (npm package) |
| macOS | `pm2 startup launchd` |

## Gestion des services

| Action | Linux | Windows | macOS |
|---|---|---|---|
| Démarrer nginx | `systemctl start nginx` | `nginx` (direct) | `brew services start nginx` |
| Arrêter nginx | `systemctl stop nginx` | `nginx -s stop` | `brew services stop nginx` |
| Recharger nginx | `nginx -s reload` | `nginx -s reload` | `nginx -s reload` |
| Statut nginx | `systemctl status nginx` | `tasklist /FI "IMAGENAME eq nginx.exe"` | `brew services list` |
