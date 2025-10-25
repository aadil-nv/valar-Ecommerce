import { Router } from "express";
import {
  bulkSoftDeleteProductsController,
  createProductController,
  decreaseProductStockController,
  getPaginatedProductsController,
  getProductCountsController,
  getProductsByIdsController,
  getProductsController,
  updateInventoryController,
  updateProductController,
} from "../controllers/products.controller";

const router = Router();

router.post("/", createProductController); 
router.get("/", getProductsController);
router.get("/paginated", getPaginatedProductsController);
router.get("/counts", getProductCountsController); // Product counts (total, listed, unlisted)

router.patch("/bulk-delete", bulkSoftDeleteProductsController);

router.patch("/:productId/inventory", updateInventoryController);
router.patch("/:productId", updateProductController);
router.patch("/:productId/decrease-stock", decreaseProductStockController); // New route
router.get("/bulk", getProductsByIdsController);

export default router;
