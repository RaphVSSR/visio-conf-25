# Utiliser une image Node.js officielle comme base
FROM node:22-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers du projet
COPY . .

# Exposer le port sur lequel le serveur backend s'exécute
EXPOSE 3220

CMD ["npm", "run", "dev"]
