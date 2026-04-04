# Matrice de commandes par OS

L'OS est sélectionné une seule fois à l'entrée du Legacy Manager.

## Lancement de terminal (dev)

| OS | Commande |
|---|---|
| Linux | `gnome-terminal -- bash -c "cd '<path>'; <cmd>; exec bash"` |
| Windows | `Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '<path>'; <cmd>"` |
| macOS | `osascript -e 'tell app "Terminal" to do script "cd <path> && <cmd>"'` |

## Gestion des processus

| Action | Linux/macOS | Windows |
|---|---|---|
| Trouver par port | `lsof -ti :<port>` | `netstat -ano \| findstr :<port>` |
| Tuer par PID | `kill <pid>` | `taskkill /PID <pid> /F` |

## Installation des dépendances

| Outil | Linux (apt) | Windows (winget/choco) | macOS (brew) |
|---|---|---|---|
| Node.js | `apt install nodejs` | nodejs.org | `brew install node` |
| MongoDB | apt repo MongoDB 8.0 | mongodb.com | `brew install mongodb-community` |
| pm2 | `npm install -g pm2` | `npm install -g pm2` | `npm install -g pm2` |
| nginx | `apt install nginx` | `choco install nginx` | `brew install nginx` |
| certbot | `apt install certbot` | `choco install certbot` | `brew install certbot` |
| mkcert | `apt install mkcert` | `choco install mkcert` | `brew install mkcert` |

## Chemins nginx

| OS | Chemin de configuration |
|---|---|
| Linux | `/etc/nginx/sites-available/` |
| Windows | `<nginx-dir>/conf/` |
| macOS | `/usr/local/etc/nginx/` ou `/opt/homebrew/etc/nginx/` |

## Certificats SSL (certbot)

| OS | Chemin |
|---|---|
| Linux/macOS | `/etc/letsencrypt/live/<domain>/` |
| Windows | `C:\Certbot\live\<domain>\` |

## Services nginx

| Action | Linux | Windows | macOS |
|---|---|---|---|
| Démarrer | `systemctl start nginx` | `nginx` (direct) | `brew services start nginx` |
| Arrêter | `systemctl stop nginx` | `nginx -s stop` | `brew services stop nginx` |
| Recharger | `nginx -s reload` | `nginx -s reload` | `nginx -s reload` |

## Démarrage pm2

| OS | Commande |
|---|---|
| Linux | `pm2 startup systemd` |
| Windows | `pm2-startup` (package npm) |
| macOS | `pm2 startup launchd` |
