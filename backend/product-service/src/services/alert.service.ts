import axios from "axios";
import { IProduct } from "../models/product.model";
import { config } from "../config/env.config";

// Function to send an inventory alert
export const sendInventoryAlert = async (product: IProduct) => {
  try {
    await axios.post(`${config.ALERTS_SERVICE_URL}/api/alerts`, {
      type: "high", 
      message: `⚠️ Inventory for product "${product.name}" is low: ${product.inventoryCount} left.`,
    });
    console.log(`Alert sent for product ${product.name}`);
  } catch (err) {
    console.error("Failed to send alert:", err);
  }
};
