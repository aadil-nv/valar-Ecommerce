import { consumeOrderEvents } from "../queues/order.queue";
// import * as ProductService from "../services/product.service";
import { publishProductEvent } from "./product.queue";

export interface OrderEventData {
  _id: string;
  orderId: string;
  customerId: string;
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  status: string;
  createdAt: string;
}

export interface OrderEventMessage {
  event: string;
  data: OrderEventData;
}

export const handleOrderCreated = async (msg: OrderEventMessage) => {
//   console.log("msg is ===>", msg);

  const { event } = msg;

  // Only process if the event is 'order_created'
  if (event !== "order_created") {
    console.log(`Skipping event: ${event}. Only 'order_created' events are processed.`);
    return;
  }

  try {
    // for (const item of data.items) {
    //   await ProductService.decreaseStock(item.productId, item.quantity);
    // }

    await publishProductEvent("inventory_updated_success", {
      productId: "",
      eventType: "inventory_updated_success",
      categoryName: "",
    });
  } catch (error) {
    console.error("❌ Product stock update failed:", error);

    await publishProductEvent("inventory_update_failed", {
      productId: "",
      eventType: "inventory_update_failed",
      categoryName: "",
    });
  }
};

export const startOrderConsumer = async () => {
  await consumeOrderEvents(handleOrderCreated);
};