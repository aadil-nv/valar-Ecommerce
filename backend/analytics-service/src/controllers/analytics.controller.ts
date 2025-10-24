import { Request, Response, NextFunction } from "express";
import * as AnalyticsService from "../services/analytics.service";

export const getAnalyticsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await AnalyticsService.getRecentAnalytics();
    res.json(analytics);
  } catch (err) {
    next(err);
  }
};

