import amqp, { ConsumeMessage } from "amqplib";
import { config } from "../config/env.config";

let channel: amqp.Channel;
const QUEUE_NAME = config.PRODUCT_QUEUE_NAME as string


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

export const connectProductQueue = async () => {
  const connection = await amqp.connect(config.RABBITMQ_URI as string);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  console.log("✅ Product Queue connected in Order Service");
};

export const consumeProductEvents = async (
  callback: (msg: ProductEventMessage) => Promise<void> | void
) => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");

  await channel.consume(QUEUE_NAME, (msg: ConsumeMessage | null) => {
    if (msg) {
      const parsed: ProductEventMessage = JSON.parse(msg.content.toString());
      callback(parsed);
      channel.ack(msg);
    }
  });
};
