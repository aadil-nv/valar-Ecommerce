import express from "express";
import http from "http";
import cors from "cors";
import "colors";
import mongoose from "mongoose";
import { config } from "./config/env.config";
import analyticsRouter from "./routes/analytics";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/error.handler";
import { connectQueue } from "./queues/analytics.queue";
import { startWebSocketServer } from "./websockets/ws.server";
import { connectOrderQueue } from "./queues/order.queue";
import { connectProductQueue } from "./queues/product.queue";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(logger);

app.use("/api/analytics", analyticsRouter);
app.use(errorHandler);

const startServer = async () => {
  try {
    await mongoose.connect(config.MONGO_URI as string);
    console.log(`MongoDB connected`.bgYellow.white);

    await connectQueue();
    await connectOrderQueue() 
    await connectProductQueue()

    startWebSocketServer(server);

    server.listen(config.PORT, () => {
      console.log(`Analytics Service running on port ${config.PORT}`.bgCyan.bold);
    });
  } catch (err) {
    console.error("Failed to start server", err);
  }
};

startServer();
