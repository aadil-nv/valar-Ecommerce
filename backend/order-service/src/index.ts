import express from "express";
import cors from "cors";
import "colors"
import mongoose from "mongoose";
import { config } from "./config/env.config";
import ordersRouter from "./routes/orders.route";
import salesRouter from "./routes/sales.routes";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/error.handler";
import { connectQueue } from "./queues/order.queue";
import { startProductConsumer } from "./queues/product.consumer";
import { connectProductQueue } from "./queues/product.queue";

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.use("/api/orders", ordersRouter);
app.use('/api/sales',salesRouter)
app.use(errorHandler);

const startServer = async () => {
  try {
    await mongoose.connect(config.MONGO_URI as string);
    console.log(`MongoDB connected`.bgYellow.bold);

    await connectQueue();
    await connectProductQueue();
    await startProductConsumer();

    app.listen(config.PORT, () => {
      console.log(`Order Service running on port ${config.PORT}`.bgMagenta.bold);
    });
  } catch (err) {
    console.error("Failed to start server", err);
  }
};

startServer();
