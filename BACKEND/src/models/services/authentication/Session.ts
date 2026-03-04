import mongoose, { type Model, model, Schema, Types } from "mongoose"

const { models } = mongoose

export type SessionType = {
	_id?: Types.ObjectId,
	userId: Types.ObjectId,
	socketId?: string,
	deviceInfo: string,
	createdAt: Date,
	expiresAt: Date,
}

export default class Session {

	private static schema = new Schema<SessionType>({
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		socketId: { type: String },
		deviceInfo: { type: String, required: true },
		createdAt: { type: Date, required: true, default: Date.now },
		expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
	})

	static {
		this.schema.index({ socketId: 1 })
		this.schema.index({ userId: 1 })
	}

	static model: Model<SessionType> = models.Session || model<SessionType>("Session", this.schema)

	static async getSession(sessionId: string): Promise<SessionType | null> {
		return this.model.findById(sessionId).lean()
	}

	static async getSessionBySocket(socketId: string): Promise<SessionType | null> {
		return this.model.findOne({ socketId }).lean()
	}

	static async getSessions(userId: string): Promise<SessionType[]> {
		return this.model.find({ userId, expiresAt: { $gt: new Date() } }).lean()
	}

	static async createSession(userId: string, socketId: string, deviceInfo: string, expiresAt: Date): Promise<SessionType> {
		const session = new this.model({ userId, socketId, deviceInfo, expiresAt })
		await session.save()
		return session.toObject()
	}

	static async deleteSession(sessionId: string): Promise<void> {
		await this.model.deleteOne({ _id: sessionId })
	}

	static async clearSocket(socketId: string): Promise<void> {
		await this.model.updateOne({ socketId }, { $unset: { socketId: "" } })
	}

	static async bindSocket(sessionId: string, socketId: string): Promise<void> {
		await this.model.updateOne({ _id: sessionId }, { $set: { socketId } })
	}

	static async refreshSession(sessionId: string, newExpiresAt: Date): Promise<SessionType | null> {
		return this.model.findOneAndUpdate(
			{ _id: sessionId },
			{ $set: { expiresAt: newExpiresAt } },
			{ new: true }
		).lean()
	}

	static async getUserSocketIds(userId: string): Promise<string[]> {
		const sessions = await this.model.find(
			{ userId, socketId: { $exists: true, $ne: null } },
			{ socketId: 1 }
		).lean()
		return sessions.map(s => s.socketId!).filter(Boolean)
	}

	static async flushAll(): Promise<void> {
		await this.model.deleteMany({})
	}

	static getSessionDurationMs(): number {
		return this.parseExpiryToMs(process.env.SESSION_DURATION || "24h")
	}

	private static parseExpiryToMs(expiry: string): number {
		const match = expiry.match(/^(\d+)(s|m|h|d)$/)
		if (!match) return 24 * 60 * 60 * 1000

		const value = parseInt(match[1]!)
		const unit = match[2]!

		switch (unit) {
			case "s": return value * 1000
			case "m": return value * 60 * 1000
			case "h": return value * 60 * 60 * 1000
			case "d": return value * 24 * 60 * 60 * 1000
			default: return 24 * 60 * 60 * 1000
		}
	}
}
