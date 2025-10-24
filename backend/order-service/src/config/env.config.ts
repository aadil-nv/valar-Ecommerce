import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ,
  RABBITMQ_URI: process.env.RABBITMQ_URI ,
  PRODUCT_SERVICE_URL:process.env.PRODUCT_SERVICE_URL,
  ALERTS_SERVICE_URL:process.env.ALERTS_SERVICE_URL,
  ORDER_QUEUE_NAME:process.env.ORDER_QUEUE_NAME,
  PRODUCT_QUEUE_NAME:process.env.PRODUCT_QUEUE_NAME,

};
