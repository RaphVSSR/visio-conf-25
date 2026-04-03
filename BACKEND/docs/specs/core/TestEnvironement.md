# TestEnvironement

**Source**: `BACKEND/src/models/core/TestEnvironement.ts`

Classe statique réservée au développement contenant des utilisateurs de test prédéfinis pour le seeding de la base de données. Contient 8 entrées `UserType` codées en dur partageant toutes le même mot de passe hashé en SHA256. Non utilisée en production.

## Propriétés

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| testUsersToInject | `UserType[]` | `[{ firstname: "John", lastname: "Doe", ... }]` | Tableau de 8 utilisateurs de test avec des données de profil prédéfinies et le hash de mot de passe partagé `f4f263e...de17` |

## Méthodes

Aucune méthode définie.

## Détails

Les 8 utilisateurs de test ont le statut `"active"` et partagent le même hash de mot de passe SHA256. Le type `UserType` est importé depuis `../User.ts`. Chaque entrée contient : firstname, lastname, email, phone, job, desc, status et password.
