# Channel

**Source**: `BACKEND/src/models/Channel.ts`

Représente un canal de communication au sein d'une équipe. Les channels peuvent être publics ou privés et contiennent des références à leurs membres via des documents ChannelMember. Étend Collection.

## Schema

| Nom | Type | Exemple | Description |
|-----|------|---------|-------------|
| name | String (required, trimmed) | `"General"` | Nom d'affichage du channel |
| teamId | ObjectId (required) | `ObjectId("...")` | Référence à l'équipe parente (pas de ref déclarée) |
| isPublic | Boolean | `true` | Si le channel est visible par tous les membres de l'équipe (défaut : true) |
| createdBy | ObjectId (required, ref: User) | `ObjectId("...")` | Utilisateur qui a créé le channel |
| createdAt | Date | `2026-03-30T...` | Horodatage de création (défaut : Date.now) |
| updatedAt | Date | `2026-03-30T...` | Horodatage de dernière mise à jour (défaut : Date.now) |
| members | ObjectId[] (ref: ChannelMember) | `[ObjectId("...")]` | Tableau de références aux documents ChannelMember |

## Méthodes

| Nom | Paramètres (types) | Retour | Description |
|-----|-------------------|--------|-------------|
| constructor | dataToConstruct (ChannelType) | Channel | Crée une nouvelle instance Channel avec un modèle Mongoose |
| save | -- | Promise\<void\> | Persiste l'instance du modèle, lance TracedError en cas d'échec |
| flushAll (static) | -- | Promise | Supprime tous les documents Channel |
| injectTest (static) | -- | Promise\<void\> | Injecte des channels de test par équipe existante (General + channels spécifiques à l'équipe) |

## Détails

- ChannelType exporté pour usage externe
- injectTest crée un channel "General" par équipe, plus des channels supplémentaires selon le nom de l'équipe (ex. "Reunions", "Frontend", "Plannings")
- Les channels privés (isPublic: false) ne reçoivent que des membres spécifiques (ex. admins) ; les channels publics héritent de tous les membres de l'équipe
- Chaque ajout de membre crée aussi un document ChannelMember correspondant avec le rôle hérité de TeamMember

## Flux

Voir [channel-flows.md](../../flows/channel-flows.md)
