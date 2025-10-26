import { Router, Request, Response, NextFunction } from "express";
import { httpClient } from "../services/httpClient";
import { config } from "../config/env.config";
import { validateCustomer, validatePatchIsBlocked, validateQuery } from "../middlewares/customer.validator";

const router = Router();

// Get all customers
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${config.CUSTOMER_SERVICE_URL}/api/customer`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/query", validateQuery, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryString = new URLSearchParams(req.query as any).toString();
    const data = await httpClient("GET", `${config.CUSTOMER_SERVICE_URL}/api/customer/query?${queryString}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get customer by ID
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${config.CUSTOMER_SERVICE_URL}/api/customer/${req.params.id}`);
    if (!data) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create new customer
router.post("/", validateCustomer, async (req: Request, res: Response, next: NextFunction) => {
  console.log("Creating new customer");
  console.log("CUSTOMER_SERVICE_URL:", config.CUSTOMER_SERVICE_URL);
  
  try {
    const data = await httpClient("POST", `${config.CUSTOMER_SERVICE_URL}/api/customer`, req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Update customer by ID
router.put("/:id", validateCustomer, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("PUT", `${config.CUSTOMER_SERVICE_URL}/api/customer/${req.params.id}`, req.body);
    if (!data) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Soft delete customer by ID
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("DELETE", `${config.CUSTOMER_SERVICE_URL}/api/customer/${req.params.id}`);
    if (!data) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json({ message: "Customer soft deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// Patch isBlocked status by ID
router.patch("/:id/block", validatePatchIsBlocked, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("PATCH", `${config.CUSTOMER_SERVICE_URL}/api/customer/${req.params.id}/block`, req.body);
    if (!data) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("PATCH", `${config.CUSTOMER_SERVICE_URL}/api/customer/${req.params.id}`, req.body);
    if (!data) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Query customers with pagination, search, and sorting


export default router;