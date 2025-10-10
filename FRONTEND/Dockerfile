# Utiliser une image Node.js officielle comme base
FROM node:18-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers du projet
COPY . .

# Construire l'application Next.js
RUN npm run build

# Exposer le port sur lequel le serveur frontend s'exécute
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["npm", "start"]
