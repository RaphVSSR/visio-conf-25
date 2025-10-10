# 🎥 MMI-VisioConf

Application web de visioconférence inspirée de Discord/Teams, développée dans le cadre de la formation MMI à Toulon.

## 🚀 À propos

**VisioConf** permet aux utilisateurs de créer des équipes, des salons de discussion textuels et vocaux avec partage de fichiers. Développé en **fullstack JavaScript** avec Next.js, Express.js, MongoDB et Socket.io.

### 🏗️ Architecture

-   **Frontend** (`FRONTEND/`) : Interface utilisateur avec Next.js + TypeScript
-   **Backend** (`BACKEND/`) : Controller + WebSocket avec Express.js et Socket.io
-   **Base de données** : MongoDB pour la persistance des données
-   **Stockage** : Système de fichiers local pour les uploads

---

## 🚀 Démarrage rapide

### Option 1 : Script automatique (Recommandé) 🔧

Le script intelligent détecte votre environnement et vous guide dans l'installation :

**Windows PowerShell :**

```powershell
.\setup.ps1
```

**Linux/macOS :**

```bash
chmod +x setup.sh
./setup.sh
```

**Fonctionnalités du script :**

-   🎯 **Choix interactif** : Docker ou installation locale
-   🔍 **Détection automatique** des prérequis (Docker, Node.js, MongoDB)
-   ⚙️ **Installation automatique** de toutes les dépendances
-   🚀 **Lancement automatique** de l'application
-   📊 **Initialisation de la base de données** avec des données de test
-   🛠️ **Gestion d'erreurs** et solutions proposées

### Option 2 : Docker manuel

1. **Prérequis** : Docker et Docker Compose installés

2. **Cloner et lancer** :

```bash
git clone https://github.com/HeliosMARTIN/visio-conf.git
cd visio-conf
docker-compose up -d
```

3. **Accéder à l'application** :

    - Frontend : http://localhost:3000
    - Backend API : http://localhost:3220

4. **Initialiser les données de test** :

```bash
docker exec -it backend node initDb.js
```

### Option 3 : Installation manuelle

#### Prérequis

-   Node.js v18+
-   MongoDB (local ou Atlas)

#### Installation

1. **Cloner le projet** :

```bash
git clone https://github.com/HeliosMARTIN/visio-conf.git
cd visio-conf
```

2. **Backend** :

```bash
cd BACKEND
npm install
cp .env.example .env
# Éditer le fichier .env selon vos besoins
```

3. **Frontend** :

```bash
cd ../FRONTEND
npm install
cp .env.example .env.local
# Le fichier .env.local sera ignoré par git
```

