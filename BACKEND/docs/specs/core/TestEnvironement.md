# Référence de la classe TestEnvironement — VisioConf

**Fichier source** : `BACKEND/src/models/Core/TestEnvironement.ts`
**Classe parente** : Aucune (classe statique autonome)

---

## 1. Description

**[DEV uniquement]** — `TestEnvironement` fournit les données de test pour le développement. Contient un tableau d'utilisateurs prédéfinis qui servent de base à l'injection dans les autres modèles (Team, Discussion, Channel, etc.). La majorité de ses méthodes sont actuellement commentées. Cette classe n'a aucune utilité en production : les vrais utilisateurs sont créés via le formulaire d'inscription (`register`).

---

## 2. Propriétés de la classe

| Propriété | Type | Visibilité | Description |
|-----------|------|------------|-------------|
| `testUsersToInject` | `UserType[]` | `static` | Tableau de 8 utilisateurs de test prédéfinis |

---

## 3. Utilisateurs de test

| Prénom | Nom | Email | Phone | Job | Status |
|--------|-----|-------|-------|-----|--------|
| John | Doe | john.doe@example.com | `"06 12 34 56 78"` | Responsable RH | active |
| Janny | Doey | janny.doey@example.com | `"06 12 34 56 78"` | Professeur | active |
| Jean | Deau | jean.deau@example.com | `"06 12 34 56 78"` | Responsable Technique | active |
| Hélios | Martin | heliosmartin.hm@gmail.com | `"06 12 34 56 78"` | Étudiant | active |
| Sophie | Durand | sophie.durand@example.com | `"06 12 34 56 78"` | Professeur | active |
| Thomas | Petit | thomas.petit@example.com | `"06 12 34 56 78"` | Étudiant | active |
| Marie | Leroy | marie.leroy@example.com | `"06 12 34 56 78"` | Assistante Administrative | active |
| Lucas | Moreau | lucas.moreau@example.com | `"06 12 34 56 78"` | Technicien | active |

Tous les utilisateurs partagent le même mot de passe hashé SHA256 : `"mdp"` → `f4f263e439cf40925e6a412387a9472a6773c2580212a4fb50d224d3a817de17`

> **Note prod** : En production, chaque utilisateur a un mot de passe unique défini lors de son inscription via le formulaire `register`. Le mot de passe partagé ci-dessus est strictement pour le développement.

---

## 4. Méthodes (commentées)

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| ~~`injectTestUsers`~~ | — | `Promise<void>` | static | (Commentée) Injecte les utilisateurs de test, leur assigne le rôle "user", et crée leurs dossiers racines |
| ~~`defTestUsersRootFiles`~~ | `user: User` | `Promise<void>` | `private static` | (Commentée) Crée la structure de dossiers/fichiers de test pour un utilisateur |

---

## 5. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `User` | TestEnvironement → User | Les utilisateurs de test sont créés via le modèle User |
| `FileSystem` | TestEnvironement → FileSystem | (Commenté) Copie des fichiers de test |
| `Folder` | TestEnvironement → Folder | (Commenté) Création des dossiers racines |
| `Role` | TestEnvironement → Role | (Commenté) Attribution du rôle "user" |

---

## 6. Types TypeScript

```typescript
class TestEnvironement {
    static testUsersToInject: UserType[];
}
```
