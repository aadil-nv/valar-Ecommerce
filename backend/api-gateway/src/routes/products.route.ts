import { Router, Request, Response, NextFunction } from "express";
import { httpClient } from "../services/httpClient";
import { config } from "../config/env.config";

const router = Router();

// Get all products
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${config.PRODUCT_SERVICE_URL}/api/products`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
router.get("/paginated", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = "1", limit = "10" } = req.query;

    // Validate query parameters
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ error: "Page and limit must be positive integers" });
    }

    // Construct the downstream URL with query parameters
    const url = `${config.PRODUCT_SERVICE_URL}/api/products/paginated?page=${pageNum}&limit=${limitNum}`;
    
    console.log("Forwarding request to:", url);
    
    const data = await httpClient("GET", url);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get single product by ID
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("GET", `${config.PRODUCT_SERVICE_URL}/api/products/${req.params.id}`);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create a new product
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("POST", `${config.PRODUCT_SERVICE_URL}/api/products`, req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// Update a product
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient("PATCH", `${config.PRODUCT_SERVICE_URL}/api/products/${req.params.id}`, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});
router.patch("/bulk-delete", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await httpClient(
      "PATCH",
      `${config.PRODUCT_SERVICE_URL}/api/products/bulk-delete`,
      req.body
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/bulk/:ids", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = req.params.ids; // <-- use params, not query
    console.log("ids is ",ids);
    
    const data = await httpClient(
      "GET",
      `${config.PRODUCT_SERVICE_URL}/api/products/bulk/${ids}` // match product service route
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});


export default router;
