import type { Request, Response } from "express"
import mongoose from "mongoose"
import Permission, { type PermType } from "../models/Permission.ts"
import TracedError from "../models/core/TracedError.ts"

type PermissionBody = {
	name?: unknown
	description?: unknown
}

const MAX_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 300

function sanitizeText(value: unknown) {
	return typeof value === "string" ? value.trim() : ""
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function normalizePermissionKey(name: string) {
	return name
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
}

function isDuplicateKeyError(error: unknown) {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: number }).code === 11000
	)
}

function logControllerError(error: unknown) {
	TracedError.errorHandler(error)
}

function buildDuplicateNameQuery(name: string, labelKey: string) {
	return {
		$or: [
			{ labelKey },
			{ label: { $regex: `^${escapeRegExp(name)}$`, $options: "i" } },
		],
	}
}

function mapPermission(permission: Pick<PermType, "uuid" | "label" | "desc" | "default"> & { _id: { toString(): string } }) {
	return {
		id: permission._id.toString(),
		uuid: permission.uuid,
		name: permission.label,
		description: permission.desc ?? "",
		default: permission.default,
	}
}

function validatePayload(body: PermissionBody) {
	const name = sanitizeText(body.name)
	const description = sanitizeText(body.description)

	if (!name) return { error: "Le nom de la permission est obligatoire." }
	if (!description) return { error: "La description de la permission est obligatoire." }
	if (name.length > MAX_NAME_LENGTH) return { error: "Le nom de la permission est trop long." }
	if (description.length > MAX_DESCRIPTION_LENGTH) return { error: "La description de la permission est trop longue." }

	const labelKey = normalizePermissionKey(name)
	if (!labelKey) return { error: "Le nom de la permission doit contenir au moins une lettre ou un chiffre." }

	return { name, description, labelKey }
}

export default class PermissionController {

	static async list(_request: Request, response: Response) {
		try {
			const permissions = await Permission.model
				.find({}, { _id: 1, uuid: 1, label: 1, desc: 1, default: 1 })
				.sort({ label: 1 })
				.lean()

			response.json(permissions.map(permission => mapPermission(permission)))
		} catch (error) {
			logControllerError(error)
			response.status(500).json({ message: "Impossible de charger les permissions." })
		}
	}

	static async create(request: Request<unknown, unknown, PermissionBody>, response: Response) {
		try {
			const payload = validatePayload(request.body)
			if ("error" in payload) return response.status(400).json({ message: payload.error })

			const duplicatePermission = await Permission.model.exists(buildDuplicateNameQuery(payload.name, payload.labelKey))
			if (duplicatePermission) return response.status(409).json({ message: "Une permission avec ce nom existe déjà." })

			const permission = new Permission({
				uuid: `custom_permission_${payload.labelKey}`,
				label: payload.name,
				labelKey: payload.labelKey,
				desc: payload.description,
				default: false,
			})

			await permission.save()

			return response.status(201).json(mapPermission(permission.modelInstance))
		} catch (error) {
			if (isDuplicateKeyError(error)) return response.status(409).json({ message: "Cette permission existe déjà." })

			logControllerError(error)
			return response.status(500).json({ message: "Impossible de créer la permission." })
		}
	}

	static async update(
		request: Request<{ id: string }, unknown, PermissionBody>,
		response: Response,
	) {
		try {
			const { id } = request.params

			if (!mongoose.Types.ObjectId.isValid(id)) {
				return response.status(400).json({ message: "Identifiant de permission invalide." })
			}

			const payload = validatePayload(request.body)
			if ("error" in payload) return response.status(400).json({ message: payload.error })

			const duplicatePermission = await Permission.model.exists({
				_id: { $ne: id },
				...buildDuplicateNameQuery(payload.name, payload.labelKey),
			})
			if (duplicatePermission) return response.status(409).json({ message: "Une permission avec ce nom existe déjà." })

			const updatedPermission = await Permission.model
				.findByIdAndUpdate(
					id,
					{
						$set: {
							label: payload.name,
							labelKey: payload.labelKey,
							desc: payload.description,
						},
					},
					{
						new: true,
						runValidators: true,
					},
				)
				.lean()

			if (!updatedPermission) return response.status(404).json({ message: "Permission introuvable." })

			return response.json(mapPermission(updatedPermission))
		} catch (error) {
			if (isDuplicateKeyError(error)) return response.status(409).json({ message: "Cette permission existe déjà." })

			logControllerError(error)
			return response.status(500).json({ message: "Impossible de modifier la permission." })
		}
	}

	static async remove(request: Request<{ id: string }>, response: Response) {
		try {
			const { id } = request.params

			if (!mongoose.Types.ObjectId.isValid(id)) {
				return response.status(400).json({ message: "Identifiant de permission invalide." })
			}

			const deletedPermission = await Permission.model.findByIdAndDelete(id).lean()

			if (!deletedPermission) return response.status(404).json({ message: "Permission introuvable." })

			return response.status(204).send()
		} catch (error) {
			logControllerError(error)
			return response.status(500).json({ message: "Impossible de supprimer la permission." })
		}
	}
}
