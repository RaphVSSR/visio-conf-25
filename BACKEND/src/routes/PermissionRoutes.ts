import express from "express";
import PermissionController from "../controllers/PermissionController.ts";

const router = express.Router();

router.get("/", PermissionController.list);
router.post("/", PermissionController.create);
router.put("/:id", PermissionController.update);
router.delete("/:id", PermissionController.delete);

export default router;
