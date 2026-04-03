# Collection

**Source**: `BACKEND/src/models/core/Collection.ts`

Classe de base abstraite pour tous les modèles de documents MongoDB du projet. Les sous-classes (Permission, Role, Team, Channel, etc.) étendent cette classe pour partager une interface de persistance commune.

## Propriétés

Aucune propriété définie dans la classe abstraite elle-même. Les sous-classes implémentent leur propre schema, model et modelInstance.

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| save | — | `Promise<void>` | Abstraite. Persiste l'instance du modèle dans la base de données. Doit être implémentée par chaque sous-classe |
