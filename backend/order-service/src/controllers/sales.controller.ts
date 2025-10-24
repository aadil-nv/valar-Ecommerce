import { Request, Response, NextFunction } from "express";
import {
  getSalesOverviewService,
  getMonthlySalesService,
  getYearlySalesService,
  getTopProductsService,
  getLowProductsService,
} from "../services/sales.service";

export const getSalesOverviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getSalesOverviewService();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getMonthlySalesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getMonthlySalesService();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getYearlySalesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getYearlySalesService();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getTopProductsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getTopProductsService();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getLowProductsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getLowProductsService();
    res.json(data);
  } catch (err) {
    next(err);
  }
};
