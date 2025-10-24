import { Router } from "express";
import { createAlertController, getAlertsController, resolveAlertController } from "../controllers/alerts.controller";

const router = Router();

router.get("/", getAlertsController);
router.patch("/:id/resolve", resolveAlertController);
router.post("/", createAlertController);

export default router;
