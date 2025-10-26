import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  RABBITMQ_URI: process.env.RABBITMQ_URI,
  CUSTOMER_QUEUE_NAME:process.env.ANALYTICS_QUEUE_NAME,
};
