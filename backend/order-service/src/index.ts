// index.ts
import express from "express";
import cors from "cors";
import "colors";
import mongoose from "mongoose";
import { config } from "./config/env.config";
import ordersRouter from "./routes/orders.route";
import salesRouter from "./routes/sales.routes";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/error.handler";
import { connectQueue, consumeEvents, EventMessage } from "./queues/order.queue";
import { startProductConsumer } from "./queues/product.consumer";
import { connectProductQueue } from "./queues/product.queue";
import { WebSocketServer } from "ws";

const app = express();

// WebSocket server setup
const wsPort = parseInt(config.WS_PORT as string, 10) || 8081;
const wss = new WebSocketServer({ port: wsPort }, () => {
  console.log(`WebSocket server running on ws://localhost:${wsPort}`.bgCyan.bold);
});

wss.on("connection", (ws) => {
  console.log("WebSocket client connected".bgCyan.bold);
  ws.on("close", () => console.log("WebSocket client disconnected".bgCyan.bold));
  ws.on("error", (error) => console.error("WebSocket server error:".bgRed.bold, error));
});

wss.on("error", (error) => {
  console.error(`WebSocket server failed to start: ${error.message}`.bgRed.bold);
});

const broadcastEvent = (event: string, data: EventMessage["data"]) => {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({ event, data }));
    }
  });
};

app.use(cors());
app.use(express.json());
app.use(logger);

app.use("/api/orders", ordersRouter);
app.use("/api/sales", salesRouter);
app.use(errorHandler);

const startServer = async () => {
  try {
    await mongoose.connect(config.MONGO_URI as string);
    console.log(`MongoDB connected`.bgYellow.bold);

    await connectQueue();
    await connectProductQueue();
    await startProductConsumer();

    // Consume RabbitMQ events and broadcast to WebSocket clients
    await consumeEvents((msg: EventMessage) => {
      broadcastEvent(msg.event, msg.data);
    });

    app.listen(config.PORT, () => {
      console.log(`Order Service running on port ${config.PORT}`.bgMagenta.bold);
    });
  } catch (err) {
    console.error("Failed to start server:".bgRed.bold, err);
  }
};

startServer();