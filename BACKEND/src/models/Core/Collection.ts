import mongoose, { type HydratedDocument, model, Schema, type Model } from "mongoose";
import TracedError from "./TracedError.ts";


/**
 * Test
 */
export default abstract class Collection {

	protected static schema: Schema;
	protected static model: Model<any>;
	protected static async flushAll(): Promise<mongoose.mongo.DeleteResult> {
        throw new Error("flushAll must be implemented in subclass");
    }
}