4. **Configurer MongoDB** :

    - **Option A - MongoDB local** : Installer MongoDB localement
    - **Option B - MongoDB Atlas** : Créer un cluster gratuit sur [MongoDB Atlas](https://www.mongodb.com/atlas)

5. **Lancer les services** :

```bash
# Terminal 1 - Backend
cd BACKEND
npm start

# Terminal 2 - Frontend
cd FRONTEND
npm run dev
```

6. **Initialiser la base de données** :

```bash
cd BACKEND
node initDb.js
```

---

## 🔐 Configuration des variables d'environnement

### Backend (`BACKEND/.env`)

```bash
# Base de données MongoDB
MONGO_URI=mongodb://localhost:27017/visioconf

# Configuration admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# Sécurité
JWT_SECRET=votre_secret_jwt_très_long_et_sécurisé

# Serveur
PORT=3220
VERBOSE=true
FRONTEND_URL=http://localhost:3000

# Stockage de fichiers
FILE_STORAGE_URL=http://localhost:3220/api/files
PROFILE_PICTURES_URL=http://localhost:3220/api/files/profile
```

### Frontend (`FRONTEND/.env.local`)

```bash
# URL de l'API Backend
NEXT_PUBLIC_API_URL=http://localhost:3220

# URLs pour le stockage de fichiers
NEXT_PUBLIC_FILE_STORAGE_URL=http://localhost:3220/api/files
NEXT_PUBLIC_PROFILE_PICTURES_URL=http://localhost:3220/api/files/profile
```

### 📝 Notes importantes sur les variables d'environnement

-   **Frontend** : Utilise `.env.local` qui sera ignoré par git (recommandé pour Next.js)
-   **Backend** : Utilise `.env` classique
-   **MONGO_URI** :
    -   Local : `mongodb://localhost:27017/visioconf`
    -   Atlas : `mongodb+srv://username:password@cluster.mongodb.net/visioconf`
-   **JWT_SECRET** : Générez une clé sécurisée longue (64+ caractères)

---

## 🗃️ Configuration MongoDB

### Option 1 : MongoDB avec Docker (Simplifié)

Le `docker-compose.yml` inclut déjà MongoDB sans authentification pour simplifier le développement :

```yaml
mongodb:
    image: mongo:8.0
    container_name: mongodb
    ports:
        - "27017:27017"
    volumes:
        - mongodb_data:/data/db
```

**Avantages** :

-   ✅ Aucune configuration d'utilisateur requise
-   ✅ Démarrage automatique avec Docker
-   ✅ Données persistantes

### Option 2 : MongoDB local

1. **Installer MongoDB** : [Télécharger MongoDB Community](https://www.mongodb.com/try/download/community)

2. **Démarrer MongoDB** :

```bash
# Windows
mongod --dbpath "C:\data\db"

# macOS/Linux
sudo systemctl start mongod
```

3. **Vérifier la connexion** :

```bash
mongosh mongodb://localhost:27017/visioconf
```

### Option 3 : MongoDB Atlas (Cloud)

1. **Créer un compte** sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Créer un cluster gratuit**
3. **Configurer l'accès réseau** : Autoriser toutes les IPs (0.0.0.0/0) pour le développement
4. **Créer un utilisateur** avec des droits de lecture/écriture
5. **Copier l'URI de connexion** dans votre `.env`

---

## 🧹 Scripts utiles

### Nettoyage des fichiers uploadés

```bash
cd BACKEND
npm run clear-uploads
```

**Supprime** :

-   📁 Fichiers utilisateurs dans `uploads/files/`
-   🖼️ Photos de profil personnalisées
-   👥 Photos d'équipe

**Préserve** :

-   📄 Fichiers de configuration
-   🖼️ Image de profil par défaut
-   📁 Structure des dossiers

### Réinitialisation complète

```bash
# Arrêter Docker
docker-compose down -v

# Supprimer les données
docker system prune -a --volumes

# Relancer
docker-compose up -d
docker exec -it backend node initDb.js
```

---

## 🔧 Dépannage

### Problèmes courants

#### 1. Erreur de connexion MongoDB

```
MongooseServerSelectionError: connect ECONNREFUSED
```

**Solutions** :

-   Vérifier que MongoDB est démarré
-   Vérifier l'URI dans `.env`
-   Pour Atlas : vérifier les credentials et l'accès réseau

#### 2. Erreur CORS Frontend/Backend

```
Access to fetch at 'http://localhost:3220' from origin 'http://localhost:3000' has been blocked by CORS
```

**Solutions** :

-   Vérifier que `FRONTEND_URL` est correct dans le Backend
-   Redémarrer le Backend après modification des variables d'environnement

#### 3. Variables d'environnement non chargées

**Solutions** :

-   Vérifier que les fichiers `.env` existent
-   Redémarrer les serveurs après modification
-   Frontend : Vérifier que les variables commencent par `NEXT_PUBLIC_`

#### 4. Port déjà utilisé

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions** :

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Logs et debug

```bash
# Logs Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# Mode verbose Backend
# Dans BACKEND/.env
VERBOSE=true
```

---

## 📚 Documentation supplémentaire

-   🔁 [Messages Socket.io](MESSAGES_DOCUMENTATION.md)
-   ⚙️ [Configuration environnement](ENV_SETUP.md)

### 📸 Liens utiles

-   🧠 [Répartition projet (Google Sheet)](https://docs.google.com/spreadsheets/d/16RPy8aX9jTc8ohg1K-XuYi35fKyjXtvpPTFK2d26330/edit?usp=sharing)
-   🔁 [Liste des messages Socket.io](https://docs.google.com/spreadsheets/d/1PU2A-OddIKHMH3m5-PCLM-urDUQUkT3RFboCHYrBTA4/edit?usp=sharing)
-   🎨 [Maquette Figma](https://www.figma.com/design/FhZD9N2AjSr0cu77KebYIc/Visio-conf?node-id=11-644&t=ObnywIOneUb5uQn1-0)

---

## 🤝 Contribution

Ce projet est développé dans le cadre de la formation MMI. Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Projet open source développé pour la formation MMI Toulon.
