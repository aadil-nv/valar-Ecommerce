import { Router } from "express";
import { getAnalyticsController } from "../controllers/analytics.controller";

const router = Router();

router.get("/", getAnalyticsController);

export default router;
