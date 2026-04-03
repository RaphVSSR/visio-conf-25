# 🚀 Guide de démarrage rapide

Ce guide vous permettra de faire fonctionner MMI-VisioConf en quelques minutes.

## Option 1 : Script automatique 🔧

**La méthode la plus simple !** Le script détecte automatiquement votre environnement et vous propose le choix entre Docker ou installation locale.

**Windows PowerShell :**

```powershell
.\setup.ps1
```

**Linux/macOS :**

```bash
chmod +x setup.sh
./setup.sh
```

### 🎯 Ce que fait le script :

1. **Propose un choix** : Docker ou installation locale
2. **Vérifie les prérequis** : Docker/Node.js/MongoDB selon votre choix
3. **Installe automatiquement** tout ce qui est nécessaire
4. **Lance l'application** directement
5. **Initialise la base de données** avec des données de test

### 📋 Exemple d'utilisation du script :

```
🎥 Installation et démarrage de MMI-VisioConf
===============================================

Choisissez votre méthode d'installation :

1️⃣  Docker (Recommandé - Plus simple)
    ✅ Installation automatique de toutes les dépendances
    ✅ MongoDB inclus et configuré
    ✅ Environnement isolé et reproductible

2️⃣  Installation locale
    🔧 Nécessite Node.js et MongoDB installés
    🔧 Configuration manuelle requise
    🔧 Plus de contrôle sur l'environnement

Votre choix (1 ou 2): 1

🐳 Installation avec Docker
============================
✅ Docker détecté: Docker version 20.10.21
✅ Docker Compose détecté: docker-compose version 1.29.2

🚀 Lancement de l'application avec Docker...
🔨 Construction et démarrage des conteneurs...
📊 Initialisation de la base de données...

🎉 Installation terminée avec succès !
```

## Option 2 : Docker manuel 🐳

Si vous préférez contrôler le processus Docker manuellement :

```bash
docker-compose up -d
docker exec -it backend node initDb.js
```

## Option 3 : Installation locale manuelle

### Prérequis

-   Node.js 18+
-   MongoDB (local ou Atlas)

### Étapes

1. **Backend** :

```bash
cd BACKEND
npm install
cp .env.template .env
npm start
```

2. **Frontend** (nouveau terminal) :

```bash
cd FRONTEND
npm install
cp .env.template .env.local
npm run dev
```

3. **Base de données** (nouveau terminal) :

```bash
cd BACKEND
node initDb.js
```

## 📝 Configuration MongoDB automatique

### Avec le script automatique

Le script gère automatiquement MongoDB :

**Docker** : MongoDB inclus et configuré automatiquement
**Local** : Le script détecte si MongoDB est installé et propose des solutions :

-   Installation locale
-   MongoDB Atlas (cloud)
-   Configuration manuelle

### Problème courant : MongoDB non démarré

Si vous voyez cette erreur :

```
MongooseServerSelectionError: connect ECONNREFUSED
```

**Solutions automatiques avec le script :**

-   **Docker** : MongoDB démarre automatiquement
-   **Local** : Le script vérifie et guide l'installation

**Solutions manuelles :**

1. **Installation locale Windows** :
    - Installer [MongoDB Community](https://www.mongodb.com/try/download/community)
    - Démarrer le service MongoDB
2. **MongoDB Atlas (cloud)** :
    - Créer un compte gratuit sur [MongoDB Atlas](https://www.mongodb.com/atlas)
    - Modifier `MONGO_URI` dans `BACKEND/.env`

## 🔑 Compte administrateur par défaut

Après l'initialisation, vous pouvez vous connecter avec :

-   **Email** : admin@example.com
-   **Mot de passe** : admin123

## ❓ Problèmes fréquents

### Port déjà utilisé

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Variables d'environnement non chargées

-   Redémarrer les serveurs après modification des fichiers `.env`
-   Vérifier que les variables Frontend commencent par `NEXT_PUBLIC_`

### Erreur CORS

-   Vérifier que `FRONTEND_URL=http://localhost:3000` dans `BACKEND/.env`
-   Redémarrer le Backend

## 📚 Commandes utiles

```bash
# Arrêter Docker
docker-compose down

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Nettoyer les uploads
cd BACKEND
npm run clear-uploads

# Réinitialiser la base de données
cd BACKEND
node initDb.js
```

## 🔄 Avantages du script automatique

| Fonctionnalité           | Script Auto | Docker Manuel | Local Manuel |
| ------------------------ | ----------- | ------------- | ------------ |
| Détection prérequis      | ✅          | ❌            | ❌           |
| Choix de l'environnement | ✅          | ❌            | ❌           |
| Installation automatique | ✅          | ⚠️            | ❌           |
| Configuration MongoDB    | ✅          | ⚠️            | ❌           |
| Lancement automatique    | ✅          | ❌            | ❌           |
| Gestion d'erreurs        | ✅          | ❌            | ❌           |
| Initialisation DB        | ✅          | ❌            | ❌           |

---

**🎯 Objectif : Faire fonctionner l'application en moins de 2 minutes avec le script automatique !**
