import amqp, { Channel, ConsumeMessage } from "amqplib";
import { config } from "../config/env.config";

// Define a generic type for your order event data
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

let channel: Channel;
const QUEUE_NAME = config.ORDER_QUEUE_NAME as string;

export const connectQueue = async (): Promise<void> => {
  const connection = await amqp.connect(config.RABBITMQ_URI as string);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  console.log("RabbitMQ connected and queue ready");
};

export const publishOrderEvent = async (event: string, data: OrderEventData): Promise<void> => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  const message: OrderEventMessage = { event, data };
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), { persistent: true });
};

export const consumeOrderEvents = async (
  callback: (msg: OrderEventMessage) => void
): Promise<void> => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");

  await channel.consume(QUEUE_NAME, (msg: ConsumeMessage | null) => {
    if (msg) {
      const parsedMessage: OrderEventMessage = JSON.parse(msg.content.toString());
      callback(parsedMessage);
      channel.ack(msg);
    }
  });
};
