import express from "express";
import cors from "cors";
import "colors"
import mongoose from "mongoose";
import { config } from "./config/env.config";
import productsRouter from "./routes/products.route";
import categoryRouter from "./routes/category.route";
import { logger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/error.handler";
import { connectQueue } from "./queues/product.queue";
import { startOrderConsumer } from "./queues/order.consumer";
import { connectOrderQueue } from "./queues/order.queue";

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

app.use("/api/products", productsRouter);
app.use("/api/categories", categoryRouter); // Temporary: categories handled in product service
app.use(errorHandler);

const startServer = async () => {
  try {
    await mongoose.connect(config.MONGO_URI as string);
    console.log(`MongoDB connected`.bgYellow.white);

    await connectQueue();
    await connectOrderQueue()
    await startOrderConsumer();

    app.listen(config.PORT, () => {
      console.log(`Product Service running on port ${config.PORT}`.bgBlue.white);
    });
  } catch (err) {
    console.error("Failed to start server", err);
  }
};

startServer();
