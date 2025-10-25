import { Request, Response, NextFunction } from "express";
import * as AlertsService from "../services/alerts.service";
import { broadcastAlertUpdate } from "../websocket/ws.server";

export const getAlertsController = async (req: Request, res: Response, next: NextFunction) => {
  console.log("calling all alerts is ==>");
  try {
    const alerts = await AlertsService.getAlerts();
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
};

export const createAlertController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, message } = req.body;

    if (!type || !message) {
      return res.status(400).json({ error: { error: "type and message are required" } });
    }

    const alert = await AlertsService.createAlert({ type, message });
    broadcastAlertUpdate({ event: "new_alert", data: alert }); // Broadcast new alert
    res.status(201).json(alert);
  } catch (err) {
    next(err);
  }
};

export const resolveAlertController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alert = await AlertsService.resolveAlert(id);
    if (!alert) {
      return res.status(404).json({ error: { error: "Alert not found" } });
    }
    broadcastAlertUpdate({ event: "update_alert", data: alert }); // Broadcast resolved alert
    res.json(alert);
  } catch (err) {
    next(err);
  }
};

export const deleteAlertController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alert = await AlertsService.deleteAlert(id);
    if (!alert) {
      return res.status(404).json({ error: { error: "Alert not found" } });
    }
    broadcastAlertUpdate({ event: "delete_alert", data: id }); // Broadcast deleted alert ID
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const deleteAllAlertsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AlertsService.deleteAllAlerts();
    broadcastAlertUpdate({ event: "clear_alerts" }); // Broadcast clear all alerts
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};