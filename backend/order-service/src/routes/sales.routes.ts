import { Router } from "express";
import {
  getSalesOverviewController,
  getMonthlySalesController,
  getYearlySalesController,
  getTopProductsController,
  getLowProductsController,
} from "../controllers/sales.controller";

const router = Router();

router.get("/overview", getSalesOverviewController); // 24h, 7d, 30d
router.get("/monthly", getMonthlySalesController);
router.get("/yearly", getYearlySalesController);
router.get("/top-products", getTopProductsController);
router.get("/low-products", getLowProductsController);

export default router;
