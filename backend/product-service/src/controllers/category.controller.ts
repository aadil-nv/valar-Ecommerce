import { Request, Response, NextFunction } from "express";
import * as CategoryService from "../services/category.service";

export const createCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {    
    const category = await CategoryService.createCategory(req.body);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

export const getCategoriesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await CategoryService.getCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
};
