import { Router, Request, Response, NextFunction } from "express";
import { httpClient } from "../services/httpClient";
import { config } from "../config/env.config";

const router = Router();

// GET all orders
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${config.ORDER_SERVICE_URL}/api/orders`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST create order
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("POST", `${config.ORDER_SERVICE_URL}/api/orders`, req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
