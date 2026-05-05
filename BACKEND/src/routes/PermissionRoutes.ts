import express from "express";
import PermissionController from "../controllers/PermissionController.ts";
import { requireAdmin, requirePermissionCsrfGuard, sendPermissionCsrfToken } from "../middleware/requireAdmin.ts";

const router = express.Router();

router.use(requireAdmin);
router.get("/csrf-token", sendPermissionCsrfToken);
router.use(requirePermissionCsrfGuard);
router.get("/", PermissionController.list);
router.post("/", PermissionController.create);
router.put("/:id", PermissionController.update);
router.delete("/:id", PermissionController.remove);

export default router;
