import amqp from "amqplib";
import { config } from "../config/env.config";
import { createAlert, deleteAlert } from "../services/alerts.service";
import { broadcastAlertUpdate } from "../websocket/ws.server";

let channel: amqp.Channel;

const QUEUE_NAME = config.ALERT_QUEUE_NAME as string;

export const connectQueue = async () => {
  const connection = await amqp.connect(config.RABBITMQ_URI as string);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log(`Alerts Service RabbitMQ connected`.bgRed.bold);

  await consumeAlerts();
};

export const publishAlert = async (alertData: any) => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(alertData)), { persistent: true });
};

const consumeAlerts = async () => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");

  await channel.consume(QUEUE_NAME, async (msg: any) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString());

      if (data.action === "delete") {
        // Handle delete action
        await deleteAlert(data.id);
        broadcastAlertUpdate({ event: "delete_alert", data: data.id });
      } else {
        // Handle create action
        const alert = await createAlert({
          type: data.type,
          message: data.message,
        });
        broadcastAlertUpdate({ event: "new_alert", data: alert });
      }

      channel.ack(msg);
    }
  });
};