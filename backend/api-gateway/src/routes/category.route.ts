import { Router, Request, Response, NextFunction } from "express";
import { httpClient } from "../services/httpClient";
import { config } from "../config/env.config";

const router = Router();

// Get all categories
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${config.PRODUCT_SERVICE_URL}/api/categories`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create a new category
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("POST", `${config.PRODUCT_SERVICE_URL}/api/categories`, req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Update a category
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("PATCH", `${config.PRODUCT_SERVICE_URL}/categories/${req.params.id}`, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Delete a category
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("DELETE", `${config.PRODUCT_SERVICE_URL}/categories/${req.params.id}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
