import mongoose, { model, Model, Schema, Types } from "mongoose";

const { models } = mongoose;

export type FileType = {
	_id?: Types.ObjectId;
	name: string;
	size: number;
	type: string;
	url: string;
	owner: Types.ObjectId;
	team?: Types.ObjectId;
	space?: Types.ObjectId;
	category: "personal" | "global" | "team";
	createdAt?: Date;
	updatedAt?: Date;
};

export default class File {
	protected static schema = new Schema<FileType>(
		{
			name: { type: String, required: true },
			size: { type: Number, required: true },
			type: { type: String, required: true },
			url: { type: String, required: true },
			owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
			team: { type: Schema.Types.ObjectId, ref: "Team" },
			space: { type: Schema.Types.ObjectId, ref: "Space" },
			category: { type: String, enum: ["personal", "global", "team"], default: "personal" },
		},
		{
			timestamps: true,
		},
	);

	static model: Model<FileType> = models.File || model<FileType>("File", this.schema);

	modelInstance;

	constructor(dataToConstruct: FileType) {
		this.modelInstance = new File.model(dataToConstruct);
	}

	async save() {
		return this.modelInstance.save();
	}
}
