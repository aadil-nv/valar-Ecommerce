// src/services/alert.service.ts
import axios from "axios";
import { config } from "../config/env.config";

export const sendOrderFailedAlert = async (orderId: string, customerId?: string) => {
  try {
    await axios.post(`${config.ALERTS_SERVICE_URL}/api/alerts`, {
      type: "critical",
      message: `❌ Order ${orderId} has failed${customerId ? ` for customer ${customerId}` : ""}.`,
      severity: "high",
      orderId,
      status: "active",
      createdAt: new Date().toISOString(),
    });
    console.log(`Order failed alert sent for order ${orderId}`);
  } catch (err) {
    console.error("Failed to send order failed alert:", err);
  }
};
