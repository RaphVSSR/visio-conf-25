import mongoose, { Model, Schema, Types } from "mongoose";
import TracedError from "./core/TracedError.ts";
import { model } from "mongoose";
import Collection from "./core/Collection.ts";
import { DEPRECATED_PERMISSION_UUIDS, SYSTEM_PERMISSIONS } from "./permissions/PermissionRegistry.ts";

const { models } = mongoose;

export type PermType = {

    _id?: Types.ObjectId,
    uuid: string,
    label: string,
    labelKey?: string,
    desc?: string,
    default: boolean,

}

export default class Permission extends Collection {

    protected static schema = new Schema<PermType>({

        uuid: {
            type: String,
            required: true,
            unique: true,
            description: "Message identifier",
        },
        label: {
            type: String,
            required: true,
            description: "Name of the permission",
        },
        labelKey: {
            type: String,
            unique: true,
            sparse: true,
            description: "Normalized label used to guarantee uniqueness for custom permissions",
        },
        desc: {
            type: String,
            description: "Permission's description",
        },
        default: {
            type: Boolean,
            required: true,
            description: "Does this permission needs to be by default affected ?",
        },
    });

    static model: Model<PermType> = models.Permission || model<PermType>("Permission", this.schema);

    modelInstance;

    constructor(dataToConstruct: PermType){

        super();
        this.modelInstance = new Permission.model(dataToConstruct);

    }

    static async inject(){

        await this.removeUuidDuplicates();
        await this.model.deleteMany({ uuid: { $in: DEPRECATED_PERMISSION_UUIDS }, labelKey: { $exists: false } });
        await this.model.createIndexes();

        for (const perm of SYSTEM_PERMISSIONS) {
            await this.model.updateOne(
                { uuid: perm.uuid },
                { $setOnInsert: perm },
                { upsert: true },
            );
        }
    }

    static async removeUuidDuplicates() {

        const duplicates = await this.model.aggregate<{ _id: string, ids: Types.ObjectId[] }>([
            {
                $group: {
                    _id: "$uuid",
                    ids: { $push: "$_id" },
                    count: { $sum: 1 },
                },
            },
            {
                $match: {
                    _id: { $ne: null },
                    count: { $gt: 1 },
                },
            },
        ]);

        for (const duplicate of duplicates) {
            const [, ...idsToDelete] = duplicate.ids;
            if (idsToDelete.length > 0) await this.model.deleteMany({ _id: { $in: idsToDelete } });
        }
    }

    async save(){

        try {

            await this.modelInstance.save();

        } catch (error: any) {

            throw new TracedError("collectionSaving", error.message);
        }
    }

    static async getPerm(label: string) {

        return this.model.findOne({label: label});
    }

    static async getPerms(labels: string[]) {

        return this.model.find({ label: {$in: labels}});
    }

    static async updatePerm(label: string, newData: Partial<PermType>) {

        return this.model.updateOne({email: label}, { $set: newData });
    }

    static async updatePerms(labels: string[], newData: Partial<PermType>) {

        return this.model.updateMany({ email: {$in: labels}}, { $set: newData });
    }

    static async deletePerm(label: string) {

        return this.model.deleteOne({label: label});
    }

    static async deletePerms(labels: string[]) {

        return this.model.deleteMany({ label: {$in: labels}});
    }

    static async flushAll() {

        return this.model.deleteMany({});
    }

}
