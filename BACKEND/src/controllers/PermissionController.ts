import type { Request, Response } from "express";
import mongoose from "mongoose";
import Permission from "../models/Permission.ts";

type PermissionBody = {
  name?: unknown;
  description?: unknown;
};

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPermissionUuid(name: string) {
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const slug = normalizedName
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `custom_permission_${slug || "item"}`;
}

async function ensureUniqueUuid(baseUuid: string) {
  let nextUuid = baseUuid;
  let suffix = 2;

  while (await Permission.model.exists({ uuid: nextUuid })) {
    nextUuid = `${baseUuid}_${suffix}`;
    suffix += 1;
  }

  return nextUuid;
}

function mapPermission(permission: {
  _id: { toString(): string };
  uuid?: string;
  label?: string;
  desc?: string;
  default?: boolean;
}) {
  return {
    id: permission._id.toString(),
    uuid: permission.uuid ?? "",
    name: permission.label ?? "",
    description: permission.desc ?? "",
    default: permission.default ?? false,
  };
}

async function findPermissionByName(name: string, excludedId?: string) {
  const match = await Permission.model.findOne({
    label: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  }).lean();

  if (!match) return null;
  if (!excludedId) return match;

  return match._id.toString() === excludedId ? null : match;
}

function validatePayload(body: PermissionBody) {
  const name = sanitizeText(body.name);
  const description = sanitizeText(body.description);

  if (!name) {
    return { error: "The permission name is required." };
  }

  if (!description) {
    return { error: "The permission description is required." };
  }

  return { name, description };
}

export default class PermissionController {
  static async list(_req: Request, res: Response) {
    try {
      const permissions = await Permission.model
        .find({}, { _id: 1, uuid: 1, label: 1, desc: 1, default: 1 })
        .sort({ label: 1 })
        .lean();

      res.json(permissions.map(permission => mapPermission(permission)));
    } catch (error) {
      res.status(500).json({ message: "Unable to load permissions." });
    }
  }

  static async create(req: Request<unknown, unknown, PermissionBody>, res: Response) {
    try {
      const payload = validatePayload(req.body);
      if ("error" in payload) {
        return res.status(400).json({ message: payload.error });
      }

      const duplicatePermission = await findPermissionByName(payload.name);
      if (duplicatePermission) {
        return res.status(409).json({ message: "A permission with this name already exists." });
      }

      const uuid = await ensureUniqueUuid(buildPermissionUuid(payload.name));
      const permission = new Permission({
        uuid,
        label: payload.name,
        desc: payload.description,
        default: false,
      });

      await permission.save();

      return res.status(201).json(mapPermission(permission.modelInstance));
    } catch (error) {
      return res.status(500).json({ message: "Unable to create the permission." });
    }
  }

  static async update(
    req: Request<{ id: string }, unknown, PermissionBody>,
    res: Response,
  ) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid permission identifier." });
      }

      const payload = validatePayload(req.body);
      if ("error" in payload) {
        return res.status(400).json({ message: payload.error });
      }

      const duplicatePermission = await findPermissionByName(payload.name, id);
      if (duplicatePermission) {
        return res.status(409).json({ message: "A permission with this name already exists." });
      }

      const updatedPermission = await Permission.model
        .findByIdAndUpdate(
          id,
          {
            $set: {
              label: payload.name,
              desc: payload.description,
            },
          },
          {
            new: true,
            runValidators: true,
          },
        )
        .lean();

      if (!updatedPermission) {
        return res.status(404).json({ message: "Permission not found." });
      }

      return res.json(mapPermission(updatedPermission));
    } catch (error) {
      return res.status(500).json({ message: "Unable to update the permission." });
    }
  }

  static async delete(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid permission identifier." });
      }

      const deletedPermission = await Permission.model.findByIdAndDelete(id).lean();

      if (!deletedPermission) {
        return res.status(404).json({ message: "Permission not found." });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Unable to delete the permission." });
    }
  }
}
