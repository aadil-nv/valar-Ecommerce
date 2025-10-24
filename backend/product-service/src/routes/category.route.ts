import { Router } from "express";
import { createCategoryController, getCategoriesController } from "../controllers/category.controller";

const router = Router();

router.post("/", createCategoryController);
router.get("/", getCategoriesController);

export default router;
