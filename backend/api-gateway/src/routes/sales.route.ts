import { Router, Request, Response, NextFunction } from "express";
import { httpClient } from "../services/httpClient";
import { config } from "../config/env.config";

const router = Router();
const ORDER_SERVICE_URL = config.ORDER_SERVICE_URL;

// 📊 Sales Overview (last 24h, 7d, 30d)
router.get("/overview", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${ORDER_SERVICE_URL}/api/sales/overview`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// 📆 Monthly Sales
router.get("/monthly", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${ORDER_SERVICE_URL}/api/sales/monthly`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// 📅 Yearly Sales
router.get("/yearly", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${ORDER_SERVICE_URL}/api/sales/yearly`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// 🏆 Top Selling Products
router.get("/top-products", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${ORDER_SERVICE_URL}/api/sales/top-products`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// 📉 Low Performing Products
router.get("/low-products", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${ORDER_SERVICE_URL}/api/sales/low-products`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
