import express from "express";
import http from "http";
import cors from "cors";
import "colors";
import mongoose from "mongoose";
import { config } from "./config/env.config";
import alertsRouter from "./routes/alert.routes";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/error.handler";
import { connectQueue } from "./queues/alerts.queue";
import { startWebSocketServer } from "./websocket/ws.server";

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(logger);

app.use("/api/alerts", alertsRouter);
app.use(errorHandler);

const startServer = async () => {
  try {
    await mongoose.connect(config.MONGO_URI as string);
    console.log(`MongoDB connected for Alerts Service`.bgYellow.bold);

    await connectQueue();

    startWebSocketServer(server);

    server.listen(config.PORT, () => {
      console.log(`Alerts Service running on port ${config.PORT}`.bgGreen.bold);
    });
  } catch (err) {
    console.error("Failed to start Alerts Service", err);
  }
};

startServer();
