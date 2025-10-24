import amqp, { ConsumeMessage, Channel } from "amqplib";
import { saveAnalyticsEvent } from "../services/analytics.service";
import { broadcastAnalyticsUpdate } from "../websockets/ws.server";
import { config } from "../config/env.config";

export interface OrderEventData {
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
const ORDER_QUEUE = config.ORDER_QUEUE_NAME as string;

export const connectOrderQueue = async () => {
  const connection = await amqp.connect(config.RABBITMQ_URI as string);
  const channel: Channel = await connection.createChannel(); // separate channel per queue
  await channel.assertQueue(ORDER_QUEUE, { durable: true });

  console.log("📦 Analytics Service connected to Order Queue".bgMagenta.white);

  await consumeOrderEvents(channel);
};

// Consume order events
const consumeOrderEvents = async (channel: Channel) => {
  await channel.consume(ORDER_QUEUE, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    const parsedMessage: OrderEventMessage = JSON.parse(msg.content.toString());
    console.log("📩 Received order event:", parsedMessage);

    if (parsedMessage.event === "order_created") {
      const order = parsedMessage.data;

      // Save analytics event
      await saveAnalyticsEvent({
        orderId: order.orderId,
        type: "order_created",
        value: order.total,
        timestamp: new Date(order.createdAt),
      });

      // Broadcast to WebSocket clients
      broadcastAnalyticsUpdate(parsedMessage);

      console.log(`📊 Analytics saved for order ${order.orderId}`);
    }

    channel.ack(msg);
  });
};
