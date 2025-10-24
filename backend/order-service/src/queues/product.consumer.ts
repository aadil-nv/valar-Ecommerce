import { consumeProductEvents } from "./product.queue";
import * as OrderService from "../services/order.service";

export interface ProductEventData {
  productId: string;
  name?: string;
  price?: number;
  inventory?: number;
  eventType: string;
  categoryName?: string;
  orderId?: string; 
}

export interface ProductEventMessage {
  event: string;
  data: ProductEventData;
}

export const handleProductEvents = async (msg: ProductEventMessage) => {
  const { event, data } = msg;

  if (event === "inventory_update_failed" && data.orderId) {
    console.log("❌ Rolling back order:", data.orderId);
    await OrderService.markOrderAsFailed(data.orderId);
  }
};

export const startProductConsumer = async () => {
  await consumeProductEvents(handleProductEvents);
};
