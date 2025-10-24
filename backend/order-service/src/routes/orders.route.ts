import { Router } from "express";
import { createOrderController, getOrdersController, updateOrderStatusController } from "../controllers/orders.controller";

const router = Router();

router.post("/", createOrderController);
router.get("/", getOrdersController);
router.patch("/:orderId/status", updateOrderStatusController);

export default router;
