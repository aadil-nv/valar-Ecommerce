import { Request, Response, NextFunction } from "express";
import * as AlertsService from "../services/alerts.service";

export const getAlertsController = async (req: Request, res: Response, next: NextFunction) => {
    console.log("calling all alerts is ==>");
    
  try {
    const alerts = await AlertsService.getAlerts();
    res.json(alerts);
  } catch (err) {
    next(err);
  }
};

export const resolveAlertController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alert = await AlertsService.resolveAlert(id);
    res.json(alert);
  } catch (err) {
    next(err);
  }
};


export const createAlertController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, message } = req.body;

    if (!type || !message) {
      return res.status(400).json({ error: "type, recipient, and message are required" });
    }

    const alert = await AlertsService.createAlert({ type, message });
    res.status(201).json(alert);
  } catch (err) {
    next(err);
  }
};