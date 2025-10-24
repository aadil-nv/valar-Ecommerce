import { Router, Request, Response, NextFunction } from "express";
import { httpClient } from "../services/httpClient";
import { config } from "../config/env.config";

const router = Router();

// Get all alerts
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${config.ALERTS_SERVICE_URL}/api/alerts`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create a new alert
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("POST", `${config.ALERTS_SERVICE_URL}/api/alerts`, req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Resolve an alert
router.patch("/:id/resolve", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient(
      "PATCH",
      `${config.ALERTS_SERVICE_URL}/api/alerts/${req.params.id}/resolve`,
      req.body
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
