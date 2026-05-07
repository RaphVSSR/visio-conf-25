import mongoose, { model, Model, Schema, Types } from "mongoose";

const { models } = mongoose;

export type SpaceType = {
	_id?: Types.ObjectId;
	name: string;
	owner: Types.ObjectId;
	members?: Types.ObjectId[];
	parent?: Types.ObjectId | null;
	category: "personal" | "global" | "team";
	isPersonal?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
};

export default class Space {
	protected static schema = new Schema<SpaceType>(
		{
			name: { type: String, required: true },
			owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
			members: [{ type: Schema.Types.ObjectId, ref: "User" }],
			parent: { type: Schema.Types.ObjectId, ref: "Space", default: null },
			category: { type: String, enum: ["personal", "global", "team"], default: "personal" },
			isPersonal: { type: Boolean, default: false },
		},
		{
			timestamps: true,
		},
	);

	static model: Model<SpaceType> = models.Space || model<SpaceType>("Space", this.schema);

	modelInstance;

	constructor(dataToConstruct: SpaceType) {
		this.modelInstance = new Space.model(dataToConstruct);
	}

	async save() {
		return this.modelInstance.save();
	}
}
