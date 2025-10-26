import { Router } from "express";
import {
  createCustomerController,
  getAllCustomersController,
  getCustomerByIdController,
  updateCustomerController,
  softDeleteCustomerController,
  patchIsBlockedController,
  queryCustomersController,
  patchCustomerController,
} from "../controllers/customer.controller";

const router = Router();

// Get all customers (excluding soft-deleted)
router.get("/", getAllCustomersController);

router.get("/query",queryCustomersController);
// Get customer by ID
router.get("/:id", getCustomerByIdController);

// Create new customer
router.post("/",createCustomerController);

// Update customer by ID
router.put("/:id", updateCustomerController);

// Soft delete customer by ID
router.delete("/:id", softDeleteCustomerController);

// Patch isBlocked status by ID
router.patch("/:id/block",patchIsBlockedController);

router.patch("/:id", patchCustomerController);

// Query customers with pagination, search, and sorting

export default router;