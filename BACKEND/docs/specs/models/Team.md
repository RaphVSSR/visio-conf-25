# Team

**Source**: `BACKEND/src/models/Team.ts`

Représente une équipe regroupant des utilisateurs. Les équipes contiennent des membres via des références TeamMember et servent d'entité parente pour les channels. Étend Collection.

## Schema

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| name | String (required) | `"Departement MMI"` | Nom d'affichage de l'équipe |
| description | String | `"Administrative team"` | Description optionnelle (défaut : "") |
| picture | String | `"team_pic.png"` | Nom de fichier de l'image de l'équipe (défaut : null) |
| createdBy | ObjectId (required, ref: User) | `ObjectId("...")` | Utilisateur qui a créé l'équipe |
| createdAt | Date | `2026-03-30T...` | Horodatage de création (défaut : Date.now) |
| updatedAt | Date | `2026-03-30T...` | Horodatage de dernière mise à jour (défaut : Date.now) |
| members | ObjectId[] (ref: Teammember) | `[ObjectId("...")]` | Tableau de références aux documents TeamMember |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| constructor | dataToConstruct (TeamType) | Team | Crée une nouvelle instance Team |
| save | -- | Promise\<void\> | Persiste l'instance, lance TracedError en cas d'échec |
| flushAll (static) | -- | Promise | Supprime tous les documents Team |
| injectTest (static) | -- | Promise\<void\> | Injecte 3 équipes de test avec des membres issus des utilisateurs existants |

## Détails

- TeamType exporté pour usage externe
- injectTest crée : "Departement MMI", "Projet Web Avancé", "Administration"
- Chaque membre d'équipe injecté crée aussi un document TeamMember avec le rôle ("admin" ou "member")
- injectTest est idempotent : ignore les équipes existantes par nom
- La chaîne ref des membres est "Teammember" (avec un 'm' minuscule)

## Flux

Voir [team-flows.md](../../flows/team-flows.md)
