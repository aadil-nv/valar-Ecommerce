import amqp, { ConsumeMessage } from "amqplib";
import { config } from "../config/env.config";

let channel: amqp.Channel;
const QUEUE_NAME = config.PRODUCT_QUEUE_NAME as string;

export interface ProductEventData {

  productId: string;
  name?: string;
  price?: number;
  inventory?: number;
  eventType: string;
  categoryName?: string; 
}


export const connectQueue = async () => {
  const connection = await amqp.connect(config.RABBITMQ_URI as string);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  console.log( `Product Service RabbitMQ connected`.bgRed.white);
};

export const publishProductEvent = async (event: string, data: ProductEventData) => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify({ event, data })), { persistent: true });
};

export const consumeProductEvents = async (callback: (msg: ConsumeMessage) => void) => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  await channel.consume(QUEUE_NAME, (msg: ConsumeMessage | null) => {
    if (msg) {
      callback(JSON.parse(msg.content.toString()));
      channel.ack(msg);
    }
  });
};
