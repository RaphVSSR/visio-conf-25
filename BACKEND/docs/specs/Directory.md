# Directory : Dossier de Spécification des Flux

**Service** : `DirectoryService`  
**Type** : CLIENT  
**Édité le** : 04/05/2026

---

## Description du rôle
Composant logique gérant la récupération de la liste des membres depuis MongoDB. Il permet d'alimenter les vues de recherche ou les listes de contacts globales.

---

## 1. FLUX SORTANTS (MESSAGES À ÉMETTRE)

### 📤 MESSAGE : `directory`

**D'OÙ VIENNENT LES DONNÉES ? (ORIGINE)**
Interrogation de la collection `Users` de MongoDB via le `DirectoryService`.

#### STRUCTURE TECHNIQUE
```json
{
  "success": true,
  "users": [
    {
      "_id": "67c...a1",
      "firstname": "Jean",
      "lastname": "Dupont",
      "email": "j.dupont@tozza.net",
      "is_online": true,
      "disturb_status": "available",
      "roles": ["user"],
      "phone": "06...",
      "picture": "/uploads/..."
    }
  ]
}
```

#### EXEMPLE DE DONNÉES RÉELLES
```json
{
  "success": true,
  "users": [
    {
      "_id": "69f846f08d5d7f0a5b419c47",
      "firstname": "Raph",
      "lastname": "VSSR",
      "is_online": true,
      "picture": "default_profile_picture.png"
    }
  ]
}
```

---

## 2. FLUX ENTRANTS (MESSAGES À RECEVOIR)

### 📥 MESSAGE : `get_directory`

**QUE FAIRE À LA RÉCEPTION ? (ACTION)**
Interroge la collection `Users` de MongoDB pour récupérer la liste complète des membres (excluant les informations sensibles comme les mots de passe) et renvoie le message `directory` contenant le tableau des membres au client.

#### STRUCTURE ATTENDUE
```json
{
  "get_directory": {}
}
```

#### EXEMPLE DE MESSAGE ENTRANT
```json
{
  "get_directory": {
    "userId": "user_id_optional"
  }
}
```

---

*Fin du document de spécification technique - Directory*
