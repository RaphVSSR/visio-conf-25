import { type Model, type Schema } from "mongoose";

export default abstract class Collection {

    protected static schema: Schema;
    static model: Model<any>;

    abstract modelInstance: any;

    abstract save(): Promise<void>;

    static async flushAll() {

        return this.model.deleteMany({});
    }
}
