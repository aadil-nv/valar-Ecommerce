import amqp, { ConsumeMessage, Channel } from "amqplib";
import { saveAnalyticsEvent } from "../services/analytics.service";
import { broadcastAnalyticsUpdate } from "../websockets/ws.server";
import { config } from "../config/env.config";

export interface ProductEventData {
  productId: string;
  name?: string;
  price?: number;
  inventory?: number;
  eventType: string;
  categoryName?: string;
}

export interface ProductEventMessage {
  event: string;
  data: ProductEventData;
}
const PRODUCT_QUEUE = config.PRODUCT_QUEUE_NAME as string;


export const connectProductQueue = async () => {
  const connection = await amqp.connect(config.RABBITMQ_URI as string);
  const channel: Channel = await connection.createChannel();
  await channel.assertQueue(PRODUCT_QUEUE, { durable: true });

  console.log("📦 Analytics Service connected to Product Queue".bgMagenta.white);
  await consumeProductEvents(channel);
};

const consumeProductEvents = async (channel: Channel) => {
  await channel.consume(PRODUCT_QUEUE, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    const parsedMessage: ProductEventMessage = JSON.parse(msg.content.toString());
    console.log("📩 Received product event:", parsedMessage);

    if (parsedMessage.event === "product_created") {
      const product = parsedMessage.data;
      await saveAnalyticsEvent({
        productId: product.productId,
        type: "product_created",
        value: product.price || 0,
        timestamp: new Date(),
      });
      broadcastAnalyticsUpdate(parsedMessage);
      console.log(`📊 Analytics saved for product ${product.productId}`);
    }

    channel.ack(msg);
  });
};
