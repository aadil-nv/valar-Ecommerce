import amqp, { Channel, ConsumeMessage } from "amqplib";
import { config } from "../config/env.config";

const CUSTOMER_QUEUE = config.CUSTOMER_QUEUE_NAME as string
let analyticsChannel: Channel;

export const connectQueue = async () => {
  const connection = await amqp.connect(config.RABBITMQ_URI as string);
  analyticsChannel = await connection.createChannel();
  await analyticsChannel.assertQueue(CUSTOMER_QUEUE, { durable: true });

  console.log(`Analytics Service RabbitMQ connected to analytics queue`.bgRed.white);

  await consumeAnalyticsEvents();
};

const consumeAnalyticsEvents = async () => {
  if (!analyticsChannel) throw new Error("RabbitMQ analytics channel not initialized");

  await analyticsChannel.consume(CUSTOMER_QUEUE, async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    console.log("📊 Received analytics event:", event);

    analyticsChannel.ack(msg);
  });
};
