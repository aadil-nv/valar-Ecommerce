import { Router } from "express";
import { createOrderController, getOrdersController, getOrdersWithQueryController, updateOrderStatusController } from "../controllers/orders.controller";

const router = Router();

router.post("/", createOrderController);
router.get("/", getOrdersController);
router.get("/query", getOrdersWithQueryController);

router.patch("/:orderId/status", updateOrderStatusController);

export default router;
