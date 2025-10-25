import { Router } from "express";
import { createAlertController, getAlertsController, resolveAlertController, deleteAlertController, deleteAllAlertsController } from "../controllers/alerts.controller";

const router = Router();

router.get("/", getAlertsController);
router.post("/", createAlertController);
router.patch("/:id/resolve", resolveAlertController);
router.delete("/:id", deleteAlertController); // New route for deleting a single alert
router.delete("/", deleteAllAlertsController); // New route for clearing all alerts

export default router;