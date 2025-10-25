import amqp, { Channel, ConsumeMessage } from "amqplib";
import { config } from "../config/env.config";

// Define interfaces for different event data
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

export interface SalesOverviewData {
  last24Hours: { totalSales: number; count: number };
  last7Days: { totalSales: number; count: number };
  last30Days: { totalSales: number; count: number };
}

export interface MonthlySalesData {
  _id: { year: number; month: number };
  totalSales: number;
  orderCount: number;
}

export interface TopProductData {
  _id: string;
  totalSold: number;
  totalRevenue: number;
  product: { name: string };
}

export interface LowProductsData {
  lowSelling: { _id: string; totalSold: number }[];
  unsoldProducts: { _id: string; name: string }[];
}

export interface OverallMetricsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  listedProducts: number;
  unlistedProducts: number;
}

export type EventData =
  | OrderEventData
  | SalesOverviewData
  | MonthlySalesData[]
  | TopProductData[]
  | LowProductsData
  | OverallMetricsData;

export interface EventMessage {
  event: string;
  data: EventData;
}

let channel: Channel;
const QUEUE_NAME = config.ORDER_QUEUE_NAME as string;

export const connectQueue = async (): Promise<void> => {
  try {
    const connection = await amqp.connect(config.RABBITMQ_URI as string);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    // Set prefetch to 1 to ensure the consumer processes one message at a time
    await channel.prefetch(1);
    console.log(`RabbitMQ connected and queue ${QUEUE_NAME} ready`);
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
    throw error;
  }
};

export const publishEvent = async (event: string, data: EventData): Promise<void> => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  const message: EventMessage = { event, data };
  console.log(`Publishing event: ${event} with data:`, JSON.stringify(data, null, 2));
  
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)), { persistent: true });
};

export const consumeEvents = async (
  callback: (msg: EventMessage, originalMsg: ConsumeMessage) => void
): Promise<void> => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");

  console.log(`Starting consumer for queue: ${QUEUE_NAME}`);
  await channel.consume(QUEUE_NAME, (msg: ConsumeMessage | null) => {
    if (msg) {
      try {
        const parsedMessage: EventMessage = JSON.parse(msg.content.toString());
        console.log(`Received event: ${parsedMessage.event} with data:`, JSON.stringify(parsedMessage.data, null, 2));
        callback(parsedMessage, msg);
      } catch (error) {
        console.error("Error parsing message:", error);
        // Optionally, move to a dead-letter queue or handle error
        channel.nack(msg, false, false); // Do not requeue on parsing error
      }
    }
  }, { noAck: false }); // Manual acknowledgment
};