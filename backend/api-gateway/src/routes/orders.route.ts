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

router.get("/query", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryParams = new URLSearchParams(req.query as Record<string, string>).toString();
    const data = await httpClient("GET", `${config.ORDER_SERVICE_URL}/api/orders/query?${queryParams}`);
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

router.patch("/:orderId/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const data = await httpClient(
      "PATCH",
      `${config.ORDER_SERVICE_URL}/api/orders/${orderId}/status`,
      { status }
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
