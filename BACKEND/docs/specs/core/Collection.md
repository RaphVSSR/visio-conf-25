# Référence de la classe Collection — VisioConf

**Fichier source** : `BACKEND/src/models/Core/Collection.ts`
**Type** : Classe abstraite (base class)

---

## 1. Description

`Collection` est la classe abstraite de base pour tous les modèles MongoDB du projet. Chaque collection (Folder, File, Permission, Role, Team, TeamMember, Channel, ChannelMember, ChannelPost, ChannelPostResponse, Discussion) hérite de cette classe pour partager une interface commune.

---

## 2. Propriétés de la classe

Aucune propriété définie dans la classe abstraite elle-même. Les sous-classes implémentent leur propre `schema`, `model` et `modelInstance`.

---

## 3. Méthodes

| Méthode | Paramètres | Retour | Static/Instance | Description |
|---------|------------|--------|-----------------|-------------|
| `save` | — | `Promise<void>` | instance (abstract) | Sauvegarde l'instance du modèle en base de données. Doit être implémentée par chaque sous-classe |

---

## 4. Types TypeScript

```typescript
abstract class Collection {
    abstract save(): Promise<void>;
}
```

---

## 5. Classes héritières

| Classe | Fichier |
|--------|---------|
| `Permission` | `models/Permission.ts` |
| `Role` | `models/Role.ts` |
| `Team` | `models/Team.ts` |
| `TeamMember` | `models/TeamMember.ts` |
| `Channel` | `models/Channel.ts` |
| `ChannelMember` | `models/ChannelMember.ts` |
| `ChannelPost` | `models/ChannelPost.ts` |
| `ChannelPostResponse` | `models/ChannelPostResponse.ts` |
| `Discussion` | `models/Discussion.ts` |
| `Folder` | `models/services/FileSystem.ts` |
| `File` | `models/services/FileSystem.ts` |

Note : `User` et `Session` n'étendent **pas** `Collection`.

---

## 6. Pattern commun des sous-classes

Chaque sous-classe implémente systématiquement :

```typescript
class ModelName extends Collection {
    protected static schema = new Schema<ModelType>({ ... })
    static model: Model<ModelType> = models.ModelName || model<ModelType>("ModelName", this.schema)
    modelInstance;

    constructor(dataToConstruct: ModelType) {
        super();
        this.modelInstance = new ModelName.model(dataToConstruct);
    }

    async save() {
        try {
            await this.modelInstance.save();
        } catch (err: any) {
            throw new TracedError("collectionSaving", err.message);
        }
    }

    static async flushAll() {
        return this.model.deleteMany({});
    }
}
```

---

## 7. Exemples

### Implémenter une sous-classe

```typescript
import Collection from "./core/Collection.ts";

class MyModel extends Collection {
    protected static schema = new Schema<MyType>({ name: { type: String, required: true } });
    static model = models.MyModel || model<MyType>("MyModel", this.schema);
    modelInstance;

    constructor(data: MyType) {
        super();
        this.modelInstance = new MyModel.model(data);
    }

    async save() {
        try { await this.modelInstance.save(); }
        catch (err: any) { throw new TracedError("collectionSaving", err.message); }
    }

    static async flushAll() { return this.model.deleteMany({}); }
}
```
