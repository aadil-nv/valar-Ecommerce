import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  RABBITMQ_URI: process.env.RABBITMQ_URI,
  ANALYTICS_QUEUE_NAME:process.env.ANALYTICS_QUEUE_NAME,
  ORDER_QUEUE_NAME:process.env.ORDER_QUEUE_NAME,
  PRODUCT_QUEUE_NAME:process.env.PRODUCT_QUEUE_NAME,
};
